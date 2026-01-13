-- Create storage bucket for landing page images
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-images', 'landing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to landing images
CREATE POLICY "Anyone can view landing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-images');

-- Allow authenticated admins to upload landing images
CREATE POLICY "Admins can upload landing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landing-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated admins to update landing images
CREATE POLICY "Admins can update landing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'landing-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated admins to delete landing images
CREATE POLICY "Admins can delete landing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'landing-images' 
  AND auth.role() = 'authenticated'
);

-- Update landing_content table to add image URLs for plans
UPDATE public.landing_content 
SET value = jsonb_set(
  value::jsonb,
  '{essencial,bg_image}',
  '""'::jsonb
)
WHERE key = 'pricing_plans';

UPDATE public.landing_content 
SET value = jsonb_set(
  value::jsonb,
  '{pro,bg_image}',
  '""'::jsonb
)
WHERE key = 'pricing_plans';

UPDATE public.landing_content 
SET value = jsonb_set(
  value::jsonb,
  '{premium,bg_image}',
  '""'::jsonb
)
WHERE key = 'pricing_plans';