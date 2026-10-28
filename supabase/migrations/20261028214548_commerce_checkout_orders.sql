CREATE TABLE public.business_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_key uuid NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES auth.users(id), name text NOT NULL, email text NOT NULL,
 plan_type text NOT NULL CHECK(plan_type IN ('essencial','pro','premium')),
 module_plan text NOT NULL CHECK(module_plan IN ('agenda','gestao','premium')),
 setup_cents integer NOT NULL CHECK(setup_cents>0), monthly_cents integer NOT NULL CHECK(monthly_cents>0),
 currency text NOT NULL DEFAULT 'brl' CHECK(currency='brl'),
 stage text NOT NULL DEFAULT 'requested' CHECK(stage IN ('requested','awaiting_payment','queued','in_progress','ready','active','cancelled')),
 payment_status text NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','refunded')),
 subscription_status text NOT NULL DEFAULT 'not_started', scope_note text,
 setup_session_id text UNIQUE, subscription_session_id text UNIQUE,
 stripe_customer_id text, stripe_payment_intent_id text UNIQUE, stripe_subscription_id text UNIQUE,
 livemode boolean, website_url text, installation_id text,
 billing_event_created bigint NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz, ready_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_orders_owner_created ON public.business_orders(user_id,created_at DESC);
CREATE INDEX business_orders_stage_created ON public.business_orders(stage,created_at DESC);
CREATE TABLE public.business_order_events(event_id text PRIMARY KEY,order_id uuid NOT NULL REFERENCES public.business_orders(id),kind text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.business_order_audit(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES public.business_orders(id),actor_id uuid REFERENCES auth.users(id),event text NOT NULL,details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX business_order_audit_order ON public.business_order_audit(order_id,created_at DESC);
ALTER TABLE public.business_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_order_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_orders,public.business_order_events,public.business_order_audit FROM anon,authenticated;
GRANT SELECT ON public.business_orders TO authenticated;
GRANT ALL ON public.business_orders,public.business_order_events,public.business_order_audit TO service_role;
CREATE POLICY orders_owner_or_operator_read ON public.business_orders FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id OR lower((SELECT auth.jwt())->>'email')='neifranchi@gmail.com');

CREATE FUNCTION public.commerce_record_payment(p_order uuid,p_event text,p_kind text,p_session text,p_amount integer,p_currency text,p_live boolean,p_customer text,p_intent text,p_subscription text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.business_orders; inserted integer;
BEGIN
 SELECT * INTO o FROM public.business_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown order'; END IF;
 IF p_currency<>'brl' OR (p_kind='setup' AND (o.setup_session_id IS DISTINCT FROM p_session OR o.setup_cents<>p_amount)) OR (p_kind='subscription' AND (o.subscription_session_id IS DISTINCT FROM p_session OR o.monthly_cents<>p_amount)) OR p_kind NOT IN ('setup','subscription') THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF o.livemode IS DISTINCT FROM p_live THEN RAISE EXCEPTION 'Payment environment mismatch'; END IF;
 INSERT INTO public.business_order_events(event_id,order_id,kind) VALUES(p_event,p_order,p_kind) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT; IF inserted=0 THEN RETURN false; END IF;
 IF o.payment_status='refunded' THEN RETURN false; END IF;
 IF p_kind='setup' THEN
  IF p_intent IS NULL OR o.stage NOT IN ('awaiting_payment','queued','in_progress','ready','active') THEN RAISE EXCEPTION 'Order not payable'; END IF;
  UPDATE public.business_orders SET payment_status='paid',stage=CASE WHEN stage='awaiting_payment' THEN 'queued' ELSE stage END,paid_at=coalesce(paid_at,now()),stripe_customer_id=p_customer,stripe_payment_intent_id=p_intent,updated_at=now() WHERE id=p_order;
 ELSE
  IF o.payment_status<>'paid' OR o.stage NOT IN ('ready','active') OR p_subscription IS NULL THEN RAISE EXCEPTION 'Platform not ready'; END IF;
  UPDATE public.business_orders SET stage='active',subscription_status='active',stripe_subscription_id=p_subscription,stripe_customer_id=p_customer,updated_at=now() WHERE id=p_order;
 END IF;
 INSERT INTO public.business_order_audit(order_id,event,details) VALUES(p_order,'payment_confirmed',jsonb_build_object('kind',p_kind,'event_id',p_event,'amount_cents',p_amount));
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.commerce_record_payment(uuid,text,text,text,integer,text,boolean,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_record_payment(uuid,text,text,text,integer,text,boolean,text,text,text) TO service_role;

CREATE FUNCTION public.commerce_transition(p_order uuid,p_actor uuid,p_action text,p_note text,p_url text DEFAULT NULL,p_installation text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.business_orders; target text;
BEGIN
 SELECT * INTO o FROM public.business_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR length(trim(p_note))<3 OR length(p_note)>1000 THEN RAISE EXCEPTION 'Invalid order or note'; END IF;
 IF p_action='approve' AND o.stage='requested' THEN target='awaiting_payment';
 ELSIF p_action='start' AND o.stage='queued' AND o.payment_status='paid' THEN target='in_progress';
 ELSIF p_action='ready' AND o.stage='in_progress' AND o.payment_status='paid' AND p_url LIKE 'https://%' AND length(p_installation) BETWEEN 3 AND 80 THEN target='ready';
 ELSE RAISE EXCEPTION 'Invalid transition'; END IF;
 UPDATE public.business_orders SET stage=target,scope_note=p_note,website_url=CASE WHEN target='ready' THEN p_url ELSE website_url END,installation_id=CASE WHEN target='ready' THEN p_installation ELSE installation_id END,ready_at=CASE WHEN target='ready' THEN now() ELSE ready_at END,updated_at=now() WHERE id=p_order;
 INSERT INTO public.business_order_audit(order_id,actor_id,event,details) VALUES(p_order,p_actor,p_action,jsonb_build_object('from',o.stage,'to',target,'note',p_note));
END; $$;
REVOKE ALL ON FUNCTION public.commerce_transition(uuid,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_transition(uuid,uuid,text,text,text,text) TO service_role;

CREATE FUNCTION public.commerce_refund(p_intent text,p_event text,p_full boolean,p_order uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.business_orders; inserted integer;
BEGIN
 SELECT * INTO o FROM public.business_orders WHERE stripe_payment_intent_id=p_intent OR (id=p_order AND stripe_payment_intent_id IS NULL) FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 INSERT INTO public.business_order_events VALUES(p_event,o.id,'refund',now()) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT; IF inserted=0 THEN RETURN; END IF;
 IF p_full THEN UPDATE public.business_orders SET payment_status='refunded',stage='cancelled',stripe_payment_intent_id=p_intent,updated_at=now() WHERE id=o.id; END IF;
 INSERT INTO public.business_order_audit(order_id,event,details) VALUES(o.id,'refund',jsonb_build_object('full',p_full,'requires_operator_review',true));
END; $$;
REVOKE ALL ON FUNCTION public.commerce_refund(text,text,boolean,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_refund(text,text,boolean,uuid) TO service_role;
