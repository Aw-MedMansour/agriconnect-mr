-- 1) Remove redundant storage INSERT policy lacking ownership check
DROP POLICY IF EXISTS agroconnect_media_auth_upload ON storage.objects;

-- 2) Restrict user profile reads: own row, conversation partners, or professionals with public activity
DROP POLICY IF EXISTS users_authenticated_read ON public.users;

CREATE POLICY users_scoped_read ON public.users
FOR SELECT TO authenticated
USING (
  id = (auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE jsonb_exists(c.data -> 'participantIds', users.id)
      AND jsonb_exists(c.data -> 'participantIds', (auth.uid())::text)
  )
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.data ->> 'authorId' = users.id)
  OR EXISTS (SELECT 1 FROM public.products pr WHERE pr.data ->> 'sellerId' = users.id)
  OR EXISTS (SELECT 1 FROM public.services s WHERE s.data ->> 'providerId' = users.id)
);