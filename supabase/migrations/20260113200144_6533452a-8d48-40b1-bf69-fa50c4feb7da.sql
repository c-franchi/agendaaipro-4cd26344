-- Corrigir RLS para proteção de dados LGPD

-- 1. LEADS: Apenas admins podem visualizar
DROP POLICY IF EXISTS "Only authenticated users can view leads" ON public.leads;
CREATE POLICY "Only admins can view leads" 
ON public.leads 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. VOUCHER_USES: Restringir acesso
DROP POLICY IF EXISTS "Authenticated users can view voucher uses" ON public.voucher_uses;
DROP POLICY IF EXISTS "Anyone can insert voucher uses" ON public.voucher_uses;

-- Usuários só veem seus próprios registros
CREATE POLICY "Users can view own voucher uses" 
ON public.voucher_uses 
FOR SELECT 
USING (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Usuários autenticados podem inserir apenas seu próprio email
CREATE POLICY "Authenticated users can insert own voucher uses" 
ON public.voucher_uses 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 3. VOUCHERS: Apenas admins podem gerenciar, público pode ver ativos para validação
DROP POLICY IF EXISTS "Authenticated users can create vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Authenticated users can delete vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Authenticated users can update vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Authenticated users can view vouchers" ON public.vouchers;

-- Qualquer um pode ver vouchers ativos (necessário para validação no checkout)
CREATE POLICY "Anyone can view active vouchers" 
ON public.vouchers 
FOR SELECT 
USING (status = 'active' OR public.has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem criar vouchers
CREATE POLICY "Admins can create vouchers" 
ON public.vouchers 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar vouchers
CREATE POLICY "Admins can update vouchers" 
ON public.vouchers 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar vouchers
CREATE POLICY "Admins can delete vouchers" 
ON public.vouchers 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));