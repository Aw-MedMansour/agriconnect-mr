DROP POLICY IF EXISTS notifications_update_recipient ON public.notifications;

CREATE POLICY notifications_update_recipient ON public.notifications
FOR UPDATE TO authenticated
USING ((data ->> 'recipientId') = (auth.uid())::text)
WITH CHECK (
  (data ->> 'recipientId') = (auth.uid())::text
  AND (data ->> 'actorId') <> (auth.uid())::text
);

CREATE OR REPLACE FUNCTION public.guard_notification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.data - 'read') <> (NEW.data - 'read') THEN
    RAISE EXCEPTION 'Seul le statut de lecture peut être modifié';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_notification_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_notification_update_trg ON public.notifications;
CREATE TRIGGER guard_notification_update_trg
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.guard_notification_update();