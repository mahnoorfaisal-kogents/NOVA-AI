INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('nova-files', 'nova-files', false, 52428800)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 52428800;

CREATE POLICY "nova files select own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'nova-files' AND owner_id = auth.uid()::text);

CREATE POLICY "nova files insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nova-files' AND owner_id = auth.uid()::text);

CREATE POLICY "nova files update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'nova-files' AND owner_id = auth.uid()::text)
  WITH CHECK (bucket_id = 'nova-files' AND owner_id = auth.uid()::text);

CREATE POLICY "nova files delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'nova-files' AND owner_id = auth.uid()::text);
