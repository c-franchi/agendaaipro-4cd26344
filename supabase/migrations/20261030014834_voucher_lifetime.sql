-- Zero months represents a discount that lasts for the active subscription.
ALTER TABLE public.vouchers DROP CONSTRAINT IF EXISTS vouchers_discount_months_check;
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_discount_months_check CHECK(discount_months BETWEEN 0 AND 12);
COMMENT ON COLUMN public.vouchers.discount_months IS '0 = lifetime of active subscription; 1..12 = finite months. Redemption expiry is separate.';
NOTIFY pgrst, 'reload schema';
