-- AgendaAÍ Pro · Implantações: proteções no banco (NÃO aplicada; aguarda aprovação)
-- Aditiva: não altera nem apaga dados. Verificado antes: 0 implantações e 0 duplicidades.

-- 1) Uma implantação ativa por pedido (canceladas não contam)
CREATE UNIQUE INDEX IF NOT EXISTS system_installations_one_active_per_order
  ON public.system_installations(order_id) WHERE status <> 'cancelado';

-- 2) Versão do modelo congelada + entrega validada no servidor
CREATE OR REPLACE FUNCTION public.guard_installation_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record; ph text; missing text[] := '{}'; pend int;
BEGIN
  IF NEW.order_id IS DISTINCT FROM OLD.order_id OR NEW.template_id IS DISTINCT FROM OLD.template_id THEN
    RAISE EXCEPTION 'Pedido e modelo da implantação não podem ser trocados'; END IF;
  IF NEW.template_version IS DISTINCT FROM OLD.template_version
     AND coalesce(current_setting('app.installation_upgrade', true), '') <> 'on' THEN
    RAISE EXCEPTION 'A versão do modelo só muda por atualização técnica registrada'; END IF;
  IF NEW.status = 'entregue' AND OLD.status <> 'entregue' THEN
    SELECT contract_flow, stage INTO o FROM business_orders WHERE id = NEW.order_id;
    SELECT phase INTO ph FROM order_workspaces WHERE order_id = NEW.order_id;
    IF (o.contract_flow = 'direct' AND ph IS DISTINCT FROM 'approved')
       OR (o.contract_flow <> 'direct' AND o.stage NOT IN ('ready','active')) THEN missing := missing || 'aprovação do pedido'; END IF;
    IF coalesce(trim(NEW.external_installation_id),'') = '' THEN missing := missing || 'identificador da instalação'; END IF;
    IF coalesce(trim(NEW.domain),'') = '' AND coalesce(trim(NEW.preview_url),'') = '' THEN missing := missing || 'domínio ou link de entrega'; END IF;
    IF cardinality(NEW.enabled_features) = 0 THEN missing := missing || 'conferência dos módulos do plano'; END IF;
    SELECT count(*) INTO pend FROM installation_checklist_items WHERE installation_id = NEW.id AND NOT done;
    IF pend > 0 THEN missing := missing || (pend || ' etapa(s) do checklist'); END IF;
    IF cardinality(missing) > 0 THEN RAISE EXCEPTION 'Não é possível marcar como entregue. Falta: %', array_to_string(missing, ', '); END IF;
    NEW.delivered_at := now();
  ELSIF NEW.status <> 'entregue' THEN NEW.delivered_at := OLD.delivered_at;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER system_installations_guard BEFORE UPDATE ON public.system_installations
  FOR EACH ROW EXECUTE FUNCTION public.guard_installation_update();

-- 3) Atualização técnica explícita de versão (admin), auditada na mesma transação
CREATE OR REPLACE FUNCTION public.installation_upgrade_template(p_installation uuid, p_version text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE old_v text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT template_version INTO old_v FROM system_installations WHERE id = p_installation FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Implantação não encontrada'; END IF;
  IF NOT EXISTS (SELECT 1 FROM system_template_versions v JOIN system_installations i ON i.template_id = v.template_id
                 WHERE i.id = p_installation AND v.version = p_version) THEN RAISE EXCEPTION 'Versão não registrada no modelo'; END IF;
  PERFORM set_config('app.installation_upgrade', 'on', true);
  UPDATE system_installations SET template_version = p_version WHERE id = p_installation;
  INSERT INTO installation_audit(installation_id, actor_id, action, details)
  VALUES (p_installation, auth.uid(), 'template_upgrade', jsonb_build_object('versao_anterior', old_v, 'versao_nova', p_version));
END $$;
REVOKE EXECUTE ON FUNCTION public.installation_upgrade_template(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.installation_upgrade_template(uuid, text) TO authenticated;

-- 4) Histórico de versões do modelo gravado junto com a troca (transacional) e imutável
CREATE OR REPLACE FUNCTION public.record_template_version()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.current_version IS DISTINCT FROM OLD.current_version THEN
    INSERT INTO system_template_versions(template_id, version, notes)
    VALUES (NEW.id, NEW.current_version, CASE WHEN TG_OP='UPDATE' THEN 'Anterior: ' || OLD.current_version END)
    ON CONFLICT (template_id, version) DO NOTHING;
  END IF; RETURN NEW;
END $$;
CREATE TRIGGER system_templates_version_history AFTER INSERT OR UPDATE OF current_version ON public.system_templates
  FOR EACH ROW EXECUTE FUNCTION public.record_template_version();
CREATE OR REPLACE FUNCTION public.guard_template_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'O histórico de versões do modelo não pode ser alterado ou excluído'; END $$;
CREATE TRIGGER immutable_template_versions BEFORE UPDATE OR DELETE ON public.system_template_versions
  FOR EACH ROW EXECUTE FUNCTION public.guard_template_version();
REVOKE UPDATE, DELETE ON public.system_template_versions FROM authenticated;

-- 5) Auditoria somente leitura pela API
REVOKE INSERT, UPDATE, DELETE ON public.installation_audit FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.log_installation_activity() FROM PUBLIC, anon, authenticated;

-- 6) Storage: arquivo só dentro da pasta de uma implantação existente, sem sobrescrever
DROP POLICY IF EXISTS "Admins upload deployment files" ON storage.objects;
DROP POLICY IF EXISTS "Admins update deployment files" ON storage.objects;
CREATE POLICY "Admins upload deployment files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deployment-files' AND public.has_role(auth.uid(), 'admin')
    AND array_length(storage.foldername(name), 1) = 1
    AND EXISTS (SELECT 1 FROM public.system_installations i WHERE i.id::text = (storage.foldername(name))[1])
    AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','mp4','mov','webm','pdf'));

-- 7) Fora do SQL (ferramenta de armazenamento): restringir tipos do bucket deployment-files a
--    image/jpeg, image/png, image/webp, video/mp4, video/quicktime, video/webm, application/pdf (limite 20 MB já ativo).
