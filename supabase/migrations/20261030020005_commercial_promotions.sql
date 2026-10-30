CREATE TABLE public.commercial_promotions (
 plan_type text PRIMARY KEY CHECK(plan_type IN ('essencial','pro','premium')),
 title text NOT NULL CHECK(length(title) BETWEEN 3 AND 80),
 setup_cents integer NOT NULL CHECK(setup_cents>0),monthly_cents integer NOT NULL CHECK(monthly_cents>0),
 starts_at timestamptz NOT NULL,ends_at timestamptz,
 active boolean NOT NULL DEFAULT false,allow_voucher boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at IS NULL OR ends_at>starts_at),
 CHECK((plan_type='essencial' AND setup_cents<=25000 AND monthly_cents<=3990) OR (plan_type='pro' AND setup_cents<=35000 AND monthly_cents<=6990) OR (plan_type='premium' AND setup_cents<=69000 AND monthly_cents<=9990))
);
ALTER TABLE public.commercial_promotions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.commercial_promotions TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.commercial_promotions TO authenticated;
GRANT ALL ON public.commercial_promotions TO service_role;
CREATE POLICY promotions_public ON public.commercial_promotions FOR SELECT TO anon,authenticated USING(active AND starts_at<=now() AND (ends_at IS NULL OR ends_at>now()));
CREATE POLICY promotions_operator ON public.commercial_promotions FOR ALL TO authenticated USING(lower(auth.jwt()->>'email')='neifranchi@gmail.com') WITH CHECK(lower(auth.jwt()->>'email')='neifranchi@gmail.com');
ALTER TABLE public.business_orders ADD COLUMN promotion_snapshot jsonb,
 ADD COLUMN requested_setup_code text,ADD COLUMN requested_monthly_code text;
