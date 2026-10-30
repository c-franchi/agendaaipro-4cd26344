CREATE TABLE public.commerce_provider_settings(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),data jsonb NOT NULL,revision integer NOT NULL DEFAULT 1,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid REFERENCES auth.users(id));
ALTER TABLE public.commerce_provider_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.commerce_provider_settings FROM anon,authenticated;
GRANT SELECT ON public.commerce_provider_settings TO authenticated;
GRANT ALL ON public.commerce_provider_settings TO service_role;
CREATE POLICY provider_operator_read ON public.commerce_provider_settings FOR SELECT TO authenticated USING(lower(auth.jwt()->>'email')='neifranchi@gmail.com');
INSERT INTO public.commerce_provider_settings(data) VALUES('{"legal_name":"Claudinei Luiz Franchi","trade_name":"AgendaAÍ Pro","email":"neifranchi@gmail.com","tax_id":"","address":"","number":"","complement":"","district":"","city":"","state":"","zip":""}');
CREATE FUNCTION commerce_private.valid_tax_id(p_text text) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v text:=regexp_replace(coalesce(p_text,''),'[^0-9]','','g');n integer;total integer;digit integer;i integer;weights integer[];BEGIN
 n:=length(v);IF n NOT IN (11,14) OR v=repeat(left(v,1),n) THEN RETURN false;END IF;
 IF n=11 THEN
 total:=0;FOR i IN 1..9 LOOP total:=total+substring(v,i,1)::integer*(11-i);END LOOP;digit:=(total*10)%11;IF digit=10 THEN digit:=0;END IF;IF digit<>substring(v,10,1)::integer THEN RETURN false;END IF;
 total:=0;FOR i IN 1..10 LOOP total:=total+substring(v,i,1)::integer*(12-i);END LOOP;digit:=(total*10)%11;IF digit=10 THEN digit:=0;END IF;RETURN digit=substring(v,11,1)::integer;
 END IF;
 weights:=ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];total:=0;FOR i IN 1..12 LOOP total:=total+substring(v,i,1)::integer*weights[i];END LOOP;digit:=CASE WHEN total%11<2 THEN 0 ELSE 11-total%11 END;IF digit<>substring(v,13,1)::integer THEN RETURN false;END IF;
 weights:=ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];total:=0;FOR i IN 1..13 LOOP total:=total+substring(v,i,1)::integer*weights[i];END LOOP;digit:=CASE WHEN total%11<2 THEN 0 ELSE 11-total%11 END;RETURN digit=substring(v,14,1)::integer;
