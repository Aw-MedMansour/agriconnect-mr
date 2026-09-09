CREATE POLICY "agroconnect_media_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'agroconnect-media');
CREATE POLICY "agroconnect_media_auth_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'agroconnect-media');
CREATE POLICY "agroconnect_media_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'agroconnect-media') WITH CHECK (bucket_id = 'agroconnect-media');
CREATE POLICY "agroconnect_media_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'agroconnect-media');