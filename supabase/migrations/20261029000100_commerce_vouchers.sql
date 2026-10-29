-- Additive voucher integration; legacy vouchers require explicit review.
ALTER TABLE public.vouchers ADD COLUMN commerce_enabled boolean NOT NULL DEFAULT false,
 ADD COLUMN discount_months integer NOT NULL DEFAULT 1 CHECK(discount_months BETWEEN 1 AND 12);
ALTER TABLE public.business_orders ADD COLUMN setup_due_cents integer CHECK(setup_due_cents>=0),
 ADD COLUMN monthly_due_cents integer CHECK(monthly_due_cents>=0),
 ADD COLUMN setup_waived boolean NOT NULL DEFAULT false;
CREATE TABLE public.commerce_voucher_reservations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.business_orders(id),
 user_id uuid NOT NULL REFERENCES auth.users(id), voucher_id uuid NOT NULL REFERENCES public.vouchers(id),
 kind text NOT NULL CHECK(kind IN ('setup','subscription')), code text NOT NULL,
 base_cents integer NOT NULL, discount_cents integer NOT NULL, due_cents integer NOT NULL,
 months integer NOT NULL, session_id text UNIQUE, coupon_id text,
 state text NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','consumed','released')),
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(discount_cents>0 AND due_cents>=0 AND due_cents+discount_cents=base_cents)
);
CREATE UNIQUE INDEX commerce_one_reservation ON public.commerce_voucher_reservations(order_id,kind) WHERE state<>'released';
ALTER TABLE public.commerce_voucher_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.commerce_voucher_reservations FROM anon,authenticated;
GRANT ALL ON public.commerce_voucher_reservations TO service_role;
-- Replace permissive legacy policies: only the verified operator manages vouchers.
DO $$ DECLARE p record; BEGIN FOR p IN SELECT tablename,policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('vouchers','voucher_uses') LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP; END $$;
REVOKE ALL ON public.vouchers,public.voucher_uses FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.vouchers TO authenticated;
GRANT SELECT ON public.voucher_uses TO authenticated;
GRANT ALL ON public.vouchers,public.voucher_uses TO service_role;
CREATE POLICY vouchers_operator ON public.vouchers FOR ALL TO authenticated USING(lower(auth.jwt()->>'email')='neifranchi@gmail.com') WITH CHECK(lower(auth.jwt()->>'email')='neifranchi@gmail.com');
CREATE POLICY voucher_uses_read ON public.voucher_uses FOR SELECT TO authenticated USING(lower(auth.jwt()->>'email')='neifranchi@gmail.com' OR lower(user_email)=lower(auth.jwt()->>'email'));
REVOKE ALL ON FUNCTION public.increment_voucher_uses(text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.commerce_reserve_voucher(p_order uuid,p_user uuid,p_kind text,p_code text,p_preview boolean DEFAULT false)
RETURNS public.commerce_voucher_reservations LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.business_orders; v public.vouchers; a public.commerce_voucher_reservations; base integer; discount integer; used integer; BEGIN
 SELECT * INTO o FROM business_orders WHERE id=p_order AND user_id=p_user FOR UPDATE;
 IF NOT FOUND OR p_kind NOT IN ('setup','subscription') THEN RAISE EXCEPTION 'Pedido inválido'; END IF;
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
REVOKE ALL ON FUNCTION public.commerce_reserve_voucher(uuid,uuid,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_reserve_voucher(uuid,uuid,text,text,boolean) TO service_role;
-- Consumption happens inside the authoritative payment transaction, after validation.
CREATE FUNCTION public.commerce_consume_voucher() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE a public.commerce_voucher_reservations; BEGIN
 FOR a IN SELECT * FROM commerce_voucher_reservations WHERE order_id=NEW.id AND state='reserved' AND ((kind='setup' AND NEW.payment_status='paid' AND OLD.payment_status='pending') OR (kind='subscription' AND NEW.stripe_subscription_id IS NOT NULL AND OLD.stripe_subscription_id IS NULL)) FOR UPDATE LOOP
  IF a.session_id IS DISTINCT FROM (CASE WHEN a.kind='setup' THEN NEW.setup_session_id ELSE NEW.subscription_session_id END) THEN RAISE EXCEPTION 'Voucher session mismatch'; END IF;
  INSERT INTO voucher_uses(voucher_id,user_email,user_name,plan_type,original_amount,discount_amount,final_amount,stripe_checkout_session_id,stripe_payment_intent_id) VALUES(a.voucher_id,NEW.email,NEW.name,NEW.plan_type,a.base_cents/100.0,a.discount_cents/100.0,a.due_cents/100.0,a.session_id,NEW.stripe_payment_intent_id);
  UPDATE commerce_voucher_reservations SET state='consumed' WHERE id=a.id;
  UPDATE vouchers SET current_uses=current_uses+1 WHERE id=a.voucher_id;
 END LOOP; RETURN NEW;
END $$;
CREATE TRIGGER commerce_consume_voucher AFTER UPDATE ON public.business_orders FOR EACH ROW EXECUTE FUNCTION public.commerce_consume_voucher();

CREATE OR REPLACE FUNCTION public.commerce_record_payment(p_order uuid,p_event text,p_kind text,p_session text,p_amount integer,p_currency text,p_live boolean,p_customer text,p_intent text,p_subscription text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.business_orders; inserted integer;
BEGIN
 SELECT * INTO o FROM public.business_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown order'; END IF;
 IF p_currency<>'brl' OR (p_kind='setup' AND (o.setup_session_id IS DISTINCT FROM p_session OR coalesce(o.setup_due_cents,o.setup_cents)<>p_amount)) OR (p_kind='subscription' AND (o.subscription_session_id IS DISTINCT FROM p_session OR coalesce(o.monthly_due_cents,o.monthly_cents)<>p_amount)) OR p_kind NOT IN ('setup','subscription') THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF o.livemode IS DISTINCT FROM p_live THEN RAISE EXCEPTION 'Payment environment mismatch'; END IF;
 INSERT INTO public.business_order_events(event_id,order_id,kind) VALUES(p_event,p_order,p_kind) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT; IF inserted=0 THEN RETURN false; END IF;
 IF o.payment_status='refunded' THEN RETURN false; END IF;
 IF p_kind='setup' THEN
  IF (p_intent IS NULL AND coalesce(o.setup_due_cents,o.setup_cents)>0) OR o.stage NOT IN ('awaiting_payment','queued','in_progress','ready','active') THEN RAISE EXCEPTION 'Order not payable'; END IF;
  UPDATE public.business_orders SET payment_status='paid',setup_waived=(p_amount=0),stage=CASE WHEN stage='awaiting_payment' THEN 'queued' ELSE stage END,paid_at=coalesce(paid_at,now()),stripe_customer_id=p_customer,stripe_payment_intent_id=p_intent,updated_at=now() WHERE id=p_order;
 ELSE
  IF o.payment_status<>'paid' OR o.stage NOT IN ('ready','active') OR p_subscription IS NULL THEN RAISE EXCEPTION 'Platform not ready'; END IF;
  UPDATE public.business_orders SET stage='active',subscription_status='active',stripe_subscription_id=p_subscription,stripe_customer_id=p_customer,updated_at=now() WHERE id=p_order;
 END IF;
 INSERT INTO public.business_order_audit(order_id,event,details) VALUES(p_order,'payment_confirmed',jsonb_build_object('kind',p_kind,'event_id',p_event,'amount_cents',p_amount));
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.commerce_record_payment(uuid,text,text,text,integer,text,boolean,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_record_payment(uuid,text,text,text,integer,text,boolean,text,text,text) TO service_role;


CREATE FUNCTION public.commerce_release_voucher(p_session text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE a public.commerce_voucher_reservations; BEGIN
 SELECT * INTO a FROM commerce_voucher_reservations WHERE session_id=p_session AND state='reserved';
 IF NOT FOUND THEN RETURN; END IF;
 PERFORM 1 FROM business_orders WHERE id=a.order_id FOR UPDATE;
 UPDATE commerce_voucher_reservations SET state='released' WHERE id=a.id AND state='reserved';
 UPDATE business_orders SET setup_due_cents=CASE WHEN a.kind='setup' THEN NULL ELSE setup_due_cents END,monthly_due_cents=CASE WHEN a.kind='subscription' THEN NULL ELSE monthly_due_cents END WHERE id=a.order_id AND (CASE WHEN a.kind='setup' THEN setup_session_id ELSE subscription_session_id END)=p_session;
END $$;
REVOKE ALL ON FUNCTION public.commerce_release_voucher(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_release_voucher(text) TO service_role;
