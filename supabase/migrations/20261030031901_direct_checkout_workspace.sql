ALTER TABLE public.business_orders ADD COLUMN contract_flow text NOT NULL DEFAULT 'assisted' CHECK(contract_flow IN ('assisted','direct'));
CREATE TABLE public.order_workspaces(order_id uuid PRIMARY KEY REFERENCES public.business_orders(id),phase text NOT NULL DEFAULT 'materials' CHECK(phase IN ('materials','production','review','approved')),brief jsonb NOT NULL DEFAULT '{}',submitted_at timestamptz,production_started_at timestamptz,preview_url text,installation_id text,modules_confirmed boolean NOT NULL DEFAULT false,revision_count integer NOT NULL DEFAULT 0,approved_at timestamptz,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.order_assets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES public.business_orders(id),uploaded_by uuid NOT NULL REFERENCES auth.users(id),kind text NOT NULL CHECK(kind IN ('logo','photo','portfolio','video','document')),path text NOT NULL UNIQUE,filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 150),status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),review_note text,active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.order_messages(id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES public.business_orders(id),author_id uuid NOT NULL REFERENCES auth.users(id),author_role text NOT NULL CHECK(author_role IN ('client','operator')),body text NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.order_timeline(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES public.business_orders(id),event text NOT NULL,note text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.order_notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES public.business_orders(id),event_key text NOT NULL,audience text NOT NULL CHECK(audience IN ('operator','client')),subject text NOT NULL,body text NOT NULL,status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),attempts integer NOT NULL DEFAULT 0,last_attempt timestamptz,provider_id text,error text,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(event_key,audience));
CREATE INDEX order_messages_order ON public.order_messages(order_id,created_at);
CREATE INDEX order_assets_order ON public.order_assets(order_id,created_at);
CREATE INDEX order_timeline_order ON public.order_timeline(order_id,created_at);
CREATE INDEX order_notifications_pending ON public.order_notifications(order_id,status);
ALTER TABLE public.order_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_workspaces,public.order_assets,public.order_messages,public.order_timeline,public.order_notifications FROM anon,authenticated;
GRANT SELECT ON public.order_workspaces,public.order_assets,public.order_messages,public.order_timeline TO authenticated;
GRANT ALL ON public.order_workspaces,public.order_assets,public.order_messages,public.order_timeline,public.order_notifications TO service_role;
CREATE POLICY workspace_read ON public.order_workspaces FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.business_orders o WHERE o.id=order_id AND (o.user_id=auth.uid() OR lower(auth.jwt()->>'email')='neifranchi@gmail.com')));
CREATE POLICY assets_read ON public.order_assets FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.business_orders o WHERE o.id=order_id AND (o.user_id=auth.uid() OR lower(auth.jwt()->>'email')='neifranchi@gmail.com')));
CREATE POLICY messages_read ON public.order_messages FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.business_orders o WHERE o.id=order_id AND (o.user_id=auth.uid() OR lower(auth.jwt()->>'email')='neifranchi@gmail.com')));
CREATE POLICY timeline_read ON public.order_timeline FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.business_orders o WHERE o.id=order_id AND (o.user_id=auth.uid() OR lower(auth.jwt()->>'email')='neifranchi@gmail.com')));
CREATE FUNCTION public.commerce_paid_workspace() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$BEGIN
 IF NEW.payment_status='paid' AND OLD.payment_status<>'paid' THEN
 INSERT INTO order_workspaces(order_id) VALUES(NEW.id) ON CONFLICT DO NOTHING;
 INSERT INTO order_timeline(order_id,event,note) VALUES(NEW.id,'payment_confirmed','Pagamento confirmado. Envie os materiais para iniciar a preparação.');
 INSERT INTO order_notifications(order_id,event_key,audience,subject,body) VALUES(NEW.id,'paid:'||NEW.id,'operator','Nova implementação paga','O pagamento da implementação foi confirmado. Acompanhe o pedido e os materiais no painel.'),(NEW.id,'paid:'||NEW.id,'client','Pagamento confirmado · envie seus materiais','Sua implementação está paga. Envie logo, informações, serviços e horários na área de acompanhamento. O prazo de produção começa após a conferência dos materiais completos.') ON CONFLICT DO NOTHING;
 END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION public.commerce_paid_workspace() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER commerce_paid_workspace AFTER UPDATE OF payment_status ON public.business_orders FOR EACH ROW EXECUTE FUNCTION public.commerce_paid_workspace();
