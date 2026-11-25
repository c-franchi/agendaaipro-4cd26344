\set ON_ERROR_STOP 1
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
\ir ../../drizzle/pending/0011_affiliate_self_access.sql

INSERT INTO affiliates(id,code,name,email) VALUES
 ('f0000000-0000-0000-0000-000000000002','MARIA','Maria Teste','Maria@example.test'),
 ('f0000000-0000-0000-0000-000000000003','PEDRO','Pedro Teste','pedro@example.test');
INSERT INTO affiliate_commissions(affiliate_id,order_id,event_id,kind,base_cents,rate,commission_cents) VALUES
 ('f0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','evt_maria','setup',100000,0.15,15000),
 ('f0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001','evt_pedro','monthly',19900,0.05,995);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000002',false);
SELECT set_config('request.jwt.claims','{"email":"maria@example.test"}',false);
DO $$BEGIN
 IF (SELECT count(*) FROM affiliates)<>1 OR NOT EXISTS(SELECT 1 FROM affiliates WHERE code='MARIA') THEN RAISE 'FALHOU: cadastro próprio'; END IF;
 IF (SELECT count(*) FROM affiliate_commissions)<>1 OR NOT EXISTS(SELECT 1 FROM affiliate_commissions WHERE event_id='evt_maria' AND commission_cents=15000) THEN RAISE 'FALHOU: comissão própria'; END IF;
 IF EXISTS(SELECT 1 FROM affiliates WHERE code='PEDRO') OR EXISTS(SELECT 1 FROM affiliate_commissions WHERE event_id='evt_pedro') THEN RAISE 'FALHOU: vazamento entre afiliados'; END IF;
 UPDATE affiliates SET email='maria@example.test' WHERE code='PEDRO';
 IF FOUND THEN RAISE 'FALHOU: tomou cadastro alheio'; END IF;
 UPDATE affiliates SET pix_key='alterado' WHERE code='MARIA';
 IF FOUND THEN RAISE 'FALHOU: afiliado editou cadastro'; END IF;
 UPDATE affiliate_commissions SET status='paid' WHERE event_id='evt_maria';
 IF FOUND THEN RAISE 'FALHOU: afiliado deu baixa'; END IF;
 BEGIN
  INSERT INTO affiliates(code,name,email) VALUES ('INVASOR','Invasor','maria@example.test');
  RAISE 'FALHOU: autocadastro autorizado';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END$$;
SELECT set_config('request.jwt.claims','{"email":"pedro@example.test"}',false);
DO $$BEGIN
 IF (SELECT count(*) FROM affiliates)<>1 OR NOT EXISTS(SELECT 1 FROM affiliates WHERE code='PEDRO') THEN RAISE 'FALHOU: cadastro Pedro'; END IF;
 IF (SELECT count(*) FROM affiliate_commissions)<>1 OR NOT EXISTS(SELECT 1 FROM affiliate_commissions WHERE event_id='evt_pedro' AND commission_cents=995) THEN RAISE 'FALHOU: comissão Pedro'; END IF;
END$$;
SELECT set_config('request.jwt.claims','{"email":"estranho@example.test","user_metadata":{"email":"maria@example.test","role":"admin"}}',false);
DO $$BEGIN
 IF (SELECT count(*) FROM affiliates)<>0 OR (SELECT count(*) FROM affiliate_commissions)<>0 THEN RAISE 'FALHOU: usuário não vinculado ou metadados concedem acesso'; END IF;
END$$;
SELECT set_config('request.jwt.claims','{}',false);
DO $$BEGIN IF EXISTS(SELECT 1 FROM affiliates) OR EXISTS(SELECT 1 FROM affiliate_commissions) THEN RAISE 'FALHOU: sessão sem e-mail'; END IF; END$$;
RESET ROLE;
SET ROLE anon;
DO $$BEGIN
 BEGIN PERFORM 1 FROM affiliates; RAISE 'FALHOU: anônimo leu cadastro'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM 1 FROM affiliate_commissions; RAISE 'FALHOU: anônimo leu comissões'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END$$;
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000001',false);
DO $$BEGIN
 IF (SELECT count(*) FROM affiliates)<>3 OR (SELECT count(*) FROM affiliate_commissions)<>5 THEN RAISE 'FALHOU: acesso admin'; END IF;
 UPDATE affiliates SET email='joao@example.test' WHERE code='JOAO';
 IF NOT FOUND THEN RAISE 'FALHOU: admin vincula e-mail'; END IF;
END$$;
RESET ROLE;
DO $$BEGIN
 BEGIN INSERT INTO affiliates(code,name,email) VALUES ('DUPLICADO','Duplicado','MARIA@example.test'); RAISE 'FALHOU: e-mail duplicado'; EXCEPTION WHEN unique_violation THEN NULL; END;
END$$;
\ir ../../drizzle/pending/0011_affiliate_self_access.rollback.sql
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000002',false);
SELECT set_config('request.jwt.claims','{"email":"maria@example.test"}',false);
DO $$BEGIN IF EXISTS(SELECT 1 FROM affiliates) OR EXISTS(SELECT 1 FROM affiliate_commissions) THEN RAISE 'FALHOU: reversão não fechou acesso'; END IF; END$$;
RESET ROLE;
\echo OK acesso próprio, isolamento, recusa de alterações, anônimo, admin, unicidade e reversão