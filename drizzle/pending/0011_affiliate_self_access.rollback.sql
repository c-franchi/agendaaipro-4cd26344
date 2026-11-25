DROP POLICY IF EXISTS "Affiliate reads own commissions" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Affiliate reads own" ON public.affiliates;
DROP INDEX IF EXISTS public.affiliates_email_uidx;
ALTER TABLE public.affiliates DROP COLUMN IF EXISTS email;
