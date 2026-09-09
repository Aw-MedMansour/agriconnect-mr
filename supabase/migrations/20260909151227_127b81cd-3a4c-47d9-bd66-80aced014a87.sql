CREATE OR REPLACE FUNCTION public.strip_contact_keys(d jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT d - ARRAY[
    'email','phone','address','adresse','whatsapp','password','passwordHash','tel','telephone','mobile','contact','contactInfo',
    'sellerEmail','sellerPhone','sellerWhatsapp','sellerAddress',
    'providerEmail','providerPhone','providerWhatsapp','providerAddress',
    'authorEmail','authorPhone','authorWhatsapp','authorAddress',
    'contactEmail','contactPhone','contactWhatsapp',
    'gps','coordinates','coords','latitude','longitude','lat','lng','exactLocation','exactAddress','fullAddress',
    'nationalId','cni','passport','idNumber','iban','rib','bankAccount',
    'birthDate','dateOfBirth','emergencyContact'
  ];
$$;

REVOKE ALL ON FUNCTION public.strip_contact_keys(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.strip_contact_keys(jsonb) TO anon, authenticated, service_role;

DROP TRIGGER IF EXISTS strip_contact_public_profiles ON public.public_profiles;
CREATE TRIGGER strip_contact_public_profiles
BEFORE INSERT OR UPDATE ON public.public_profiles
FOR EACH ROW EXECUTE FUNCTION public.strip_contact_fields();

UPDATE public.products SET data = public.strip_contact_keys(data) WHERE data <> public.strip_contact_keys(data);
UPDATE public.services SET data = public.strip_contact_keys(data) WHERE data <> public.strip_contact_keys(data);
UPDATE public.posts SET data = public.strip_contact_keys(data) WHERE data <> public.strip_contact_keys(data);
UPDATE public.public_profiles SET data = public.strip_contact_keys(data) WHERE data <> public.strip_contact_keys(data);