CREATE SCHEMA IF NOT EXISTS commerce_private;
REVOKE ALL ON SCHEMA commerce_private FROM PUBLIC;
GRANT USAGE ON SCHEMA commerce_private TO authenticated;
CREATE FUNCTION commerce_private.offer_quote(p_plan text,p_code text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p public.commercial_promotions;v public.vouchers;setup integer;monthly integer;base_setup integer;base_monthly integer;sd integer:=0;md integer:=0;used integer;result jsonb;BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta para continuar';END IF;
 CASE p_plan WHEN 'essencial' THEN base_setup:=25000;base_monthly:=3990;WHEN 'pro' THEN base_setup:=35000;base_monthly:=6990;WHEN 'premium' THEN base_setup:=69000;base_monthly:=9990;ELSE RAISE EXCEPTION 'Plano inválido';END CASE;
 setup:=base_setup;monthly:=base_monthly;
 SELECT * INTO p FROM commercial_promotions WHERE plan_type=p_plan AND active AND starts_at<=now() AND (ends_at IS NULL OR ends_at>now()) FOR SHARE;
 IF FOUND THEN setup:=p.setup_cents;monthly:=p.monthly_cents;END IF;
 IF length(coalesce(p_code,''))>80 THEN RAISE EXCEPTION 'Código inválido';END IF;
 IF trim(coalesce(p_code,''))<>'' THEN
  IF p.plan_type IS NOT NULL AND NOT p.allow_voucher THEN RAISE EXCEPTION 'Esta promoção não acumula com voucher';END IF;
  SELECT * INTO v FROM vouchers WHERE code=upper(trim(p_code)) FOR SHARE;
  IF NOT FOUND OR NOT v.commerce_enabled OR v.status<>'active' OR v.starts_at>now() OR (v.expires_at IS NOT NULL AND v.expires_at<=now()) THEN RAISE EXCEPTION 'Voucher inválido ou expirado';END IF;
  SELECT count(*) INTO used FROM commerce_voucher_reservations WHERE voucher_id=v.id AND state='reserved';
  IF v.max_uses IS NOT NULL AND v.current_uses+used>=v.max_uses THEN RAISE EXCEPTION 'Limite de usos atingido';END IF;
  SELECT count(*) INTO used FROM voucher_uses WHERE voucher_id=v.id AND lower(user_email)=lower(auth.jwt()->>'email');
  used:=used+(SELECT count(*) FROM commerce_voucher_reservations WHERE voucher_id=v.id AND user_id=auth.uid() AND state='reserved');
  IF v.max_uses_per_user IS NOT NULL AND used>=v.max_uses_per_user THEN RAISE EXCEPTION 'Limite por cliente atingido';END IF;
  IF v.discount_value<=0 OR (v.discount_type='percentage' AND v.discount_value>100) THEN RAISE EXCEPTION 'Desconto inválido';END IF;
  IF v.applies_to IN ('setup','setup_and_first') THEN sd:=least(setup,CASE WHEN v.discount_type='percentage' THEN round(setup*v.discount_value/100)::integer ELSE round(v.discount_value*100)::integer END);END IF;
  IF v.applies_to IN ('monthly','first_payment','setup_and_first') THEN md:=least(monthly,CASE WHEN v.discount_type='percentage' THEN round(monthly*v.discount_value/100)::integer ELSE round(v.discount_value*100)::integer END);END IF;
 END IF;
 result:=jsonb_build_object('planType',p_plan,'baseSetupCents',base_setup,'baseMonthlyCents',base_monthly,'setupCents',setup,'monthlyCents',monthly,'setupDueCents',setup-sd,'monthlyDueCents',monthly-md,'promotion',CASE WHEN p.plan_type IS NULL THEN NULL ELSE to_jsonb(p) END,'voucher',CASE WHEN v.id IS NULL THEN NULL ELSE jsonb_build_object('code',v.code,'appliesTo',v.applies_to,'months',CASE WHEN v.applies_to='monthly' THEN v.discount_months ELSE 1 END,'setupDiscountCents',sd,'monthlyDiscountCents',md) END);
 RETURN result||jsonb_build_object('fingerprint',md5(result::text));
END $$;
REVOKE ALL ON FUNCTION commerce_private.offer_quote(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION commerce_private.offer_quote(text,text) TO authenticated;
CREATE FUNCTION public.commerce_offer_quote(p_plan text,p_code text DEFAULT '') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$SELECT commerce_private.offer_quote(p_plan,p_code)$$;
REVOKE ALL ON FUNCTION public.commerce_offer_quote(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commerce_offer_quote(text,text) TO authenticated;
CREATE FUNCTION commerce_private.request_offer(p_plan text,p_key uuid,p_contact jsonb,p_code text,p_fingerprint text,p_terms text) RETURNS public.business_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE q jsonb;o public.business_orders;phone text;BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'email','')='' THEN RAISE EXCEPTION 'Entre na sua conta';END IF;
 IF p_terms IS DISTINCT FROM '2026-10-28-v3' OR jsonb_typeof(p_contact)<>'object' THEN RAISE EXCEPTION 'Aceite as condições';END IF;
 SELECT * INTO o FROM business_orders WHERE request_key=p_key FOR UPDATE;
 IF FOUND THEN IF o.user_id<>auth.uid() OR o.plan_type<>p_plan THEN RAISE EXCEPTION 'Solicitação já utilizada';END IF;RETURN o;END IF;
 IF (SELECT count(*) FROM business_orders WHERE user_id=auth.uid() AND stage='requested')>=5 THEN RAISE EXCEPTION 'Você já possui solicitações em análise; consulte Meus pedidos';END IF;
 phone:=regexp_replace(coalesce(p_contact->>'phone',''),'[^0-9]','','g');
 IF length(trim(coalesce(p_contact->>'name',''))) NOT BETWEEN 2 AND 100 OR length(phone) NOT BETWEEN 10 AND 15 OR length(trim(coalesce(p_contact->>'businessType',''))) NOT BETWEEN 2 AND 100 OR length(coalesce(p_contact->>'businessName',''))>100 OR length(coalesce(p_contact->>'message',''))>1000 THEN RAISE EXCEPTION 'Confira nome, WhatsApp e área de atuação';END IF;
 q:=commerce_private.offer_quote(p_plan,p_code);
 IF q->>'fingerprint' IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'As condições mudaram. Atualize o resumo antes de solicitar';END IF;
 INSERT INTO business_orders(request_key,user_id,name,email,phone,business_type,business_name,request_message,plan_type,module_plan,setup_cents,monthly_cents,promotion_snapshot,requested_setup_code,requested_monthly_code,terms_version,scope_note)
 VALUES(p_key,auth.uid(),trim(p_contact->>'name'),lower(auth.jwt()->>'email'),phone,trim(p_contact->>'businessType'),trim(p_contact->>'businessName'),trim(p_contact->>'message'),p_plan,CASE p_plan WHEN 'essencial' THEN 'agenda' WHEN 'pro' THEN 'gestao' ELSE 'premium' END,(q->>'setupCents')::integer,(q->>'monthlyCents')::integer,q->'promotion',CASE WHEN q->'voucher'->>'appliesTo' IN ('setup','setup_and_first') THEN q->'voucher'->>'code' END,CASE WHEN q->'voucher'->>'appliesTo' IN ('monthly','first_payment','setup_and_first') THEN q->'voucher'->>'code' END,p_terms,'Valores da oferta registrados; escopo e disponibilidade do voucher serão confirmados antes do pagamento.') RETURNING * INTO o;
 INSERT INTO business_order_audit(order_id,actor_id,event,details) VALUES(o.id,auth.uid(),'offer_requested',q);
 RETURN o;
END $$;
REVOKE ALL ON FUNCTION commerce_private.request_offer(text,uuid,jsonb,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION commerce_private.request_offer(text,uuid,jsonb,text,text,text) TO authenticated;
CREATE FUNCTION public.commerce_request_offer(p_plan text,p_key uuid,p_contact jsonb,p_code text,p_fingerprint text,p_terms text) RETURNS public.business_orders LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$SELECT commerce_private.request_offer(p_plan,p_key,p_contact,p_code,p_fingerprint,p_terms)$$;
REVOKE ALL ON FUNCTION public.commerce_request_offer(text,uuid,jsonb,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commerce_request_offer(text,uuid,jsonb,text,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';

CREATE OR REPLACE FUNCTION public.commerce_reserve_voucher(p_order uuid,p_user uuid,p_kind text,p_code text,p_preview boolean DEFAULT false)
RETURNS public.commerce_voucher_reservations LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.business_orders; v public.vouchers; a public.commerce_voucher_reservations; base integer; discount integer; used integer; BEGIN
 SELECT * INTO o FROM business_orders WHERE id=p_order AND user_id=p_user FOR UPDATE;
 IF NOT FOUND OR p_kind NOT IN ('setup','subscription') THEN RAISE EXCEPTION 'Pedido inválido'; END IF;
 IF o.promotion_snapshot IS NOT NULL AND o.promotion_snapshot<>'null'::jsonb AND coalesce((o.promotion_snapshot->>'allow_voucher')::boolean,false)=false THEN RAISE EXCEPTION 'Esta promoção não acumula com voucher';END IF;
 IF (p_kind='setup' AND (o.stage<>'awaiting_payment' OR o.payment_status<>'pending')) OR (p_kind='subscription' AND (o.stage<>'ready' OR o.payment_status<>'paid' OR o.stripe_subscription_id IS NOT NULL)) THEN RAISE EXCEPTION 'Cobrança indisponível'; END IF;
 SELECT * INTO a FROM commerce_voucher_reservations WHERE order_id=p_order AND kind=p_kind AND state<>'released';
 IF FOUND THEN IF a.code<>upper(trim(p_code)) THEN RAISE EXCEPTION 'Já existe uma tentativa com outro voucher; aguarde a expiração do checkout'; END IF; RETURN a; END IF;
 SELECT * INTO v FROM vouchers WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND OR NOT v.commerce_enabled OR v.status<>'active' OR v.starts_at>now() OR (v.expires_at IS NOT NULL AND v.expires_at<=now()) THEN RAISE EXCEPTION 'Voucher inválido, não revisado ou expirado'; END IF;
 IF (p_kind='setup' AND v.applies_to NOT IN ('setup','setup_and_first')) OR (p_kind='subscription' AND v.applies_to NOT IN ('monthly','first_payment','setup_and_first')) THEN RAISE EXCEPTION 'Voucher não se aplica a esta cobrança'; END IF;
 SELECT count(*) INTO used FROM commerce_voucher_reservations WHERE voucher_id=v.id AND state='reserved';
 IF v.max_uses IS NOT NULL AND v.current_uses+used>=v.max_uses THEN RAISE EXCEPTION 'Limite de usos atingido'; END IF;
 SELECT count(*) INTO used FROM voucher_uses WHERE voucher_id=v.id AND lower(user_email)=lower(o.email);
 used:=used+(SELECT count(*) FROM commerce_voucher_reservations WHERE voucher_id=v.id AND user_id=p_user AND state='reserved');
 IF v.max_uses_per_user IS NOT NULL AND used>=v.max_uses_per_user THEN RAISE EXCEPTION 'Limite por usuário atingido'; END IF;
 base:=CASE WHEN p_kind='setup' THEN o.setup_cents ELSE o.monthly_cents END;
 IF v.discount_type='percentage' AND v.discount_value>100 THEN RAISE EXCEPTION 'Percentual inválido'; END IF;
 discount:=least(base,CASE WHEN v.discount_type='percentage' THEN round(base*v.discount_value/100)::integer ELSE round(v.discount_value*100)::integer END);
 IF discount<=0 THEN RAISE EXCEPTION 'Desconto inválido'; END IF;
 IF p_preview THEN a.code:=v.code;a.base_cents:=base;a.discount_cents:=discount;a.due_cents:=base-discount;a.months:=CASE WHEN p_kind='setup' OR v.applies_to IN ('first_payment','setup_and_first') THEN 1 ELSE v.discount_months END;RETURN a;END IF;
 INSERT INTO commerce_voucher_reservations(order_id,user_id,voucher_id,kind,code,base_cents,discount_cents,due_cents,months)
 VALUES(o.id,p_user,v.id,p_kind,v.code,base,discount,base-discount,CASE WHEN p_kind='setup' OR v.applies_to IN ('first_payment','setup_and_first') THEN 1 ELSE v.discount_months END) RETURNING * INTO a;
 UPDATE business_orders SET setup_due_cents=CASE WHEN p_kind='setup' THEN a.due_cents ELSE setup_due_cents END,monthly_due_cents=CASE WHEN p_kind='subscription' THEN a.due_cents ELSE monthly_due_cents END WHERE id=o.id;
 RETURN a;
END $$;