END$$;
REVOKE ALL ON FUNCTION commerce_private.valid_tax_id(text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION commerce_private.provider_action(p_action text DEFAULT 'get',p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE clean jsonb; item public.commerce_provider_settings;BEGIN
 IF auth.uid() IS NULL OR coalesce(lower(auth.jwt()->>'email'),'')<>'neifranchi@gmail.com' THEN RAISE EXCEPTION 'Acesso restrito ao administrador';END IF;
 IF p_action='save' THEN
 clean:=jsonb_build_object('legal_name',trim(p_data->>'legal_name'),'trade_name',trim(coalesce(p_data->>'trade_name','')),'tax_id',regexp_replace(coalesce(p_data->>'tax_id',''),'[^0-9]','','g'),'address',trim(p_data->>'address'),'number',trim(p_data->>'number'),'complement',trim(coalesce(p_data->>'complement','')),'district',trim(p_data->>'district'),'city',trim(p_data->>'city'),'state',upper(trim(p_data->>'state')),'zip',regexp_replace(coalesce(p_data->>'zip',''),'[^0-9]','','g'),'email',lower(trim(p_data->>'email')));
 IF coalesce(length(clean->>'legal_name'),0) NOT BETWEEN 2 AND 160 OR length(clean->>'trade_name')>100 OR NOT commerce_private.valid_tax_id(clean->>'tax_id') OR coalesce(length(clean->>'address'),0) NOT BETWEEN 5 AND 200 OR coalesce(length(clean->>'number'),0) NOT BETWEEN 1 AND 20 OR length(clean->>'complement')>100 OR coalesce(length(clean->>'district'),0) NOT BETWEEN 2 AND 100 OR coalesce(length(clean->>'city'),0) NOT BETWEEN 2 AND 100 OR coalesce(clean->>'state','') NOT IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') OR length(clean->>'zip')<>8 OR coalesce(clean->>'email','')!~'^[^ @]+@[^ @]+[.][^ @]+$' OR length(clean->>'email')>160 THEN RAISE EXCEPTION 'Confira nome, CPF/CNPJ válido, endereço completo, UF, CEP e e-mail';END IF;
 UPDATE commerce_provider_settings SET data=clean,revision=revision+1,updated_at=clock_timestamp(),updated_by=auth.uid() WHERE singleton;
 ELSIF p_action<>'get' THEN RAISE EXCEPTION 'Ação indisponível';END IF;
 SELECT * INTO item FROM commerce_provider_settings WHERE singleton;RETURN to_jsonb(item);
END$$;
REVOKE ALL ON FUNCTION commerce_private.provider_action(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION commerce_private.provider_action(text,jsonb) TO authenticated;
CREATE FUNCTION public.commerce_provider_settings(p_action text DEFAULT 'get',p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$SELECT commerce_private.provider_action(p_action,p_data)$$;
REVOKE ALL ON FUNCTION public.commerce_provider_settings(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commerce_provider_settings(text,jsonb) TO authenticated;
CREATE FUNCTION commerce_private.provider_document() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('provider',coalesce(nullif(data->>'trade_name',''),'AgendaAÍ Pro')||' · '||(data->>'legal_name')||CASE WHEN coalesce(data->>'tax_id','')<>'' THEN ' · CPF/CNPJ: '||(data->>'tax_id') ELSE '' END||CASE WHEN coalesce(data->>'address','')<>'' THEN ' · Endereço: '||(data->>'address')||', '||(data->>'number')||CASE WHEN coalesce(data->>'complement','')<>'' THEN ', '||(data->>'complement') ELSE '' END||' · '||(data->>'district')||' · '||(data->>'city')||'/'||(data->>'state')||' · CEP '||(data->>'zip') ELSE '' END||' · Atendimento: '||(data->>'email'),'providerRevision',revision) FROM commerce_provider_settings WHERE singleton
$$;
REVOKE ALL ON FUNCTION commerce_private.provider_document() FROM PUBLIC,anon,authenticated;
CREATE FUNCTION commerce_private.contract_template() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta';END IF;RETURN (SELECT document FROM commerce_contract_templates WHERE version='2026-10-30-v1' AND active)||commerce_private.provider_document();END$$;
REVOKE ALL ON FUNCTION commerce_private.contract_template() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION commerce_private.contract_template() TO authenticated;
CREATE FUNCTION public.commerce_contract_template() RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$SELECT commerce_private.contract_template()$$;
REVOKE ALL ON FUNCTION public.commerce_contract_template() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commerce_contract_template() TO authenticated;
CREATE OR REPLACE FUNCTION commerce_private.contract_document(p_plan text,p_quote jsonb,p_name text,p_email text) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT document||commerce_private.provider_document()||jsonb_build_object('customer',jsonb_build_object('name',p_name,'email',p_email),'plan',p_plan,'quote',p_quote,'modules',document->'modulesByPlan'->>p_plan) FROM commerce_contract_templates WHERE version='2026-10-30-v1' AND active
$$;

CREATE OR REPLACE FUNCTION commerce_private.request_offer(p_plan text,p_key uuid,p_contact jsonb,p_code text,p_fingerprint text,p_terms text) RETURNS public.business_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE q jsonb;o public.business_orders;phone text;BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'email','')='' THEN RAISE EXCEPTION 'Entre na sua conta';END IF;
 IF (p_contact->>'contractProviderRevision') IS DISTINCT FROM (SELECT revision::text FROM commerce_provider_settings WHERE singleton) THEN RAISE EXCEPTION 'Os dados do prestador mudaram. Atualize o resumo e confira o contrato novamente';END IF;
 IF p_contact->>'contractVersion' IS DISTINCT FROM '2026-10-30-v1' OR p_terms IS DISTINCT FROM '2026-10-28-v3' OR jsonb_typeof(p_contact)<>'object' THEN RAISE EXCEPTION 'Aceite as condições';END IF;
 SELECT * INTO o FROM business_orders WHERE request_key=p_key FOR UPDATE;
 IF FOUND THEN IF o.user_id<>auth.uid() OR o.plan_type<>p_plan THEN RAISE EXCEPTION 'Solicitação já utilizada';END IF;RETURN o;END IF;
 phone:=regexp_replace(coalesce(p_contact->>'phone',''),'[^0-9]','','g');
 IF length(trim(coalesce(p_contact->>'name',''))) NOT BETWEEN 2 AND 100 OR length(phone) NOT BETWEEN 10 AND 15 OR length(trim(coalesce(p_contact->>'businessType',''))) NOT BETWEEN 2 AND 100 OR length(coalesce(p_contact->>'businessName',''))>100 OR length(coalesce(p_contact->>'message',''))>1000 THEN RAISE EXCEPTION 'Confira nome, WhatsApp e área de atuação';END IF;
 q:=commerce_private.offer_quote(p_plan,p_code);
 IF q->>'fingerprint' IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'As condições mudaram. Atualize o resumo antes de solicitar';END IF;
 INSERT INTO business_orders(request_key,user_id,name,email,phone,business_type,business_name,request_message,plan_type,module_plan,setup_cents,monthly_cents,promotion_snapshot,requested_setup_code,requested_monthly_code,terms_version,scope_note,contract_flow,stage,approved_scope)
 VALUES(p_key,auth.uid(),trim(p_contact->>'name'),lower(auth.jwt()->>'email'),phone,trim(p_contact->>'businessType'),trim(p_contact->>'businessName'),trim(p_contact->>'message'),p_plan,CASE p_plan WHEN 'essencial' THEN 'agenda' WHEN 'pro' THEN 'gestao' ELSE 'premium' END,(q->>'setupCents')::integer,(q->>'monthlyCents')::integer,q->'promotion',CASE WHEN q->'voucher'->>'appliesTo' IN ('setup','setup_and_first','setup_and_monthly') THEN q->'voucher'->>'code' END,CASE WHEN q->'voucher'->>'appliesTo' IN ('monthly','first_payment','setup_and_first','setup_and_monthly') THEN q->'voucher'->>'code' END,p_terms,'Contratação direta; pagamento da implementação disponível.','direct','awaiting_payment','Estrutura padrão e módulos do plano escolhido, com personalização inicial e uma agenda de atendimento por instalação.') RETURNING * INTO o;
 PERFORM commerce_private.record_contract(o,q);
 INSERT INTO business_order_audit(order_id,actor_id,event,details) VALUES(o.id,auth.uid(),'offer_requested',q);
 RETURN o;
END $$;



NOTIFY pgrst,'reload schema';


NOTIFY pgrst,'reload schema';
