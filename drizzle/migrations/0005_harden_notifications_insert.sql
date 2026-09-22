-- Stricter validation of the notification payload
DROP POLICY IF EXISTS notifications_insert_actor ON public.notifications;

CREATE POLICY notifications_insert_actor ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  (data ->> 'actorId') = (auth.uid())::text
  AND (data ->> 'recipientId') IS NOT NULL
  AND (data ->> 'recipientId') <> (auth.uid())::text
  AND (data ->> 'type') = ANY (ARRAY['message','follow','post_like','post_comment','comment_reply','comment_reaction','product_like','product_comment','repost'])
  -- only known keys are accepted
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_object_keys(data) AS k(key)
    WHERE k.key NOT IN ('id','recipientId','actorId','actorName','actorAvatar','type','text','target','read','ts')
  )
  AND (data ->> 'id') = id
  AND length(COALESCE(data ->> 'text', '')) <= 300
  AND length(COALESCE(data ->> 'actorName', '')) <= 120
  AND length(COALESCE(data ->> 'actorAvatar', '')) <= 500
  AND COALESCE(data ->> 'read', 'false') = 'false'
  AND (NOT (data ? 'target') OR jsonb_typeof(data -> 'target') = 'object')
);

-- Anti-abuse: limit the number of notifications an actor can create per minute
CREATE OR REPLACE FUNCTION public.enforce_notification_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.notifications n
  WHERE n.data ->> 'actorId' = NEW.data ->> 'actorId'
    AND n.created_at > now() - interval '1 minute';

  IF recent_count >= 30 THEN
    RAISE EXCEPTION 'Trop de notifications envoyées, réessayez dans un instant';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_notification_rate_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_notification_rate_limit_trg ON public.notifications;
CREATE TRIGGER enforce_notification_rate_limit_trg
BEFORE INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.enforce_notification_rate_limit();