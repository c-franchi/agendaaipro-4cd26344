-- Public marketing media; only the confirmed operator may upload or replace files.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('landing-videos','landing-videos',true,104857600,ARRAY['video/mp4','video/webm'])
ON CONFLICT(id) DO UPDATE SET file_size_limit=104857600,allowed_mime_types=ARRAY['video/mp4','video/webm'];
CREATE POLICY "Public landing video read" ON storage.objects FOR SELECT USING(bucket_id='landing-videos');
CREATE POLICY "Operator landing video upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='landing-videos' AND lower(auth.jwt()->>'email')='neifranchi@gmail.com');
CREATE POLICY "Operator landing video update" ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='landing-videos' AND lower(auth.jwt()->>'email')='neifranchi@gmail.com') WITH CHECK(bucket_id='landing-videos' AND lower(auth.jwt()->>'email')='neifranchi@gmail.com');
CREATE POLICY "Operator landing video delete" ON storage.objects FOR DELETE TO authenticated USING(bucket_id='landing-videos' AND lower(auth.jwt()->>'email')='neifranchi@gmail.com');
DROP POLICY IF EXISTS "Admins can upload landing images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update landing images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete landing images" ON storage.objects;
CREATE POLICY "Operator landing image upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='landing-images' AND lower(auth.jwt()->>'email')='neifranchi@gmail.com');
CREATE POLICY "Operator landing image update" ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='landing-images' AND lower(auth.jwt()->>'email')='neifranchi@gmail.com') WITH CHECK(bucket_id='landing-images' AND lower(auth.jwt()->>'email')='neifranchi@gmail.com');
CREATE POLICY "Operator landing image delete" ON storage.objects FOR DELETE TO authenticated USING(bucket_id='landing-images' AND lower(auth.jwt()->>'email')='neifranchi@gmail.com');

UPDATE storage.buckets SET file_size_limit=5242880,allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'] WHERE id='landing-images';
