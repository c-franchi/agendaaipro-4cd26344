-- Afiliado vê apenas o próprio cadastro e as próprias comissões (vínculo pelo e-mail de login).
ALTER TABLE public.affiliates ADD COLUMN email text CHECK (email IS NULL OR length(email)<=255);
CREATE UNIQUE INDEX affiliates_email_uidx ON public.affiliates(lower(email)) WHERE email IS NOT NULL;
CREATE POLICY "Affiliate reads own" ON public.affiliates FOR SELECT TO authenticated
 USING (email IS NOT NULL AND lower(email)=lower(auth.jwt()->>'email'));
CREATE POLICY "Affiliate reads own commissions" ON public.affiliate_commissions FOR SELECT TO authenticated
 USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE email IS NOT NULL AND lower(email)=lower(auth.jwt()->>'email')));
