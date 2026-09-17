-- Fonction sécurisée pour incrémenter le compteur de vues d'un contenu public
CREATE OR REPLACE FUNCTION public.increment_content_view(_table text, _id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _table NOT IN ('posts', 'products', 'services') THEN
    RAISE EXCEPTION 'Table non autorisée';
  END IF;

  IF _table = 'posts' THEN
    UPDATE public.posts
      SET data = jsonb_set(data, '{viewsCount}', to_jsonb(COALESCE((data->>'viewsCount')::int, 0) + 1), true)
      WHERE id = _id;
  ELSIF _table = 'products' THEN
    UPDATE public.products
      SET data = jsonb_set(data, '{viewsCount}', to_jsonb(COALESCE((data->>'viewsCount')::int, 0) + 1), true)
      WHERE id = _id;
  ELSE
    UPDATE public.services
      SET data = jsonb_set(data, '{viewsCount}', to_jsonb(COALESCE((data->>'viewsCount')::int, 0) + 1), true)
      WHERE id = _id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_content_view(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_content_view(text, text) TO anon, authenticated, service_role;
