DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a valid lead" ON public.leads
FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (phone IS NULL OR char_length(phone) <= 30)
  AND (business_type IS NULL OR char_length(business_type) <= 100)
  AND (message IS NULL OR char_length(message) <= 2000)
  AND (source IS NULL OR char_length(source) <= 100)
);