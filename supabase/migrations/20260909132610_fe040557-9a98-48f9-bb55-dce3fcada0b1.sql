CREATE OR REPLACE FUNCTION public.strip_contact_keys(d jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT d - ARRAY[
    'email','phone','address','adresse','whatsapp','password','tel','telephone','mobile','contact',
    'sellerEmail','sellerPhone','sellerWhatsapp','sellerAddress',
    'providerEmail','providerPhone','providerWhatsapp','providerAddress',
    'authorEmail','authorPhone','authorWhatsapp','authorAddress',
    'contactEmail','contactPhone','contactWhatsapp'
  ];
$$;

CREATE OR REPLACE FUNCTION public.strip_contact_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.data := public.strip_contact_keys(NEW.data);
  RETURN NEW;
END;
$$;

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
  VALUES (NEW.id, NEW.created_at, public.strip_contact_keys(NEW.data))
  ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.strip_contact_keys(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.strip_contact_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_public_profile() FROM PUBLIC, anon, authenticated;