CREATE TABLE IF NOT EXISTS public.public_profiles (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  data jsonb NOT NULL
);

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT ALL ON public.public_profiles TO service_role;

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_profiles_authenticated_read" ON public.public_profiles;
CREATE POLICY "public_profiles_authenticated_read"
ON public.public_profiles FOR SELECT TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.public_profiles (id, created_at, data)
  VALUES (
    NEW.id,
    NEW.created_at,
    NEW.data - 'email' - 'phone' - 'address' - 'adresse' - 'password' - 'whatsapp'
  )
  ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_public_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_public_profile() FROM anon;
REVOKE ALL ON FUNCTION public.sync_public_profile() FROM authenticated;

DROP TRIGGER IF EXISTS sync_public_profile_trg ON public.users;
CREATE TRIGGER sync_public_profile_trg
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

INSERT INTO public.public_profiles (id, created_at, data)
SELECT u.id, u.created_at,
       u.data - 'email' - 'phone' - 'address' - 'adresse' - 'password' - 'whatsapp'
FROM public.users u
ON CONFLICT (id) DO UPDATE
  SET data = EXCLUDED.data,
      created_at = EXCLUDED.created_at;

DROP FUNCTION IF EXISTS public.get_public_users();