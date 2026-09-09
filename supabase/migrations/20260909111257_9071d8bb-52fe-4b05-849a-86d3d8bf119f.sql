
-- 1) Restrict full user rows (with contact details) to self + conversation partners
DROP POLICY IF EXISTS users_scoped_read ON public.users;

CREATE POLICY users_self_or_conversation_read
ON public.users
FOR SELECT
TO authenticated
USING (
  id = (auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE jsonb_exists(c.data -> 'participantIds', users.id)
      AND jsonb_exists(c.data -> 'participantIds', (auth.uid())::text)
  )
);

-- 2) Sanitized public profile view (no contact details)
CREATE OR REPLACE VIEW public.users_public
WITH (security_invoker = off, security_barrier = on) AS
SELECT
  u.id,
  u.created_at,
  (u.data - 'email' - 'phone' - 'address' - 'adresse' - 'password' - 'whatsapp') AS data
FROM public.users u;

GRANT SELECT ON public.users_public TO anon, authenticated;

-- 3) Strip contact fields from public listings on write
CREATE OR REPLACE FUNCTION public.strip_contact_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.data := NEW.data - 'email' - 'phone' - 'address' - 'adresse' - 'whatsapp'
              - 'sellerEmail' - 'sellerPhone' - 'providerEmail' - 'providerPhone'
              - 'authorEmail' - 'authorPhone' - 'contactEmail' - 'contactPhone';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS strip_contact_products ON public.products;
CREATE TRIGGER strip_contact_products
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.strip_contact_fields();

DROP TRIGGER IF EXISTS strip_contact_services ON public.services;
CREATE TRIGGER strip_contact_services
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.strip_contact_fields();

DROP TRIGGER IF EXISTS strip_contact_posts ON public.posts;
CREATE TRIGGER strip_contact_posts
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.strip_contact_fields();

-- Clean existing rows
UPDATE public.products SET data = data WHERE true;
UPDATE public.services SET data = data WHERE true;
UPDATE public.posts SET data = data WHERE true;
