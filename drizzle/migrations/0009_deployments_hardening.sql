-- 0009_deployments_hardening — AgendaAÍ Pro · Implantações
-- STATUS: PENDENTE. Não aplicada. Aplicar somente após autorização explícita do dono,
-- byte a byte, pela ferramenta de migração (vira 0009 no journal, depois de 0008).
-- Incremental: depende de 0007 e 0008; não recria nada delas. Não altera pedidos,
-- contratos, pagamentos, Stripe nem dados existentes (apenas registra no histórico a
-- versão atual dos modelos já cadastrados).

-- 1) Uma implantação ativa por pedido (canceladas não contam)
CREATE UNIQUE INDEX system_installations_one_active_per_order
  ON public.system_installations(order_id) WHERE status <> 'cancelado';

-- 2) Registro obrigatório e imutável de troca de versão
CREATE TABLE public.installation_version_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id uuid NOT NULL REFERENCES public.system_installations(id) ON DELETE RESTRICT,
  previous_version text NOT NULL,
  new_version text NOT NULL CHECK (length(new_version) BETWEEN 1 AND 80),
  admin_id uuid NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 3 AND 500),
  changed_at timestamptz NOT NULL DEFAULT now(),
  tx_id bigint NOT NULL DEFAULT txid_current(),
  CHECK (previous_version <> new_version)
);
CREATE INDEX installation_version_changes_inst_idx ON public.installation_version_changes(installation_id, changed_at DESC);
GRANT SELECT ON public.installation_version_changes TO authenticated;
GRANT ALL ON public.installation_version_changes TO service_role;
ALTER TABLE public.installation_version_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read version changes" ON public.installation_version_changes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3) Guarda da implantação: pedido/modelo fixos, versão só via operação autorizada,
--    transições de estado válidas, entrega validada e data de entrega imutável
CREATE OR REPLACE FUNCTION public.installation_status_allowed(p_from text, p_to text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT p_from = p_to OR (p_from, p_to) IN (
    ('preparando','copia_criada'),
    ('copia_criada','personalizando'),
    ('personalizando','em_conferencia'),
    ('em_conferencia','aguardando_aprovacao'), ('em_conferencia','personalizando'),
    ('aguardando_aprovacao','aprovado'), ('aguardando_aprovacao','ajustes_solicitados'),
    ('ajustes_solicitados','personalizando'), ('ajustes_solicitados','em_conferencia'),
    ('aprovado','entregue'), ('aprovado','ajustes_solicitados'))
  OR (p_to = 'cancelado' AND p_from NOT IN ('entregue','cancelado'))
$$;

CREATE OR REPLACE FUNCTION public.guard_installation_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record; ph text; missing text[] := '{}'; pend int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'preparando'; NEW.delivered_at := NULL;
    NEW.template_version := NULL;  -- preenchida pelo modelo em validate_system_installation
    RETURN NEW;
  END IF;
  IF NEW.order_id IS DISTINCT FROM OLD.order_id OR NEW.template_id IS DISTINCT FROM OLD.template_id THEN
    RAISE EXCEPTION 'Pedido e modelo da implantação não podem ser trocados'; END IF;
  IF NEW.template_version IS DISTINCT FROM OLD.template_version AND NOT EXISTS (
       SELECT 1 FROM installation_version_changes c
       WHERE c.installation_id = NEW.id AND c.tx_id = txid_current()
         AND c.previous_version = OLD.template_version AND c.new_version = NEW.template_version) THEN
    RAISE EXCEPTION 'A versão do modelo só muda pela atualização técnica autorizada'; END IF;
  IF NOT public.installation_status_allowed(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'Transição de estado inválida: % → %', OLD.status, NEW.status; END IF;
  IF NEW.status = 'entregue' AND OLD.status <> 'entregue' THEN
    SELECT contract_flow, stage INTO o FROM business_orders WHERE id = NEW.order_id;
    SELECT phase INTO ph FROM order_workspaces WHERE order_id = NEW.order_id;
    IF (o.contract_flow = 'direct' AND ph IS DISTINCT FROM 'approved')
       OR (o.contract_flow IS DISTINCT FROM 'direct' AND o.stage NOT IN ('ready','active')) THEN missing := missing || 'aprovação do pedido'::text; END IF;
    IF coalesce(trim(NEW.external_installation_id),'') = '' THEN missing := missing || 'identificador da instalação'::text; END IF;
    IF coalesce(trim(NEW.domain),'') = '' AND coalesce(trim(NEW.preview_url),'') = '' THEN missing := missing || 'domínio ou link de entrega'::text; END IF;
    IF cardinality(NEW.enabled_features) = 0 THEN missing := missing || 'conferência dos módulos do plano'::text; END IF;
    SELECT count(*) INTO pend FROM installation_checklist_items WHERE installation_id = NEW.id AND NOT done;
    IF pend > 0 THEN missing := missing || (pend || ' etapa(s) do checklist'); END IF;
    IF cardinality(missing) > 0 THEN RAISE EXCEPTION 'Não é possível marcar como entregue. Falta: %', array_to_string(missing, ', '); END IF;
    NEW.delivered_at := now();
  ELSE
    NEW.delivered_at := OLD.delivered_at;  -- nunca alterada fora da transição para entregue
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_installation_write() FROM PUBLIC, anon, authenticated;
-- nome ordena antes de system_installations_validate (gatilhos BEFORE rodam em ordem alfabética)
CREATE TRIGGER system_installations_guard BEFORE INSERT OR UPDATE ON public.system_installations
  FOR EACH ROW EXECUTE FUNCTION public.guard_installation_write();

-- 4) Operação autorizada de troca de versão (admin autenticado, versão registrada, motivo)
CREATE OR REPLACE FUNCTION public.installation_upgrade_template(p_installation uuid, p_version text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE i record; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT id, template_id, template_version, status INTO i FROM system_installations WHERE id = p_installation FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Implantação não encontrada'; END IF;
  IF i.status = 'cancelado' THEN RAISE EXCEPTION 'Implantação cancelada'; END IF;
  IF i.template_version IS NOT DISTINCT FROM p_version THEN RAISE EXCEPTION 'A implantação já usa esta versão'; END IF;
  IF NOT EXISTS (SELECT 1 FROM system_template_versions WHERE template_id = i.template_id AND version = p_version) THEN
    RAISE EXCEPTION 'Versão não registrada no modelo'; END IF;
  INSERT INTO installation_version_changes(installation_id, previous_version, new_version, admin_id, reason)
  VALUES (i.id, coalesce(i.template_version, ''), p_version, uid, p_reason);
  UPDATE system_installations SET template_version = p_version WHERE id = i.id;
  INSERT INTO installation_audit(installation_id, actor_id, action, details)
  VALUES (i.id, uid, 'template_upgrade', jsonb_build_object('versao_anterior', i.template_version, 'versao_nova', p_version, 'motivo', p_reason));
END $$;
REVOKE EXECUTE ON FUNCTION public.installation_upgrade_template(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.installation_upgrade_template(uuid, text, text) TO authenticated;

-- 5) Histórico de versões dos modelos: transacional, imutável, preservando as existentes
INSERT INTO public.system_template_versions(template_id, version, notes)
SELECT id, current_version, 'Versão existente na aplicação da migração 0009' FROM public.system_templates
ON CONFLICT (template_id, version) DO NOTHING;
CREATE OR REPLACE FUNCTION public.record_template_version()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO system_template_versions(template_id, version, notes)
  VALUES (NEW.id, NEW.current_version, CASE WHEN TG_OP = 'UPDATE' THEN 'Anterior: ' || OLD.current_version END)
  ON CONFLICT (template_id, version) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.record_template_version() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER system_templates_version_history AFTER INSERT OR UPDATE OF current_version ON public.system_templates
  FOR EACH ROW EXECUTE FUNCTION public.record_template_version();
CREATE OR REPLACE FUNCTION public.guard_immutable_row()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Registro histórico não pode ser alterado ou excluído (%)', TG_TABLE_NAME; END $$;
CREATE TRIGGER immutable_template_versions BEFORE UPDATE OR DELETE ON public.system_template_versions
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_row();
CREATE TRIGGER immutable_version_changes BEFORE UPDATE OR DELETE ON public.installation_version_changes
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_row();
CREATE TRIGGER immutable_installation_audit BEFORE UPDATE OR DELETE ON public.installation_audit
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_row();
REVOKE UPDATE, DELETE ON public.system_template_versions FROM authenticated, anon;

-- 6) Auditoria somente leitura pela API
REVOKE INSERT, UPDATE, DELETE ON public.installation_audit FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.installation_version_changes FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.log_installation_activity() FROM PUBLIC, anon, authenticated;

-- 7) Arquivos: só na pasta de uma implantação existente, nome gerado pelo sistema,
--    extensões aprovadas; sem UPDATE (impede sobrescrever ou mover para fora da pasta)
DROP POLICY "Admins upload deployment files" ON storage.objects;
DROP POLICY "Admins update deployment files" ON storage.objects;
CREATE POLICY "Admins upload deployment files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deployment-files' AND public.has_role(auth.uid(), 'admin')
    AND name ~ '^[0-9a-f-]{36}/[0-9a-f]{8}-[A-Za-z0-9_-]{1,60}\.(jpg|jpeg|png|webp|mp4|mov|webm|pdf)$'
    AND EXISTS (SELECT 1 FROM public.system_installations i
                WHERE i.id::text = (storage.foldername(name))[1] AND i.status <> 'cancelado'));
-- Fora do SQL (ferramenta de armazenamento, no mesmo passo autorizado):
--   deployment-files: privado, 20 MB, MIME image/jpeg, image/png, image/webp,
--   video/mp4, video/quicktime, video/webm, application/pdf.