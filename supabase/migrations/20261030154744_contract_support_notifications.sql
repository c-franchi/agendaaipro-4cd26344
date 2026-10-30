-- Consent copies are append-only and never retroactively backfilled.
CREATE TABLE public.commerce_contract_templates(version text PRIMARY KEY,document jsonb NOT NULL,active boolean NOT NULL DEFAULT true);
ALTER TABLE public.commerce_contract_templates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.commerce_contract_templates FROM anon,authenticated;
GRANT SELECT ON public.commerce_contract_templates TO authenticated;
CREATE POLICY contract_template_read ON public.commerce_contract_templates FOR SELECT TO authenticated USING(active);
GRANT ALL ON public.commerce_contract_templates TO service_role;
CREATE TABLE public.order_contract_acceptances(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES public.business_orders(id),user_id uuid NOT NULL REFERENCES auth.users(id),version text NOT NULL,snapshot jsonb NOT NULL,fingerprint text NOT NULL,accepted_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX contract_acceptance_order ON public.order_contract_acceptances(order_id,accepted_at DESC);
ALTER TABLE public.order_contract_acceptances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_contract_acceptances FROM anon,authenticated;
GRANT SELECT ON public.order_contract_acceptances TO authenticated;
GRANT SELECT,INSERT ON public.order_contract_acceptances TO service_role;
CREATE POLICY contract_acceptance_read ON public.order_contract_acceptances FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.business_orders o WHERE o.id=order_id AND (o.user_id=auth.uid() OR lower(auth.jwt()->>'email')='neifranchi@gmail.com')));
CREATE FUNCTION public.guard_contract_copy() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$BEGIN RAISE EXCEPTION 'O contrato aceito não pode ser alterado ou excluído';END$$;
REVOKE ALL ON FUNCTION public.guard_contract_copy() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER immutable_contract_template BEFORE UPDATE OR DELETE ON public.commerce_contract_templates FOR EACH ROW EXECUTE FUNCTION public.guard_contract_copy();
CREATE TRIGGER immutable_contract_copy BEFORE UPDATE OR DELETE ON public.order_contract_acceptances FOR EACH ROW EXECUTE FUNCTION public.guard_contract_copy();
CREATE FUNCTION commerce_private.contract_document(p_plan text,p_quote jsonb,p_name text,p_email text) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT document || jsonb_build_object('customer',jsonb_build_object('name',p_name,'email',p_email),'plan',p_plan,'quote',p_quote,'modules',CASE p_plan WHEN 'essencial' THEN 'Agenda, clientes, serviços, horários e site personalizado.' WHEN 'pro' THEN 'Agenda, clientes, serviços, horários, site personalizado, vendas, estoque de produtos e financeiro.' ELSE 'Agenda, clientes, serviços, horários, site personalizado, vendas, estoque, financeiro, consumo de insumos por serviço e margem estimada. Preparação visual inicial dentro dos limites deste contrato.' END) FROM commerce_contract_templates WHERE version='2026-10-30-v1' AND active
$$;
REVOKE ALL ON FUNCTION commerce_private.contract_document(text,jsonb,text,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION commerce_private.record_contract(p_order public.business_orders,p_quote jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE doc jsonb; acceptance uuid;BEGIN
 doc:=commerce_private.contract_document(p_order.plan_type,p_quote||jsonb_build_object('setupCode',coalesce(p_quote->>'setupCode',p_order.requested_setup_code,'')),p_order.name,p_order.email);
 IF doc IS NULL THEN RAISE EXCEPTION 'Contrato indisponível';END IF;
 INSERT INTO order_contract_acceptances(order_id,user_id,version,snapshot,fingerprint) VALUES(p_order.id,p_order.user_id,doc->>'version',doc,encode(sha256(convert_to(doc::text,'UTF8')),'hex')) RETURNING id INTO acceptance;
 INSERT INTO order_timeline(order_id,event,note) VALUES(p_order.id,'contract_accepted','Contrato versão '||(doc->>'version')||' aceito pelo titular antes do pagamento.');
 INSERT INTO order_notifications(order_id,event_key,audience,subject,body) VALUES(p_order.id,'contract:'||acceptance,'client','Pedido recebido · contrato registrado','Recebemos seu pedido e o aceite do contrato. Uma cópia está anexada e disponível na sua conta. O pagamento da implementação ainda depende da confirmação da Stripe.');
 RETURN acceptance;
END$$;
REVOKE ALL ON FUNCTION commerce_private.record_contract(public.business_orders,jsonb) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION commerce_private.order_contract(p_order uuid,p_code text DEFAULT '',p_accept boolean DEFAULT false,p_fingerprint text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o public.business_orders;q jsonb;v jsonb;doc jsonb;fp text;cid uuid;BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta';END IF;
 SELECT * INTO o FROM business_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR o.user_id<>auth.uid() THEN RAISE EXCEPTION 'Pedido não encontrado';END IF;
 IF o.payment_status<>'pending' OR o.stage<>'awaiting_payment' THEN RAISE EXCEPTION 'O contrato desta cobrança não pode mais ser alterado';END IF;
 q:=jsonb_build_object('setupCode',upper(trim(coalesce(p_code,''))),'setupCents',o.setup_cents,'monthlyCents',o.monthly_cents,'setupDueCents',o.setup_cents,'monthlyDueCents',o.monthly_cents,'promotion',o.promotion_snapshot,'voucher',NULL);
 IF trim(coalesce(p_code,''))<>'' THEN
 v:=public.commerce_reserve_voucher(o.id,auth.uid(),'setup',p_code,true);
 q:=q||jsonb_build_object('setupDueCents',(v->>'due_cents')::integer,'voucher',jsonb_build_object('code',v->>'code','setupDiscountCents',(v->>'discount_cents')::integer));
 END IF;
 IF coalesce(o.requested_monthly_code,'')<>'' THEN q:=q||jsonb_build_object('monthlyVoucherCode',o.requested_monthly_code,'monthlyVoucherNote','Voucher da mensalidade informado na contratação; sua validade e o valor final serão conferidos separadamente antes da assinatura.');END IF;
 doc:=commerce_private.contract_document(o.plan_type,q,o.name,o.email);fp:=encode(sha256(convert_to(doc::text,'UTF8')),'hex');
 IF p_accept THEN
 IF fp IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'As condições mudaram. Abra e confira o contrato novamente';END IF;
 IF EXISTS(SELECT 1 FROM order_contract_acceptances WHERE order_id=o.id AND fingerprint=fp) THEN RETURN jsonb_build_object('ok',true);END IF;
 cid:=commerce_private.record_contract(o,q);
 END IF;
 RETURN jsonb_build_object('document',doc,'fingerprint',fp,'acceptanceId',cid);
END$$;
REVOKE ALL ON FUNCTION commerce_private.order_contract(uuid,text,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION commerce_private.order_contract(uuid,text,boolean,text) TO authenticated;
CREATE FUNCTION public.commerce_order_contract(p_order uuid,p_code text DEFAULT '',p_accept boolean DEFAULT false,p_fingerprint text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$SELECT commerce_private.order_contract(p_order,p_code,p_accept,p_fingerprint)$$;
REVOKE ALL ON FUNCTION public.commerce_order_contract(uuid,text,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commerce_order_contract(uuid,text,boolean,text) TO authenticated;
CREATE FUNCTION public.commerce_order_received() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$BEGIN
 INSERT INTO order_timeline(order_id,event,note) VALUES(NEW.id,'order_received','Pedido recebido. Aguardando pagamento da implementação.');
 INSERT INTO order_notifications(order_id,event_key,audience,subject,body) VALUES(NEW.id,'received:'||NEW.id,'operator','Novo pedido AgendaAÍ recebido','Um novo pedido foi registrado. Acompanhe o contrato, o pagamento e as próximas etapas no painel. O recebimento do pedido não confirma o pagamento.');RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION public.commerce_order_received() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER order_received AFTER INSERT ON public.business_orders FOR EACH ROW EXECUTE FUNCTION public.commerce_order_received();
CREATE TABLE public.order_support_requests(id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES public.business_orders(id),user_id uuid NOT NULL REFERENCES auth.users(id),kind text NOT NULL CHECK(kind IN ('question','problem','cancellation','withdrawal','suspension')),body text NOT NULL CHECK(length(body) BETWEEN 3 AND 4000),status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved')),response text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX support_order ON public.order_support_requests(order_id,created_at DESC);
ALTER TABLE public.order_support_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_support_requests FROM anon,authenticated;
GRANT SELECT ON public.order_support_requests TO authenticated;GRANT ALL ON public.order_support_requests TO service_role;
CREATE POLICY support_read ON public.order_support_requests FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.business_orders o WHERE o.id=order_id AND (o.user_id=auth.uid() OR lower(auth.jwt()->>'email')='neifranchi@gmail.com')));
CREATE TABLE public.order_activity_reads(order_id uuid NOT NULL REFERENCES public.business_orders(id),user_id uuid NOT NULL REFERENCES auth.users(id),read_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(order_id,user_id));
ALTER TABLE public.order_activity_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_activity_reads FROM anon,authenticated;GRANT ALL ON public.order_activity_reads TO service_role;
CREATE FUNCTION commerce_private.order_activity(p_order uuid,p_action text DEFAULT 'get',p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o public.business_orders;operator boolean:=coalesce(lower(auth.jwt()->>'email')='neifranchi@gmail.com',false);r public.order_support_requests;n text;BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta';END IF;
 SELECT * INTO o FROM business_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR (o.user_id<>auth.uid() AND NOT operator) THEN RAISE EXCEPTION 'Pedido não encontrado';END IF;
 IF p_action='read' THEN INSERT INTO order_activity_reads(order_id,user_id) VALUES(o.id,auth.uid()) ON CONFLICT(order_id,user_id) DO UPDATE SET read_at=now();
 ELSIF p_action='support' THEN
 IF auth.uid()<>o.user_id OR length(trim(coalesce(p_data->>'body',''))) NOT BETWEEN 3 AND 4000 OR coalesce(p_data->>'kind','') NOT IN ('question','problem','cancellation','withdrawal','suspension') THEN RAISE EXCEPTION 'Confira sua solicitação';END IF;
 IF EXISTS(SELECT 1 FROM order_support_requests WHERE id=(p_data->>'id')::uuid AND order_id=o.id AND user_id=auth.uid()) THEN RETURN jsonb_build_object('ok',true);END IF;
 IF (SELECT count(*) FROM order_support_requests WHERE order_id=o.id AND status<>'resolved')>=10 THEN RAISE EXCEPTION 'Você já possui 10 solicitações abertas. Aguarde a resposta da equipe';END IF;
 INSERT INTO order_support_requests(id,order_id,user_id,kind,body) VALUES((p_data->>'id')::uuid,o.id,auth.uid(),p_data->>'kind',trim(p_data->>'body')) RETURNING * INTO r;
 n:='Solicitação de atendimento recebida. Protocolo #'||r.id::text||'. Tipo: '||CASE r.kind WHEN 'question' THEN 'dúvida' WHEN 'problem' THEN 'problema ou reclamação' WHEN 'withdrawal' THEN 'arrependimento' WHEN 'cancellation' THEN 'cancelamento' ELSE 'suspensão' END||'. A equipe se manifestará em até 5 dias. Cancelamento e estorno dependem da execução e confirmação da equipe.';
 INSERT INTO order_timeline(order_id,event,note) VALUES(o.id,'support_received',n);
 INSERT INTO order_notifications(order_id,event_key,audience,subject,body) VALUES(o.id,'support:'||r.id,'operator','Novo atendimento · pedido AgendaAÍ','Há uma solicitação no acompanhamento. Confira o protocolo e responda no painel.'),(o.id,'support:'||r.id,'client','Recebemos sua solicitação de atendimento',n);
 ELSIF p_action='respond' THEN
 IF NOT operator OR p_data->>'status' NOT IN ('in_progress','resolved') OR length(trim(coalesce(p_data->>'response',''))) NOT BETWEEN 3 AND 4000 THEN RAISE EXCEPTION 'Informe uma resposta e situação válidas';END IF;
 IF EXISTS(SELECT 1 FROM order_support_requests WHERE id=(p_data->>'id')::uuid AND order_id=o.id AND status=p_data->>'status' AND response=trim(p_data->>'response')) THEN RETURN jsonb_build_object('ok',true);END IF;
 UPDATE order_support_requests SET status=p_data->>'status',response=trim(p_data->>'response'),updated_at=now() WHERE id=(p_data->>'id')::uuid AND order_id=o.id RETURNING * INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'Protocolo não encontrado';END IF;
 INSERT INTO order_timeline(order_id,event,note) VALUES(o.id,'support_response','Resposta ao protocolo #'||r.id::text||': '||r.response);
 INSERT INTO order_notifications(order_id,event_key,audience,subject,body) VALUES(o.id,'response:'||gen_random_uuid(),'client','Sua solicitação recebeu uma resposta','A equipe respondeu ao protocolo #'||r.id::text||'. Consulte o atendimento no pedido.');
 ELSIF p_action<>'get' THEN RAISE EXCEPTION 'Ação indisponível';END IF;
 RETURN jsonb_build_object('timeline',coalesce((SELECT jsonb_agg(t ORDER BY t.created_at DESC) FROM(SELECT id,event,note,created_at FROM order_timeline WHERE order_id=o.id ORDER BY created_at DESC LIMIT 100)t),'[]'::jsonb),'notifications',coalesce((SELECT jsonb_agg(notice_row ORDER BY notice_row.created_at DESC) FROM(SELECT id,subject,body,status,audience,created_at FROM order_notifications WHERE order_id=o.id AND (operator OR audience='client') ORDER BY created_at DESC LIMIT 100)notice_row),'[]'::jsonb),'unread',(SELECT count(*) FROM order_notifications WHERE order_id=o.id AND audience=CASE WHEN operator THEN 'operator' ELSE 'client' END AND created_at>coalesce((SELECT read_at FROM order_activity_reads WHERE order_id=o.id AND user_id=auth.uid()),'-infinity'::timestamptz)),'requests',coalesce((SELECT jsonb_agg(support_row ORDER BY support_row.created_at DESC) FROM(SELECT * FROM order_support_requests WHERE order_id=o.id ORDER BY created_at DESC LIMIT 100)support_row),'[]'::jsonb),'contracts',coalesce((SELECT jsonb_agg(c ORDER BY c.accepted_at DESC) FROM(SELECT * FROM order_contract_acceptances WHERE order_id=o.id ORDER BY accepted_at DESC LIMIT 30)c),'[]'::jsonb));
END$$;
REVOKE ALL ON FUNCTION commerce_private.order_activity(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION commerce_private.order_activity(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.commerce_order_activity(p_order uuid,p_action text DEFAULT 'get',p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$SELECT commerce_private.order_activity(p_order,p_action,p_data)$$;
REVOKE ALL ON FUNCTION public.commerce_order_activity(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commerce_order_activity(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.commerce_payment_notices() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE ev text;msg text;BEGIN
 IF NEW.payment_status='refunded' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN ev:='refund';msg:='Reembolso da implementação registrado pela Stripe. A equipe revisará a instalação e eventuais assinaturas.';
 ELSIF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN ev:='subscription:'||NEW.subscription_status;msg:=CASE WHEN NEW.subscription_status='active' THEN 'Mensalidade confirmada. Sua assinatura está ativa.' WHEN NEW.subscription_status IN ('past_due','unpaid') THEN 'A Stripe informou uma pendência na mensalidade. Consulte sua conta e regularize o pagamento.' WHEN NEW.subscription_status IN ('canceled','cancelled') THEN 'Cancelamento da assinatura registrado. Consulte a equipe sobre continuidade e dados.' ELSE 'Situação da mensalidade atualizada. Consulte os detalhes no pedido.' END;
 END IF;
 IF ev IS NOT NULL THEN
 INSERT INTO order_timeline(order_id,event,note) VALUES(NEW.id,ev,msg);
 INSERT INTO order_notifications(order_id,event_key,audience,subject,body) SELECT NEW.id,ev||':'||gen_random_uuid(),aud,'Atualização de pagamento AgendaAÍ',msg FROM unnest(ARRAY['client','operator']) aud;
 END IF;RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION public.commerce_payment_notices() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER payment_notices AFTER UPDATE OF payment_status,subscription_status ON public.business_orders FOR EACH ROW EXECUTE FUNCTION public.commerce_payment_notices();

INSERT INTO public.commerce_contract_templates(version,document) VALUES('2026-10-30-v1', $contract${"version": "2026-10-30-v1", "title": "Contrato de implementação e licença de uso · AgendaAÍ Pro", "provider": "AgendaAÍ Pro · responsável: Claudinei Luiz Franchi · atendimento: neifranchi@gmail.com", "clauses": [{"title": "1. Objeto e recursos", "body": "Configuração de um site próprio com a identidade e os materiais do contratante, domínio e sistema PWA acessível pelo navegador e instalável em dispositivos compatíveis. Uma agenda de atendimento por instalação. Os módulos incluídos são os do plano descrito neste resumo. Não inclui cessão do código-fonte, desenvolvimento exclusivo de funcionalidades ou aplicativo publicado na Play Store."}, {"title": "2. Implementação e mensalidade", "body": "O pagamento inicial é único e remunera a implementação. A mensalidade será contratada separadamente após a aprovação expressa da entrega pelo cliente e remunera ferramentas, hospedagem, manutenção técnica e suporte de uso. Aprovar a entrega não efetua cobrança nem inicia assinatura automaticamente. O valor e os descontos do pedido estão discriminados no resumo; o checkout deve respeitar as condições aceitas. Taxas de integrações, mensagens pagas, novos serviços e trabalhos fora do escopo exigem informação e contratação separadas."}, {"title": "3. Personalização e materiais", "body": "Todos os planos recebem logo ou identidade em texto, cores e informações do negócio. No Agenda e Gestão, o cliente fornece logo, textos e imagens prontos. O Premium inclui somente na entrega inicial preparação de até 10 imagens fornecidas pelo cliente, organização de até 10 itens de portfólio, 1 vídeo curto e 2 rodadas de revisão criativa. Criação de logo, conteúdo mensal e trabalhos adicionais não estão incluídos. Correções de defeitos ou de divergências em relação ao escopo não consomem essas rodadas criativas."}, {"title": "4. Prazo e aprovação", "body": "Prazo estimado de 15 a 20 dias úteis a partir do envio completo e da conferência dos materiais, com início registrado no acompanhamento. O pagamento inicia o atendimento. Pendências de materiais e solicitações fora do escopo serão comunicadas no pedido, com eventual novo prazo informado antes da execução. A prévia é apresentada para conferência; o cliente pode solicitar correções e deve aprovar expressamente a entrega. O silêncio não equivale a aprovação."}, {"title": "5. Domínio e continuidade", "body": "A implementação inclui o primeiro ano de um domínio .com.br disponível, escolhido em conjunto. A renovação será informada e cobrada separadamente. A manutenção do sistema hospedado depende da assinatura contratada após a entrega. Cancelamento e disponibilização de dados ou transferência do domínio devem ser solicitados pelo atendimento, preservados os direitos do titular e as obrigações legais."}, {"title": "6. Atendimento e registros", "body": "Pedidos, materiais, mensagens, solicitações, conferências e aprovações ficam registrados na conta, com data e autoria. O atendimento eletrônico permite dúvidas, reclamações, pedidos de suspensão e cancelamento. O recebimento é confirmado no painel; os e-mails são complementares e podem falhar. As demandas terão manifestação da equipe em até 5 dias. O contratante pode conservar uma cópia deste contrato e do resumo aceito pelo próprio painel."}, {"title": "7. Cancelamento e direitos do consumidor", "body": "O cliente pode solicitar cancelamento, suspensão ou arrependimento no atendimento do pedido, sem depender do WhatsApp. Nas relações de consumo às quais se aplica o art. 49 do Código de Defesa do Consumidor, fica preservado o direito de arrependimento no prazo legal de 7 dias, contado na forma da lei, com devolução dos valores devidos. O início da personalização não implica renúncia automática a direitos legais. Outras hipóteses de cancelamento e eventuais valores por etapas efetivamente prestadas serão avaliados e informados conforme o caso, sem afastar direitos obrigatórios. Solicitar cancelamento gera protocolo e exige execução pela equipe; não equivale a confirmação de estorno ou cancelamento de assinatura."}, {"title": "8. Dados e propriedade dos materiais", "body": "O cliente declara possuir autorização para usar os materiais enviados e responde pela exatidão de seus serviços, preços e horários. Logo, fotos e demais materiais do cliente permanecem de sua titularidade. O sistema e sua estrutura são licenciados, não vendidos como código-fonte. Os dados serão tratados para contratação, pagamento, suporte e execução do serviço conforme a Política de Privacidade. Somente o titular e a equipe autorizada acessam o acompanhamento e os arquivos privados."}, {"title": "9. Aceite eletrônico", "body": "O aceite é uma manifestação expressa da conta autenticada antes do checkout. São conservados versão, conteúdo do contrato, resumo comercial, identificação da conta, data e código de integridade. Alterações posteriores do texto não substituem a cópia já aceita. O aceite eletrônico registra a concordância com as condições apresentadas, sem afastar direitos legais nem substituir o comprovante de pagamento da Stripe."}], "modulesByPlan": {"essencial": "Agenda, clientes, serviços, horários e site personalizado.", "pro": "Agenda, clientes, serviços, horários, site personalizado, vendas, estoque de produtos e financeiro.", "premium": "Agenda, clientes, serviços, horários, site personalizado, vendas, estoque, financeiro, consumo de insumos por serviço e margem estimada. Preparação visual inicial dentro dos limites deste contrato."}}$contract$::jsonb);
CREATE OR REPLACE FUNCTION commerce_private.request_offer(p_plan text,p_key uuid,p_contact jsonb,p_code text,p_fingerprint text,p_terms text) RETURNS public.business_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE q jsonb;o public.business_orders;phone text;BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'email','')='' THEN RAISE EXCEPTION 'Entre na sua conta';END IF;
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

CREATE OR REPLACE FUNCTION commerce_private.workspace_action(p_order uuid,p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
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
  note:='Conferência do arquivo: '||(p_data->>'status')||'. '||note;target_audience:='client';
 ELSIF p_action='request_materials' THEN
  IF NOT operator OR w.phase='approved' OR length(note) NOT BETWEEN 3 AND 1000 THEN RAISE EXCEPTION 'Informe os materiais que faltam';END IF;
  UPDATE order_workspaces SET phase='materials',submitted_at=NULL,updated_at=now() WHERE order_id=o.id;target_audience:='client';
 ELSIF p_action='start' THEN
  IF NOT operator OR w.phase<>'materials' OR w.submitted_at IS NULL OR EXISTS(SELECT 1 FROM order_assets WHERE order_id=o.id AND active AND status<>'accepted') THEN RAISE EXCEPTION 'Confira as informações e aprove ou remova os arquivos pendentes antes de iniciar';END IF;
  UPDATE order_workspaces SET phase='production',production_started_at=coalesce(production_started_at,now()),updated_at=now() WHERE order_id=o.id;
  UPDATE business_orders SET stage='in_progress',updated_at=now() WHERE id=o.id;note:='Materiais completos e conferidos. Produção iniciada; o prazo passa a contar desta etapa.';target_audience:='client';
 ELSIF p_action='progress' THEN
  IF NOT operator OR w.phase NOT IN ('production','review') OR length(note) NOT BETWEEN 3 AND 1000 THEN RAISE EXCEPTION 'Informe o andamento da produção';END IF;target_audience:='client';
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
 IF p_action IN ('submit','approve') THEN INSERT INTO order_notifications(order_id,event_key,audience,subject,body) VALUES(o.id,event_id::text,'client',CASE WHEN p_action='submit' THEN 'Materiais recebidos para conferência' ELSE 'Sua aprovação da entrega foi registrada' END,left(note,2000)) ON CONFLICT DO NOTHING;END IF;
 IF target_audience IS NOT NULL THEN INSERT INTO order_notifications(order_id,event_key,audience,subject,body) VALUES(o.id,event_id::text,target_audience,'Atualização do seu projeto AgendaAÍ',left(note,2000)) ON CONFLICT DO NOTHING;END IF;
 RETURN jsonb_build_object('ok',true);
END $$;

ALTER TABLE public.order_notifications ADD COLUMN sent_at timestamptz;
NOTIFY pgrst,'reload schema';
