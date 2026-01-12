-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  applies_to TEXT NOT NULL DEFAULT 'first_payment' CHECK (applies_to IN ('first_payment', 'monthly', 'setup', 'setup_and_first')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'exhausted', 'disabled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create voucher_uses table to track individual uses
CREATE TABLE public.voucher_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  plan_type TEXT,
  original_amount NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL,
  final_amount NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vouchers
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Policies for vouchers - only authenticated users can manage
CREATE POLICY "Authenticated users can view vouchers"
ON public.vouchers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create vouchers"
ON public.vouchers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vouchers"
ON public.vouchers FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete vouchers"
ON public.vouchers FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Enable RLS on voucher_uses
ALTER TABLE public.voucher_uses ENABLE ROW LEVEL SECURITY;

-- Anyone can insert voucher uses (for checkout flow)
CREATE POLICY "Anyone can insert voucher uses"
ON public.voucher_uses FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view voucher uses
CREATE POLICY "Authenticated users can view voucher uses"
ON public.voucher_uses FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create function to update voucher status automatically
CREATE OR REPLACE FUNCTION public.update_voucher_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update to exhausted if max_uses reached
  IF NEW.max_uses IS NOT NULL AND NEW.current_uses >= NEW.max_uses THEN
    NEW.status := 'exhausted';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for voucher status updates
CREATE TRIGGER update_vouchers_status_trigger
BEFORE UPDATE ON public.vouchers
FOR EACH ROW
EXECUTE FUNCTION public.update_voucher_status();

-- Create function to increment voucher uses
CREATE OR REPLACE FUNCTION public.increment_voucher_uses(voucher_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.vouchers
  SET current_uses = current_uses + 1
  WHERE code = voucher_code;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create index for faster voucher lookups
CREATE INDEX idx_vouchers_code ON public.vouchers(code);
CREATE INDEX idx_voucher_uses_voucher_id ON public.voucher_uses(voucher_id);
CREATE INDEX idx_voucher_uses_email ON public.voucher_uses(user_email);