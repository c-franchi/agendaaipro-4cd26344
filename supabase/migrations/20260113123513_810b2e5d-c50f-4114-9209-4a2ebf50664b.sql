-- Create table for landing page content management
CREATE TABLE public.landing_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- Enable RLS
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access for landing page
CREATE POLICY "Anyone can view landing content" 
ON public.landing_content 
FOR SELECT 
USING (true);

-- Only authenticated users can update (admin check will be done in app)
CREATE POLICY "Authenticated users can update landing content" 
ON public.landing_content 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert landing content" 
ON public.landing_content 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default content for pricing section
INSERT INTO public.landing_content (key, value) VALUES 
('pricing_plans', '{
  "essencial": {
    "name": "Essencial",
    "price": 97,
    "promotional_price": null,
    "description": "Para quem quer começar a profissionalizar",
    "features": ["Agendamento online", "Notificações por WhatsApp", "Relatórios básicos", "1 profissional"],
    "popular": false
  },
  "pro": {
    "name": "Pro",
    "price": 197,
    "promotional_price": null,
    "description": "O mais escolhido por profissionais",
    "features": ["Tudo do Essencial", "Pagamentos online", "Vendas de produtos", "Até 3 profissionais", "Relatórios avançados"],
    "popular": true
  },
  "premium": {
    "name": "Premium",
    "price": 397,
    "promotional_price": null,
    "description": "Recursos completos para quem quer tudo",
    "features": ["Tudo do Pro", "Profissionais ilimitados", "Domínio personalizado", "Suporte prioritário", "Integrações avançadas"],
    "popular": false
  }
}'::jsonb),
('hero_content', '{
  "title": "Seu sistema de agenda digital profissional",
  "subtitle": "Automatize agendamentos, pagamentos e muito mais",
  "cta_primary": "Quero meu AgendaAÍ Pro",
  "cta_secondary": "Falar no WhatsApp"
}'::jsonb),
('contact_info', '{
  "whatsapp": "5511999999999",
  "email": "contato@agendaaipro.com.br",
  "instagram": "@agendaaipro"
}'::jsonb);