-- Migration: Create storage buckets for events and courses images
-- Description: Sets up public storage buckets for event banners and course thumbnails

-- Create the storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create the storage bucket for course images
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for event-images bucket
CREATE POLICY "Users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Users can update their event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images');

CREATE POLICY "Users can delete their event images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');

CREATE POLICY "Anyone can read event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Set up storage policies for course-images bucket
CREATE POLICY "Users can upload course images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Users can update their course images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-images');

CREATE POLICY "Users can delete their course images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-images');

CREATE POLICY "Anyone can read course images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-images');
