-- USERS
DROP POLICY IF EXISTS users_public_read ON public.users;
DROP POLICY IF EXISTS users_auth_insert ON public.users;
DROP POLICY IF EXISTS users_auth_update ON public.users;
REVOKE SELECT ON public.users FROM anon;

CREATE POLICY users_authenticated_read ON public.users
  FOR SELECT TO authenticated USING (true);
CREATE POLICY users_insert_own ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid()::text);
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);

-- PRODUCTS
DROP POLICY IF EXISTS products_auth_insert ON public.products;
DROP POLICY IF EXISTS products_auth_update ON public.products;
DROP POLICY IF EXISTS products_auth_delete ON public.products;

CREATE POLICY products_insert_own ON public.products
  FOR INSERT TO authenticated WITH CHECK (data->>'sellerId' = auth.uid()::text);
CREATE POLICY products_update_own ON public.products
  FOR UPDATE TO authenticated
  USING (data->>'sellerId' = auth.uid()::text)
  WITH CHECK (data->>'sellerId' = auth.uid()::text);
CREATE POLICY products_delete_own ON public.products
  FOR DELETE TO authenticated USING (data->>'sellerId' = auth.uid()::text);

-- SERVICES
DROP POLICY IF EXISTS services_auth_insert ON public.services;
DROP POLICY IF EXISTS services_auth_update ON public.services;
DROP POLICY IF EXISTS services_auth_delete ON public.services;

CREATE POLICY services_insert_own ON public.services
  FOR INSERT TO authenticated WITH CHECK (data->>'providerId' = auth.uid()::text);
CREATE POLICY services_update_own ON public.services
  FOR UPDATE TO authenticated
  USING (data->>'providerId' = auth.uid()::text)
  WITH CHECK (data->>'providerId' = auth.uid()::text);
CREATE POLICY services_delete_own ON public.services
  FOR DELETE TO authenticated USING (data->>'providerId' = auth.uid()::text);

-- POSTS
DROP POLICY IF EXISTS posts_auth_insert ON public.posts;
DROP POLICY IF EXISTS posts_auth_update ON public.posts;
DROP POLICY IF EXISTS posts_auth_delete ON public.posts;

CREATE POLICY posts_insert_own ON public.posts
  FOR INSERT TO authenticated WITH CHECK (data->>'authorId' = auth.uid()::text);
CREATE POLICY posts_update_own ON public.posts
  FOR UPDATE TO authenticated
  USING (data->>'authorId' = auth.uid()::text)
  WITH CHECK (data->>'authorId' = auth.uid()::text);
CREATE POLICY posts_delete_own ON public.posts
  FOR DELETE TO authenticated USING (data->>'authorId' = auth.uid()::text);

-- CONVERSATIONS
DROP POLICY IF EXISTS conversations_auth_all ON public.conversations;

CREATE POLICY conversations_select_participant ON public.conversations
  FOR SELECT TO authenticated
  USING (jsonb_exists(data->'participantIds', auth.uid()::text));
CREATE POLICY conversations_insert_participant ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (jsonb_exists(data->'participantIds', auth.uid()::text));
CREATE POLICY conversations_update_participant ON public.conversations
  FOR UPDATE TO authenticated
  USING (jsonb_exists(data->'participantIds', auth.uid()::text))
  WITH CHECK (jsonb_exists(data->'participantIds', auth.uid()::text));
CREATE POLICY conversations_delete_participant ON public.conversations
  FOR DELETE TO authenticated
  USING (jsonb_exists(data->'participantIds', auth.uid()::text));

-- STORAGE OBJECTS (agroconnect-media)
DROP POLICY IF EXISTS agroconnect_media_auth_read ON storage.objects;
DROP POLICY IF EXISTS agroconnect_media_auth_insert ON storage.objects;
DROP POLICY IF EXISTS agroconnect_media_auth_update ON storage.objects;
DROP POLICY IF EXISTS agroconnect_media_auth_delete ON storage.objects;

CREATE POLICY agroconnect_media_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'agroconnect-media' AND owner = auth.uid());
CREATE POLICY agroconnect_media_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'agroconnect-media' AND owner = auth.uid());
CREATE POLICY agroconnect_media_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'agroconnect-media' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'agroconnect-media' AND owner = auth.uid());
CREATE POLICY agroconnect_media_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'agroconnect-media' AND owner = auth.uid());