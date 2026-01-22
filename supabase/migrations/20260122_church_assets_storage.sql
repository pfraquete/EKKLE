-- Migration: Create storage bucket for church assets (logos, favicons, etc)
-- Description: Sets up a public storage bucket for church branding assets

-- Create the storage bucket for church assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-assets', 'church-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for church assets bucket
-- Allow authenticated users to upload files to their church's folder
CREATE POLICY "Users can upload to their church folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'church-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update files in their church's folder
CREATE POLICY "Users can update their church files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'church-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete files in their church's folder
CREATE POLICY "Users can delete their church files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'church-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to read files (public bucket)
CREATE POLICY "Anyone can read church assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'church-assets');
