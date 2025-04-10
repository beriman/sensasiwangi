-- Create storage bucket for sambatan payment proofs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('sambatan', 'sambatan', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sambatan' AND (storage.foldername(name))[1] = 'payment_proofs');

-- Set up storage policy to allow public access to files
DROP POLICY IF EXISTS "Allow public access to payment proofs" ON storage.objects;
CREATE POLICY "Allow public access to payment proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sambatan' AND (storage.foldername(name))[1] = 'payment_proofs');

-- Set up storage policy to allow users to update their own files
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sambatan' AND (storage.foldername(name))[1] = 'payment_proofs' AND auth.uid()::text = SPLIT_PART(SPLIT_PART(name, '/', 2), '-', 1));

-- Set up storage policy to allow users to delete their own files
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sambatan' AND (storage.foldername(name))[1] = 'payment_proofs' AND auth.uid()::text = SPLIT_PART(SPLIT_PART(name, '/', 2), '-', 1));

-- Add realtime for sambatan_participants table
alter publication supabase_realtime add table sambatan_participants;
