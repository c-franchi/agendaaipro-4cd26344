-- Afiliados: 15% da implementação paga e 5% de cada mensalidade paga, enquanto o cliente pagar.
CREATE TABLE public.affiliates(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_-]{2,40}$'),
 name text NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
 whatsapp text CHECK (whatsapp IS NULL OR length(whatsapp)<=30),
 pix_key text CHECK (pix_key IS NULL OR length(pix_key)<=140),
 setup_rate numeric(5,4) NOT NULL DEFAULT 0.15 CHECK (setup_rate BETWEEN 0 AND 1),
 monthly_rate numeric(5,4) NOT NULL DEFAULT 0.05 CHECK (monthly_rate BETWEEN 0 AND 1),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.affiliate_commissions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 affiliate_id uuid NOT NULL REFERENCES public.affiliates(id),
 order_id uuid NOT NULL REFERENCES public.business_orders(id),
 event_id text NOT NULL UNIQUE,
 kind text NOT NULL CHECK (kind IN ('setup','monthly')),
 base_cents integer NOT NULL CHECK (base_cents>=0),
 rate numeric(5,4) NOT NULL,
 commission_cents integer NOT NULL CHECK (commission_cents>=0),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','canceled')),
 paid_at timestamptz,
 note text,
 created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.business_orders ADD COLUMN affiliate_id uuid REFERENCES public.affiliates(id);
CREATE INDEX affiliate_commissions_affiliate_idx ON public.affiliate_commissions(affiliate_id,status);

GRANT SELECT, INSERT, UPDATE ON public.affiliates TO authenticated;
GRANT SELECT, UPDATE ON public.affiliate_commissions TO authenticated;
GRANT ALL ON public.affiliates, public.affiliate_commissions TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage affiliates" ON public.affiliates FOR ALL TO authenticated
 USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read commissions" ON public.affiliate_commissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins settle commissions" ON public.affiliate_commissions FOR UPDATE TO authenticated
 USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Só status/paid_at/note podem mudar numa comissão; valores ficam fixos.
CREATE FUNCTION public.affiliate_guard_commission() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF (NEW.affiliate_id,NEW.order_id,NEW.event_id,NEW.kind,NEW.base_cents,NEW.rate,NEW.commission_cents,NEW.created_at)
   IS DISTINCT FROM (OLD.affiliate_id,OLD.order_id,OLD.event_id,OLD.kind,OLD.base_cents,OLD.rate,OLD.commission_cents,OLD.created_at)
 THEN RAISE EXCEPTION 'Valores da comissão não podem ser alterados'; END IF;
 NEW.paid_at:=CASE WHEN NEW.status='paid' THEN coalesce(NEW.paid_at,now()) ELSE NULL END;
 RETURN NEW;
END $$;
CREATE TRIGGER affiliate_guard_commission BEFORE UPDATE ON public.affiliate_commissions FOR EACH ROW EXECUTE FUNCTION public.affiliate_guard_commission();

-- O dono do pedido vincula o código de indicação antes de pagar (uma única vez).
CREATE FUNCTION public.affiliate_attach(p_order uuid,p_code text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a uuid;
BEGIN
 SELECT id INTO a FROM affiliates WHERE code=upper(trim(p_code)) AND active;
 IF a IS NULL THEN RETURN false; END IF;
 UPDATE business_orders SET affiliate_id=a WHERE id=p_order AND user_id=auth.uid() AND affiliate_id IS NULL AND paid_at IS NULL;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.affiliate_attach(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.affiliate_attach(uuid,text) TO authenticated;

-- Chamado só pelo webhook (service_role) com o valor realmente pago. Idempotente por evento.
CREATE FUNCTION public.affiliate_record_commission(p_order uuid,p_event text,p_kind text,p_amount integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE af affiliates; r numeric;
BEGIN
 IF p_kind NOT IN ('setup','monthly') OR coalesce(p_amount,0)<=0 THEN RETURN; END IF;
 SELECT f.* INTO af FROM business_orders o JOIN affiliates f ON f.id=o.affiliate_id WHERE o.id=p_order;
 IF af.id IS NULL THEN RETURN; END IF;
 r:=CASE WHEN p_kind='setup' THEN af.setup_rate ELSE af.monthly_rate END;
 INSERT INTO affiliate_commissions(affiliate_id,order_id,event_id,kind,base_cents,rate,commission_cents)
 VALUES(af.id,p_order,p_event,p_kind,p_amount,r,round(p_amount*r)::integer) ON CONFLICT (event_id) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.affiliate_record_commission(uuid,text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_record_commission(uuid,text,text,integer) TO service_role;
