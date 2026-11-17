CREATE OR REPLACE FUNCTION public.plan_allowed_features(_plan text) RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT CASE lower(coalesce(_plan,''))
    WHEN 'agenda' THEN ARRAY['agendamentos','clientes','servicos','horarios']
    WHEN 'gestao' THEN ARRAY['agendamentos','clientes','servicos','horarios','estoque','produtos','vendas','financeiro']
    WHEN 'premium' THEN ARRAY['agendamentos','clientes','servicos','horarios','estoque','produtos','vendas','financeiro','insumos','consumo_materiais','multiprofissional']
    ELSE ARRAY[]::text[] END
$$;

CREATE TABLE public.system_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 160),
  description text,
  hosting_platform text NOT NULL DEFAULT 'Lovable',
  source_project_url text,
  github_repo text,
  current_version text NOT NULL DEFAULT '0.1',
  images text[] NOT NULL DEFAULT '{}',
  features text[] NOT NULL DEFAULT '{}',
  compatible_plans text[] NOT NULL DEFAULT '{}' CHECK (compatible_plans <@ ARRAY['agenda','gestao','premium']),
  duplication_instructions text,
  homologation_status text NOT NULL DEFAULT 'em_homologacao' CHECK (homologation_status IN ('rascunho','em_homologacao','homologado','suspenso')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_templates TO authenticated;
GRANT ALL ON public.system_templates TO service_role;
ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.system_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.system_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.system_templates(id) ON DELETE CASCADE,
  version text NOT NULL,
  notes text,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_template_versions TO authenticated;
GRANT ALL ON public.system_template_versions TO service_role;
ALTER TABLE public.system_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage template versions" ON public.system_template_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.system_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.business_orders(id) ON DELETE RESTRICT,
  template_id uuid NOT NULL REFERENCES public.system_templates(id) ON DELETE RESTRICT,
  buyer_user_id uuid,
  contracted_plan text NOT NULL,
  establishment_name text,
  domain text,
  edit_url text,
  preview_url text,
  external_installation_id text,
  template_version text,
  enabled_features text[] NOT NULL DEFAULT '{}',
  materials_notes text,
  pending_notes text,
  status text NOT NULL DEFAULT 'preparando' CHECK (status IN ('preparando','copia_criada','personalizando','em_conferencia','aguardando_aprovacao','ajustes_solicitados','aprovado','entregue','cancelado')),
  delivered_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX system_installations_order_idx ON public.system_installations(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_installations TO authenticated;
GRANT ALL ON public.system_installations TO service_role;
ALTER TABLE public.system_installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage installations" ON public.system_installations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.installation_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id uuid NOT NULL REFERENCES public.system_installations(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  label text NOT NULL,
  position int NOT NULL DEFAULT 0,
  done boolean NOT NULL DEFAULT false,
  notes text,
  evidence_url text,
  done_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (installation_id, step_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.installation_checklist_items TO authenticated;
GRANT ALL ON public.installation_checklist_items TO service_role;
ALTER TABLE public.installation_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage checklist" ON public.installation_checklist_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.validate_system_installation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o record; t record; extra text[];
BEGIN
  SELECT user_id, module_plan, business_name INTO o FROM business_orders WHERE id = NEW.order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  NEW.contracted_plan := lower(o.module_plan);
  NEW.buyer_user_id := o.user_id;
  IF TG_OP='INSERT' AND NEW.establishment_name IS NULL THEN NEW.establishment_name := o.business_name; END IF;
  SELECT compatible_plans, homologation_status, current_version INTO t FROM system_templates WHERE id = NEW.template_id;
  IF NOT (NEW.contracted_plan = ANY(t.compatible_plans)) THEN RAISE EXCEPTION 'Modelo não é compatível com o plano contratado (%)', NEW.contracted_plan; END IF;
  IF NEW.template_version IS NULL THEN NEW.template_version := t.current_version; END IF;
  SELECT array_agg(f) INTO extra FROM unnest(NEW.enabled_features) f WHERE NOT (f = ANY(public.plan_allowed_features(NEW.contracted_plan)));
  IF extra IS NOT NULL THEN RAISE EXCEPTION 'Recursos fora do plano contratado: %', array_to_string(extra, ', '); END IF;
  IF NEW.status='entregue' AND NEW.delivered_at IS NULL THEN NEW.delivered_at := now(); END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER system_installations_validate BEFORE INSERT OR UPDATE ON public.system_installations FOR EACH ROW EXECUTE FUNCTION public.validate_system_installation();

CREATE OR REPLACE FUNCTION public.seed_installation_checklist() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO installation_checklist_items(installation_id, step_key, label, position)
  SELECT NEW.id, k, l, p FROM (VALUES
   ('marca','Nome e marca',1),('logo','Logo e favicon',2),('cores','Cores',3),('fotos','Fotos',4),('portfolio','Portfólio',5),
   ('contato','Contato',6),('servicos','Serviços e preços',7),('horarios','Horários',8),('dominio','Domínio',9),
   ('admin','Usuário administrador',10),('teste_agendamento','Testes de agendamento',11),('mobile','Verificação mobile',12),('permissoes','Confirmação das permissões do plano',13)
  ) v(k,l,p);
  RETURN NEW;
END $$;
CREATE TRIGGER system_installations_checklist AFTER INSERT ON public.system_installations FOR EACH ROW EXECUTE FUNCTION public.seed_installation_checklist();

CREATE OR REPLACE FUNCTION public.touch_checklist_item() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at := now(); NEW.done_at := CASE WHEN NEW.done THEN coalesce(NEW.done_at, now()) ELSE NULL END; RETURN NEW; END $$;
CREATE TRIGGER installation_checklist_touch BEFORE UPDATE ON public.installation_checklist_items FOR EACH ROW EXECUTE FUNCTION public.touch_checklist_item();

INSERT INTO public.system_templates(name, description, hosting_platform, current_version, features, compatible_plans, duplication_instructions, homologation_status)
VALUES ('AgendaAÍ Profissional — Modelo de Agendamentos','Modelo de site com agendamento online baseado na estrutura do projeto Eric Zambonini (sem dados reais).','Lovable','0.1 (a confirmar)',
 ARRAY['agendamentos','clientes','servicos','horarios'], ARRAY['agenda','gestao','premium'],
 'Duplicar manualmente o projeto original na plataforma, sem copiar dados de clientes. Nunca editar o projeto original.','em_homologacao');