
CREATE POLICY "public upload issue photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'issue-photos');
CREATE POLICY "auth read issue photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'issue-photos');
CREATE POLICY "anon read issue photos" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'issue-photos');
