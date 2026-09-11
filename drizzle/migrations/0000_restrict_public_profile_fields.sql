-- Whitelist the only fields that may be visible to other members
CREATE OR REPLACE FUNCTION public.public_profile_fields(d jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT jsonb_object_agg(key, value)
     FROM jsonb_each(COALESCE(d, '{}'::jsonb))
     WHERE key IN (
       'id','name','avatar','coverImage','bio','company','role','roleLabel',
       'badge','verified','rating','reviewsCount','transactionsCount',
       'specialties','zone','location'
     )),
    '{}'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.public_profile_fields(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_profile_fields(jsonb) TO anon, authenticated, service_role;

-- Apply whitelist on write to public_profiles
CREATE OR REPLACE FUNCTION public.limit_public_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.data := public.public_profile_fields(public.strip_contact_keys(NEW.data));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS strip_contact_public_profiles ON public.public_profiles;
DROP TRIGGER IF EXISTS limit_public_profile_fields_trg ON public.public_profiles;
CREATE TRIGGER limit_public_profile_fields_trg
BEFORE INSERT OR UPDATE ON public.public_profiles
FOR EACH ROW EXECUTE FUNCTION public.limit_public_profile_fields();

-- Keep the sync from users in line with the whitelist
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.public_profiles (id, created_at, data)
  VALUES (NEW.id, NEW.created_at, public.public_profile_fields(public.strip_contact_keys(NEW.data)))
  ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$;

-- Clean existing rows
UPDATE public.public_profiles
SET data = public.public_profile_fields(public.strip_contact_keys(data));
