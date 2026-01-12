-- Create leads table to store interested users
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_type TEXT,
  message TEXT,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting leads (anyone can submit a lead)
CREATE POLICY "Anyone can submit a lead" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- Create policy for reading leads (only authenticated admins - we'll add proper admin role later)
CREATE POLICY "Only authenticated users can view leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() IS NOT NULL);