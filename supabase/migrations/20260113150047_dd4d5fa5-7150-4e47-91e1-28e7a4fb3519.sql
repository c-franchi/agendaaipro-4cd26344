-- Add validity_months column to vouchers table
ALTER TABLE public.vouchers 
ADD COLUMN IF NOT EXISTS validity_months integer DEFAULT 1;

-- Update existing vouchers based on expires_at calculation
UPDATE public.vouchers 
SET validity_months = CASE 
  WHEN expires_at IS NULL THEN 1
  WHEN EXTRACT(MONTH FROM AGE(expires_at, starts_at)) >= 12 THEN 12
  WHEN EXTRACT(MONTH FROM AGE(expires_at, starts_at)) >= 6 THEN 6
  WHEN EXTRACT(MONTH FROM AGE(expires_at, starts_at)) >= 3 THEN 3
  ELSE 1
END
WHERE validity_months IS NULL OR validity_months = 1;