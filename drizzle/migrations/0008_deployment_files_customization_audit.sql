CREATE POLICY "Admins read deployment files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='deployment-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins upload deployment files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='deployment-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update deployment files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='deployment-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete deployment files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='deployment-files' AND public.has_role(auth.uid(),'admin'));

CREATE TABLE public.installation_customizations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 installation_id uuid NOT NULL REFERENCES public.system_installations(id) ON DELETE CASCADE,
 area text NOT NULL CHECK (area IN ('identidade','servicos','horarios','links')),
 status text NOT NULL DEFAULT 'registrado' CHECK (status IN ('registrado','aplicado','validado')),
 details text,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(installation_id,area));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.installation_customizations TO authenticated;
GRANT ALL ON public.installation_customizations TO service_role;
ALTER TABLE public.installation_customizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage customizations" ON public.installation_customizations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.installation_audit(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 installation_id uuid NOT NULL,
 actor_id uuid,
 action text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.installation_audit TO authenticated;
GRANT ALL ON public.installation_audit TO service_role;
ALTER TABLE public.installation_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read installation audit" ON public.installation_audit FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX installation_audit_inst_idx ON public.installation_audit(installation_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.log_installation_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE iid uuid; d jsonb:='{}'::jsonb;
BEGIN
 IF TG_TABLE_NAME='system_installations' THEN iid:=NEW.id;
  IF TG_OP='UPDATE' THEN d:=jsonb_build_object('status_de',OLD.status,'status_para',NEW.status); ELSE d:=jsonb_build_object('status',NEW.status); END IF;
 ELSIF TG_TABLE_NAME='installation_checklist_items' THEN iid:=NEW.installation_id; d:=jsonb_build_object('etapa',NEW.step_key,'concluida',NEW.done);
 ELSE iid:=NEW.installation_id; d:=jsonb_build_object('area',NEW.area,'status',NEW.status); END IF;
 INSERT INTO installation_audit(installation_id,actor_id,action,details) VALUES(iid,auth.uid(),TG_TABLE_NAME||':'||lower(TG_OP),d);
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.seed_installation_customizations() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN INSERT INTO installation_customizations(installation_id,area) SELECT NEW.id,a FROM unnest(ARRAY['identidade','servicos','horarios','links']) a ON CONFLICT DO NOTHING; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.touch_customization() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at:=now(); RETURN NEW; END $$;

CREATE TRIGGER installation_customizations_seed AFTER INSERT ON public.system_installations FOR EACH ROW EXECUTE FUNCTION public.seed_installation_customizations();
CREATE TRIGGER installation_customizations_touch BEFORE UPDATE ON public.installation_customizations FOR EACH ROW EXECUTE FUNCTION public.touch_customization();
CREATE TRIGGER installation_audit_inst AFTER INSERT OR UPDATE ON public.system_installations FOR EACH ROW EXECUTE FUNCTION public.log_installation_activity();
CREATE TRIGGER installation_audit_check AFTER UPDATE ON public.installation_checklist_items FOR EACH ROW EXECUTE FUNCTION public.log_installation_activity();
CREATE TRIGGER installation_audit_custom AFTER UPDATE ON public.installation_customizations FOR EACH ROW EXECUTE FUNCTION public.log_installation_activity();

INSERT INTO public.installation_customizations(installation_id,area) SELECT i.id,a FROM public.system_installations i CROSS JOIN unnest(ARRAY['identidade','servicos','horarios','links']) a ON CONFLICT DO NOTHING;