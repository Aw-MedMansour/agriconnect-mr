CREATE OR REPLACE FUNCTION public.get_public_users()
 RETURNS TABLE(id text, created_at timestamp with time zone, data jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only signed-in members may browse the member directory.
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.id,
         u.created_at,
         (u.data - 'email' - 'phone' - 'address' - 'adresse' - 'password' - 'whatsapp') AS data
  FROM public.users u;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_public_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_users() TO service_role;