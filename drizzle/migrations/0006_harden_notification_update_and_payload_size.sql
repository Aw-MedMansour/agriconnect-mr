-- Recipients may only toggle the read flag, not rewrite notification content
DROP POLICY IF EXISTS notifications_update_recipient ON public.notifications;

CREATE POLICY notifications_update_recipient ON public.notifications
FOR UPDATE TO authenticated
USING ((data ->> 'recipientId') = (auth.uid())::text)
WITH CHECK (
  (data ->> 'recipientId') = (auth.uid())::text
  AND (data ->> 'actorId') <> (auth.uid())::text
  AND (
    SELECT (old_row.data - 'read') = (data - 'read')
    FROM public.notifications AS old_row
    WHERE old_row.id = notifications.id
  )
);

-- Bound payload size on user-generated content tables
ALTER TABLE public.posts
  ADD CONSTRAINT posts_data_size_check CHECK (pg_column_size(data) <= 200000);
ALTER TABLE public.products
  ADD CONSTRAINT products_data_size_check CHECK (pg_column_size(data) <= 200000);
ALTER TABLE public.services
  ADD CONSTRAINT services_data_size_check CHECK (pg_column_size(data) <= 200000);
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_data_size_check CHECK (pg_column_size(data) <= 20000);