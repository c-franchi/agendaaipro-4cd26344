-- Simulação mínima do ambiente Supabase para testes locais (nunca aplicar no banco real)
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth; CREATE SCHEMA storage;
GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TABLE public.user_roles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, role app_role NOT NULL);
CREATE FUNCTION public.has_role(_user_id uuid,_role app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE TABLE public.business_orders(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, module_plan text NOT NULL, business_name text, contract_flow text NOT NULL DEFAULT 'direct', stage text NOT NULL DEFAULT 'queued');
CREATE TABLE public.order_workspaces(order_id uuid PRIMARY KEY REFERENCES public.business_orders(id), phase text NOT NULL DEFAULT 'collecting');
GRANT SELECT ON public.business_orders, public.order_workspaces TO authenticated;
CREATE TABLE storage.buckets(id text PRIMARY KEY, public boolean, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid DEFAULT auth.uid(), UNIQUE(bucket_id,name));
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
CREATE FUNCTION storage.extension(name text) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT reverse(split_part(reverse(name),'.',1)) $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
INSERT INTO storage.buckets VALUES ('deployment-files', false, 20971520, NULL);
