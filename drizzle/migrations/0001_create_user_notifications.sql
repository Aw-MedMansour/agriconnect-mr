CREATE TABLE public.notifications (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_recipient
ON public.notifications
FOR SELECT
TO authenticated
USING ((data ->> 'recipientId') = (auth.uid())::text);

CREATE POLICY notifications_insert_actor
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (data ->> 'actorId') = (auth.uid())::text
  AND (data ->> 'recipientId') IS NOT NULL
  AND (data ->> 'recipientId') <> (auth.uid())::text
  AND (data ->> 'type') IN ('message', 'follow', 'post_like', 'post_comment', 'comment_reply', 'comment_reaction', 'product_like', 'product_comment', 'repost')
);

CREATE POLICY notifications_update_recipient
ON public.notifications
FOR UPDATE
TO authenticated
USING ((data ->> 'recipientId') = (auth.uid())::text)
WITH CHECK (
  (data ->> 'recipientId') = (auth.uid())::text
  AND (data ->> 'actorId') <> (auth.uid())::text
);

CREATE POLICY notifications_delete_recipient
ON public.notifications
FOR DELETE
TO authenticated
USING ((data ->> 'recipientId') = (auth.uid())::text);

CREATE INDEX notifications_recipient_created_idx
ON public.notifications ((data ->> 'recipientId'), created_at DESC);