DROP FUNCTION IF EXISTS public.affiliate_record_commission(uuid,text,text,integer);
DROP FUNCTION IF EXISTS public.affiliate_attach(uuid,text);
DROP TABLE IF EXISTS public.affiliate_commissions;
DROP FUNCTION IF EXISTS public.affiliate_guard_commission();
ALTER TABLE public.business_orders DROP COLUMN IF EXISTS affiliate_id;
DROP TABLE IF EXISTS public.affiliates;
