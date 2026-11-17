-- Reversão de 0009 (aplicar como NOVA migração 0010 se necessário; nunca editar 0009).
-- Preserva os registros: a tabela de trocas de versão e o histórico ficam (só perdem as travas).
DROP POLICY IF EXISTS "Admins upload deployment files" ON storage.objects;
CREATE POLICY "Admins upload deployment files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='deployment-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update deployment files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='deployment-files' AND public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS system_installations_guard ON public.system_installations;
DROP TRIGGER IF EXISTS system_templates_version_history ON public.system_templates;
DROP TRIGGER IF EXISTS immutable_template_versions ON public.system_template_versions;
DROP TRIGGER IF EXISTS immutable_version_changes ON public.installation_version_changes;
DROP TRIGGER IF EXISTS immutable_installation_audit ON public.installation_audit;
DROP FUNCTION IF EXISTS public.installation_upgrade_template(uuid,text,text);
DROP INDEX IF EXISTS public.system_installations_one_active_per_order;
GRANT UPDATE, DELETE ON public.system_template_versions TO authenticated;
COMMENT ON TABLE public.installation_version_changes IS 'DEPRECATED: travas da 0009 revertidas; mantida como histórico';
-- Bucket: voltar allowed_mime_types para vazio pela ferramenta de armazenamento, se desejado.