CREATE FUNCTION public.commerce_guard_delivery() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$BEGIN
 IF NEW.contract_flow='direct' AND NEW.stage IN ('ready','active') AND OLD.stage NOT IN ('ready','active') AND NOT EXISTS(SELECT 1 FROM order_workspaces WHERE order_id=NEW.id AND phase='approved') THEN RAISE EXCEPTION 'A entrega precisa da aprovação do cliente';END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION public.commerce_guard_delivery() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER commerce_guard_delivery BEFORE UPDATE OF stage ON public.business_orders FOR EACH ROW EXECUTE FUNCTION public.commerce_guard_delivery();
CREATE FUNCTION commerce_private.workspace_action(p_order uuid,p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o public.business_orders;w public.order_workspaces;operator boolean:=coalesce(lower(auth.jwt()->>'email')='neifranchi@gmail.com',false);note text:=trim(coalesce(p_data->>'note',''));uid uuid:=auth.uid();event_id uuid:=gen_random_uuid();vpath text;target_audience text;BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Entre na sua conta';END IF;
 SELECT * INTO o FROM business_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR (o.user_id<>uid AND NOT operator) THEN RAISE EXCEPTION 'Pedido não encontrado';END IF;
 IF o.payment_status<>'paid' THEN RAISE EXCEPTION 'O pagamento precisa estar confirmado';END IF;
 INSERT INTO order_workspaces(order_id) VALUES(o.id) ON CONFLICT DO NOTHING;
 SELECT * INTO w FROM order_workspaces WHERE order_id=o.id FOR UPDATE;
 IF p_action='get' THEN RETURN to_jsonb(w)||jsonb_build_object('plan',o.plan_type,'assets',coalesce((SELECT jsonb_agg(a ORDER BY a.created_at DESC) FROM order_assets a WHERE a.order_id=o.id),'[]'::jsonb),'messages',coalesce((SELECT jsonb_agg(m ORDER BY m.created_at) FROM (SELECT * FROM order_messages WHERE order_id=o.id ORDER BY created_at DESC LIMIT 200) m),'[]'::jsonb),'timeline',coalesce((SELECT jsonb_agg(t ORDER BY t.created_at DESC) FROM (SELECT * FROM order_timeline WHERE order_id=o.id ORDER BY created_at DESC LIMIT 100)t),'[]'::jsonb),'notification_pending',(SELECT count(*) FROM order_notifications WHERE order_id=o.id AND status<>'sent'));END IF;
 IF p_action='brief' THEN
  IF w.phase<>'materials' OR jsonb_typeof(p_data->'brief') IS DISTINCT FROM 'object' OR length((p_data->'brief')::text)>16000 THEN RAISE EXCEPTION 'Envio de informações indisponível';END IF;
  UPDATE order_workspaces SET brief=jsonb_build_object('business_name',left(p_data->'brief'->>'business_name',100),'contact',left(p_data->'brief'->>'contact',300),'services',left(p_data->'brief'->>'services',4000),'hours',left(p_data->'brief'->>'hours',2000),'presentation',left(p_data->'brief'->>'presentation',2000),'identity_choice',p_data->'brief'->>'identity_choice'),submitted_at=NULL,updated_at=now() WHERE order_id=o.id;
  RETURN jsonb_build_object('ok',true);
 ELSIF p_action='asset' THEN
  vpath:=p_data->>'path';
  IF (NOT operator AND w.phase<>'materials') OR length(coalesce(p_data->>'filename','')) NOT BETWEEN 1 AND 150 OR p_data->>'kind' NOT IN ('logo','photo','portfolio','video','document') OR vpath NOT LIKE o.id::text||'/%' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='order-materials' AND name=vpath AND (metadata->>'size')::bigint BETWEEN 1 AND CASE WHEN p_data->>'kind'='video' THEN 52428800 ELSE 10485760 END) THEN RAISE EXCEPTION 'Arquivo não enviado ou dados inválidos';END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='order-materials' AND name=vpath AND ((p_data->>'kind'='video' AND metadata->>'mimetype' IN ('video/mp4','video/webm')) OR (p_data->>'kind'='document' AND metadata->>'mimetype'='application/pdf') OR (p_data->>'kind' IN ('logo','photo','portfolio') AND metadata->>'mimetype' IN ('image/jpeg','image/png','image/webp')))) THEN RAISE EXCEPTION 'O tipo do arquivo não corresponde à categoria escolhida';END IF;
  IF EXISTS(SELECT 1 FROM order_assets WHERE path=vpath AND order_id=o.id) THEN RETURN jsonb_build_object('ok',true);END IF;
  IF (SELECT count(*) FROM order_assets WHERE order_id=o.id AND active)>=40 THEN RAISE EXCEPTION 'Limite de 40 arquivos ativos por projeto';END IF;
  IF p_data->>'kind'='logo' THEN UPDATE order_assets SET active=false WHERE order_id=o.id AND kind='logo' AND active;END IF;
  INSERT INTO order_assets(order_id,uploaded_by,kind,path,filename) VALUES(o.id,uid,p_data->>'kind',vpath,p_data->>'filename');
  UPDATE order_workspaces SET submitted_at=NULL WHERE order_id=o.id AND phase='materials';
  note:='Arquivo enviado: '||left(p_data->>'filename',150);
 ELSIF p_action='remove_asset' THEN
  IF NOT operator AND w.phase<>'materials' THEN RAISE EXCEPTION 'Materiais já estão em preparação';END IF;
  UPDATE order_assets SET active=false WHERE id=(p_data->>'asset_id')::uuid AND order_id=o.id;
  UPDATE order_workspaces SET submitted_at=NULL WHERE order_id=o.id AND phase='materials';RETURN jsonb_build_object('ok',true);
 ELSIF p_action='message' THEN
  IF length(note) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'Escreva uma mensagem de até 4000 caracteres';END IF;
  event_id:=(p_data->>'id')::uuid;
  IF EXISTS(SELECT 1 FROM order_messages WHERE id=event_id AND order_id=o.id AND author_id=uid) THEN RETURN jsonb_build_object('ok',true);END IF;
  INSERT INTO order_messages(id,order_id,author_id,author_role,body) VALUES(event_id,o.id,uid,CASE WHEN operator THEN 'operator' ELSE 'client' END,note);
  note:='Há uma nova mensagem no acompanhamento do pedido.';target_audience:=CASE WHEN operator THEN 'client' ELSE 'operator' END;
 ELSIF p_action='submit' THEN
  IF w.phase<>'materials' OR length(trim(coalesce(w.brief->>'business_name','')))<2 OR length(trim(coalesce(w.brief->>'contact','')))<5 OR length(trim(coalesce(w.brief->>'services','')))<5 OR length(trim(coalesce(w.brief->>'hours','')))<5 OR coalesce(w.brief->>'identity_choice','') NOT IN ('logo','text') OR (w.brief->>'identity_choice'='logo' AND NOT EXISTS(SELECT 1 FROM order_assets WHERE order_id=o.id AND kind='logo' AND active)) THEN RAISE EXCEPTION 'Complete nome, contato, serviços, horários e escolha da identidade antes de enviar';END IF;
  UPDATE order_workspaces SET submitted_at=now(),updated_at=now() WHERE order_id=o.id;note:='Materiais enviados para conferência.';target_audience:='operator';
 ELSIF p_action='review_asset' THEN
  IF NOT operator OR p_data->>'status' NOT IN ('accepted','rejected') OR (p_data->>'status'='rejected' AND length(note)<3) THEN RAISE EXCEPTION 'Revisão inválida';END IF;
  UPDATE order_assets SET status=p_data->>'status',review_note=left(note,1000) WHERE order_id=o.id AND id=(p_data->>'asset_id')::uuid AND active;
  RETURN jsonb_build_object('ok',true);
 ELSIF p_action='request_materials' THEN
  IF NOT operator OR w.phase='approved' OR length(note) NOT BETWEEN 3 AND 1000 THEN RAISE EXCEPTION 'Informe os materiais que faltam';END IF;
  UPDATE order_workspaces SET phase='materials',submitted_at=NULL,updated_at=now() WHERE order_id=o.id;target_audience:='client';
 ELSIF p_action='start' THEN
  IF NOT operator OR w.phase<>'materials' OR w.submitted_at IS NULL OR EXISTS(SELECT 1 FROM order_assets WHERE order_id=o.id AND active AND status<>'accepted') THEN RAISE EXCEPTION 'Confira as informações e aprove ou remova os arquivos pendentes antes de iniciar';END IF;
  UPDATE order_workspaces SET phase='production',production_started_at=coalesce(production_started_at,now()),updated_at=now() WHERE order_id=o.id;
  UPDATE business_orders SET stage='in_progress',updated_at=now() WHERE id=o.id;note:='Materiais completos e conferidos. Produção iniciada; o prazo passa a contar desta etapa.';target_audience:='client';
 ELSIF p_action='preview' THEN
  IF NOT operator OR w.phase<>'production' OR length(coalesce(p_data->>'url',''))>300 OR coalesce(p_data->>'url','') !~ '^https://[a-zA-Z0-9][a-zA-Z0-9.-]+(:443)?/?$' OR coalesce(p_data->>'installation','') !~ '^[-a-z0-9]{3,80}$' OR coalesce((p_data->>'modules_confirmed')::boolean,false)=false THEN RAISE EXCEPTION 'Informe domínio HTTPS, instalação e confirmação dos módulos';END IF;
  UPDATE order_workspaces SET phase='review',preview_url=p_data->>'url',installation_id=p_data->>'installation',modules_confirmed=true,updated_at=now() WHERE order_id=o.id;note:='Sua plataforma está disponível para conferência. Acesse a prévia e aprove ou solicite ajustes.';target_audience:='client';
 ELSIF p_action='revision' THEN
  IF uid<>o.user_id OR w.phase<>'review' OR length(note) NOT BETWEEN 3 AND 2000 THEN RAISE EXCEPTION 'Informe o ajuste solicitado';END IF;
  UPDATE order_workspaces SET phase='production',revision_count=revision_count+1,updated_at=now() WHERE order_id=o.id;target_audience:='operator';
 ELSIF p_action='approve' THEN
  IF uid<>o.user_id OR w.phase<>'review' OR NOT w.modules_confirmed THEN RAISE EXCEPTION 'Somente o cliente pode aprovar a prévia entregue';END IF;
  UPDATE order_workspaces SET phase='approved',approved_at=now(),updated_at=now() WHERE order_id=o.id;
  UPDATE business_orders SET stage='ready',website_url=w.preview_url,installation_id=w.installation_id,ready_at=now(),scope_note='Entrega aprovada pelo cliente. Mensalidade disponível para contratação.',updated_at=now() WHERE id=o.id;
  note:='Cliente aprovou a entrega. A contratação da mensalidade foi liberada.';target_audience:='operator';
 ELSE RAISE EXCEPTION 'Ação indisponível';END IF;
 INSERT INTO order_timeline(order_id,event,note) VALUES(o.id,p_action,left(note,2000));
 IF target_audience IS NOT NULL THEN INSERT INTO order_notifications(order_id,event_key,audience,subject,body) VALUES(o.id,event_id::text,target_audience,'Atualização do seu projeto AgendaAÍ',left(note,2000)) ON CONFLICT DO NOTHING;END IF;
 RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION commerce_private.workspace_action(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION commerce_private.workspace_action(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.commerce_workspace(p_order uuid,p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$SELECT commerce_private.workspace_action(p_order,p_action,p_data)$$;
REVOKE ALL ON FUNCTION public.commerce_workspace(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commerce_workspace(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.commerce_claim_notifications(p_order uuid) RETURNS SETOF public.order_notifications LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$BEGIN
 RETURN QUERY UPDATE order_notifications SET status='sending',attempts=attempts+1,last_attempt=now() WHERE id IN (SELECT id FROM order_notifications WHERE order_id=p_order AND attempts<5 AND ((status='pending' AND (last_attempt IS NULL OR last_attempt<now()-interval '30 seconds'*power(2,least(attempts,5)))) OR (status='sending' AND last_attempt<now()-interval '5 minutes')) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 10) RETURNING *;END $$;
REVOKE ALL ON FUNCTION public.commerce_claim_notifications(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_claim_notifications(uuid) TO service_role;

CREATE OR REPLACE FUNCTION commerce_private.request_offer(p_plan text,p_key uuid,p_contact jsonb,p_code text,p_fingerprint text,p_terms text) RETURNS public.business_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE q jsonb;o public.business_orders;phone text;BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'email','')='' THEN RAISE EXCEPTION 'Entre na sua conta';END IF;
 IF p_terms IS DISTINCT FROM '2026-10-28-v3' OR jsonb_typeof(p_contact)<>'object' THEN RAISE EXCEPTION 'Aceite as condições';END IF;
 SELECT * INTO o FROM business_orders WHERE request_key=p_key FOR UPDATE;
 IF FOUND THEN IF o.user_id<>auth.uid() OR o.plan_type<>p_plan THEN RAISE EXCEPTION 'Solicitação já utilizada';END IF;RETURN o;END IF;
 phone:=regexp_replace(coalesce(p_contact->>'phone',''),'[^0-9]','','g');
 IF length(trim(coalesce(p_contact->>'name',''))) NOT BETWEEN 2 AND 100 OR length(phone) NOT BETWEEN 10 AND 15 OR length(trim(coalesce(p_contact->>'businessType',''))) NOT BETWEEN 2 AND 100 OR length(coalesce(p_contact->>'businessName',''))>100 OR length(coalesce(p_contact->>'message',''))>1000 THEN RAISE EXCEPTION 'Confira nome, WhatsApp e área de atuação';END IF;
 q:=commerce_private.offer_quote(p_plan,p_code);
 IF q->>'fingerprint' IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'As condições mudaram. Atualize o resumo antes de solicitar';END IF;
 INSERT INTO business_orders(request_key,user_id,name,email,phone,business_type,business_name,request_message,plan_type,module_plan,setup_cents,monthly_cents,promotion_snapshot,requested_setup_code,requested_monthly_code,terms_version,scope_note,contract_flow,stage,approved_scope)
 VALUES(p_key,auth.uid(),trim(p_contact->>'name'),lower(auth.jwt()->>'email'),phone,trim(p_contact->>'businessType'),trim(p_contact->>'businessName'),trim(p_contact->>'message'),p_plan,CASE p_plan WHEN 'essencial' THEN 'agenda' WHEN 'pro' THEN 'gestao' ELSE 'premium' END,(q->>'setupCents')::integer,(q->>'monthlyCents')::integer,q->'promotion',CASE WHEN q->'voucher'->>'appliesTo' IN ('setup','setup_and_first','setup_and_monthly') THEN q->'voucher'->>'code' END,CASE WHEN q->'voucher'->>'appliesTo' IN ('monthly','first_payment','setup_and_first','setup_and_monthly') THEN q->'voucher'->>'code' END,p_terms,'Contratação direta; pagamento da implementação disponível.','direct','awaiting_payment','Estrutura padrão e módulos do plano escolhido, com personalização inicial e uma agenda de atendimento por instalação.') RETURNING * INTO o;
 INSERT INTO business_order_audit(order_id,actor_id,event,details) VALUES(o.id,auth.uid(),'offer_requested',q);
 RETURN o;
END $$;


CREATE OR REPLACE FUNCTION public.commerce_transition(p_order uuid,p_actor uuid,p_action text,p_note text,p_url text DEFAULT NULL,p_installation text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.business_orders; target text;
BEGIN
 SELECT * INTO o FROM public.business_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR length(trim(p_note))<3 OR length(p_note)>1000 THEN RAISE EXCEPTION 'Invalid order or note'; END IF;
 IF o.contract_flow='direct' THEN RAISE EXCEPTION 'Use o acompanhamento do projeto para esta contratação';END IF;
 IF p_action='approve' AND o.stage='requested' THEN target='awaiting_payment';
 ELSIF p_action='start' AND o.stage='queued' AND o.payment_status='paid' THEN target='in_progress';
 ELSIF p_action='ready' AND o.stage='in_progress' AND o.payment_status='paid' AND p_url LIKE 'https://%' AND length(p_installation) BETWEEN 3 AND 80 THEN target='ready';
 ELSE RAISE EXCEPTION 'Invalid transition'; END IF;
 UPDATE public.business_orders SET stage=target,scope_note=p_note,approved_scope=CASE WHEN target='awaiting_payment' THEN p_note ELSE approved_scope END,website_url=CASE WHEN target='ready' THEN p_url ELSE website_url END,installation_id=CASE WHEN target='ready' THEN p_installation ELSE installation_id END,ready_at=CASE WHEN target='ready' THEN now() ELSE ready_at END,updated_at=now() WHERE id=p_order;
 INSERT INTO public.business_order_audit(order_id,actor_id,event,details) VALUES(p_order,p_actor,p_action,jsonb_build_object('from',o.stage,'to',target,'note',p_note));
END; $$;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('order-materials','order-materials',false,52428800,ARRAY['image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/webm']) ON CONFLICT(id) DO NOTHING;
CREATE POLICY order_materials_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='order-materials' AND EXISTS(SELECT 1 FROM public.business_orders o WHERE o.id::text=(storage.foldername(storage.objects.name))[1] AND (o.user_id=auth.uid() OR lower(auth.jwt()->>'email')='neifranchi@gmail.com')));
CREATE POLICY order_materials_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='order-materials' AND name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|pdf|mp4|webm)$' AND EXISTS(SELECT 1 FROM public.business_orders o LEFT JOIN public.order_workspaces w ON w.order_id=o.id WHERE o.id::text=(storage.foldername(storage.objects.name))[1] AND o.payment_status='paid' AND ((o.user_id=auth.uid() AND coalesce(w.phase,'materials')='materials') OR lower(auth.jwt()->>'email')='neifranchi@gmail.com')));
CREATE POLICY order_materials_orphan_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='order-materials' AND EXISTS(SELECT 1 FROM public.business_orders o WHERE o.id::text=(storage.foldername(storage.objects.name))[1] AND (o.user_id=auth.uid() OR lower(auth.jwt()->>'email')='neifranchi@gmail.com')) AND NOT EXISTS(SELECT 1 FROM public.order_assets a WHERE a.path=storage.objects.name));
NOTIFY pgrst,'reload schema';
