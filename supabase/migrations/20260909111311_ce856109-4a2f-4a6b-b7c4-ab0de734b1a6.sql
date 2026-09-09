
DROP VIEW IF EXISTS public.users_public;

CREATE OR REPLACE FUNCTION public.get_public_users()
RETURNS TABLE (id text, created_at timestamptz, data jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id,
         u.created_at,
         (u.data - 'email' - 'phone' - 'address' - 'adresse' - 'password' - 'whatsapp') AS data
  FROM public.users u;
$$;

REVOKE ALL ON FUNCTION public.get_public_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_users() TO anon, authenticated;
