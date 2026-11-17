-- Testes da 0009 em banco local descartável. Qualquer falha aborta (ON_ERROR_STOP).
\set ON_ERROR_STOP on
CREATE FUNCTION pg_temp.must_fail(q text, pat text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN BEGIN EXECUTE q; EXCEPTION WHEN OTHERS THEN
  IF SQLERRM !~* pat THEN RAISE EXCEPTION 'falhou com mensagem inesperada: % (esperado %)', SQLERRM, pat; END IF;
  RAISE NOTICE 'OK bloqueado: %', left(SQLERRM,90); RETURN; END;
RAISE EXCEPTION 'deveria falhar: %', q; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.must_fail(text,text) TO authenticated, anon;
CREATE FUNCTION pg_temp.check(c boolean, msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF NOT c THEN RAISE EXCEPTION 'FALHOU: %', msg; END IF; RAISE NOTICE 'OK %', msg; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.check(boolean,text) TO authenticated, anon;

-- dados fictícios (só neste banco local)
SELECT set_config('test.tid',(SELECT id::text FROM system_templates),false);
INSERT INTO user_roles(user_id,role) VALUES ('00000000-0000-0000-0000-00000000000a','admin');
INSERT INTO business_orders(id,user_id,module_plan,business_name,contract_flow) VALUES
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c','agenda','Salão Teste','direct');
INSERT INTO order_workspaces VALUES ('10000000-0000-0000-0000-000000000001','collecting');
SELECT pg_temp.check((SELECT count(*) FROM system_template_versions)=1, 'versão existente preservada no histórico');

-- RLS: cliente e anônimo não enxergam nem criam
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
SELECT pg_temp.must_fail($$INSERT INTO system_installations(order_id,template_id,contracted_plan) VALUES ('10000000-0000-0000-0000-000000000001',current_setting('test.tid')::uuid,'')$$, 'row-level security|permission');
SELECT pg_temp.must_fail($$SELECT installation_upgrade_template(gen_random_uuid(),'x','motivo')$$, 'Sem permiss');
RESET ROLE; SET ROLE anon;
SELECT pg_temp.must_fail($$SELECT * FROM installation_version_changes$$, 'permission');
SELECT pg_temp.must_fail($$SELECT installation_upgrade_template(gen_random_uuid(),'x','m')$$, 'permission');
RESET ROLE;

-- admin cria; servidor força estado/versão/data
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
INSERT INTO system_installations(id,order_id,template_id,contracted_plan,status,template_version,delivered_at)
 SELECT '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',id,'','entregue','9.9',now() FROM system_templates;
SELECT pg_temp.check((SELECT status='preparando' AND delivered_at IS NULL AND template_version='0.1 (a confirmar)' FROM system_installations), 'insert ignora estado/versão/data enviados pelo cliente');
SELECT pg_temp.must_fail($$INSERT INTO system_installations(order_id,template_id,contracted_plan) VALUES ('10000000-0000-0000-0000-000000000001',current_setting('test.tid')::uuid,'')$$, 'one_active_per_order|duplicate');
-- versão
SELECT pg_temp.must_fail($$UPDATE system_installations SET template_version='1.0'$$, 'só muda pela atualização');
SELECT pg_temp.must_fail($$INSERT INTO installation_version_changes(installation_id,previous_version,new_version,admin_id,reason) VALUES ('20000000-0000-0000-0000-000000000001','0.1 (a confirmar)','1.0','00000000-0000-0000-0000-00000000000a','forjado')$$, 'permission');
SELECT pg_temp.must_fail($$SELECT installation_upgrade_template('20000000-0000-0000-0000-000000000001','1.0','motivo ok')$$, 'não registrada');
UPDATE system_templates SET current_version='1.0';
SELECT pg_temp.check((SELECT count(*) FROM system_template_versions)=2, 'nova versão do modelo registrada automaticamente');
SELECT pg_temp.must_fail($$SELECT installation_upgrade_template('20000000-0000-0000-0000-000000000001','1.0','')$$, 'check|reason');
SELECT installation_upgrade_template('20000000-0000-0000-0000-000000000001','1.0','Correção de agenda');
SELECT pg_temp.check((SELECT template_version='1.0' FROM system_installations), 'versão trocada pela operação autorizada');
SELECT pg_temp.check((SELECT previous_version='0.1 (a confirmar)' AND new_version='1.0' AND admin_id='00000000-0000-0000-0000-00000000000a' AND changed_at IS NOT NULL FROM installation_version_changes), 'registro anterior/nova/admin/data');
SELECT pg_temp.must_fail($$UPDATE system_template_versions SET notes='x'$$, 'permission|histórico');
SELECT pg_temp.must_fail($$DELETE FROM installation_audit$$, 'permission');
-- transições
SELECT pg_temp.must_fail($$UPDATE system_installations SET status='entregue'$$, 'Transição de estado inválida');
SELECT pg_temp.must_fail($$UPDATE system_installations SET status='aprovado'$$, 'Transição de estado inválida');
UPDATE system_installations SET status='copia_criada'; UPDATE system_installations SET status='personalizando';
UPDATE system_installations SET status='em_conferencia'; UPDATE system_installations SET status='aguardando_aprovacao';
UPDATE system_installations SET status='aprovado';
UPDATE system_installations SET delivered_at=now()-interval '9 days';
RESET ROLE;
SELECT pg_temp.check((SELECT delivered_at IS NULL FROM system_installations), 'data de entrega não pode ser preenchida à mão');
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
-- entrega bloqueada até requisitos
SELECT pg_temp.must_fail($$UPDATE system_installations SET status='entregue'$$, 'aprovação do pedido.*identificador.*domínio.*módulos.*13 etapa');
RESET ROLE; UPDATE order_workspaces SET phase='approved'; SET ROLE authenticated;
UPDATE system_installations SET external_installation_id='inst-1', domain='salao.exemplo', enabled_features=ARRAY['agendamentos'];
SELECT pg_temp.must_fail($$UPDATE system_installations SET enabled_features=ARRAY['estoque']$$, 'fora do plano');
SELECT pg_temp.must_fail($$UPDATE system_installations SET status='entregue'$$, '13 etapa');
UPDATE installation_checklist_items SET done=true;
UPDATE system_installations SET status='entregue';
SELECT pg_temp.check((SELECT delivered_at IS NOT NULL FROM system_installations), 'entrega registrada pelo servidor');
CREATE TEMP TABLE d AS SELECT delivered_at FROM system_installations;
UPDATE system_installations SET delivered_at=now()+interval '1 year', pending_notes='obs';
SELECT pg_temp.check((SELECT i.delivered_at=d.delivered_at FROM system_installations i, d), 'data de entrega imutável após entrega');
SELECT pg_temp.must_fail($$UPDATE system_installations SET status='personalizando'$$, 'Transição de estado inválida');
SELECT pg_temp.must_fail($$UPDATE system_installations SET status='cancelado'$$, 'Transição de estado inválida');
SELECT pg_temp.must_fail($$UPDATE system_installations SET order_id=gen_random_uuid()$$, 'não podem ser trocados');
-- arquivos
INSERT INTO storage.objects(bucket_id,name) VALUES ('deployment-files','20000000-0000-0000-0000-000000000001/ab12cd34-logo.png');
SELECT pg_temp.must_fail($$INSERT INTO storage.objects(bucket_id,name) VALUES ('deployment-files','20000000-0000-0000-0000-000000000001/ab12cd34-logo.png')$$, 'duplicate|unique');
SELECT pg_temp.must_fail($$INSERT INTO storage.objects(bucket_id,name) VALUES ('deployment-files','20000000-0000-0000-0000-000000000001/ab12cd34-x.exe')$$, 'row-level');
SELECT pg_temp.must_fail($$INSERT INTO storage.objects(bucket_id,name) VALUES ('deployment-files','99999999-0000-0000-0000-000000000001/ab12cd34-x.png')$$, 'row-level');
SELECT pg_temp.must_fail($$INSERT INTO storage.objects(bucket_id,name) VALUES ('deployment-files','livre.png')$$, 'row-level');
UPDATE storage.objects SET name='fora/x.png';
SELECT pg_temp.check((SELECT name LIKE '20000000%' FROM storage.objects), 'arquivo não pode ser renomeado/sobrescrito (sem política UPDATE)');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
SELECT pg_temp.check((SELECT count(*) FROM storage.objects)=0, 'cliente não vê arquivos da implantação');
SELECT pg_temp.must_fail($$INSERT INTO storage.objects(bucket_id,name) VALUES ('deployment-files','20000000-0000-0000-0000-000000000001/ab12cd34-y.png')$$, 'row-level');
RESET ROLE;
-- service_role também passa pelas travas
SET ROLE service_role;
SELECT pg_temp.must_fail($$UPDATE system_installations SET template_version='0.1 (a confirmar)'$$, 'só muda pela atualização');
RESET ROLE;
\echo TODOS_OS_TESTES_PASSARAM
