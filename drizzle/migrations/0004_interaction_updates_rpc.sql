-- Permet à un membre connecté de mettre à jour uniquement les champs d'interaction
-- (j'aime, commentaires, partages, republications, vues) d'un contenu qui ne lui appartient pas.
CREATE OR REPLACE FUNCTION public.update_content_interactions(_table text, _id text, _data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_data jsonb;
  keys text[] := ARRAY['likedBy','likesCount','comments','repostedBy','sharesCount','viewsCount'];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  IF _table NOT IN ('posts','products','services') THEN
    RAISE EXCEPTION 'Table non autorisée';
  END IF;

  IF _table = 'posts' THEN
    SELECT data INTO current_data FROM public.posts WHERE id = _id;
  ELSIF _table = 'products' THEN
    SELECT data INTO current_data FROM public.products WHERE id = _id;
  ELSE
    SELECT data INTO current_data FROM public.services WHERE id = _id;
  END IF;

  IF current_data IS NULL THEN
    RAISE EXCEPTION 'Contenu introuvable';
  END IF;

  -- Seuls les champs d'interaction peuvent différer
  IF (current_data - keys) <> (_data - keys) THEN
    RAISE EXCEPTION 'Seules les interactions peuvent être modifiées';
  END IF;

  IF _table = 'posts' THEN
    UPDATE public.posts SET data = _data WHERE id = _id;
  ELSIF _table = 'products' THEN
    UPDATE public.products SET data = _data WHERE id = _id;
  ELSE
    UPDATE public.services SET data = _data WHERE id = _id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_content_interactions(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_content_interactions(text, text, jsonb) TO authenticated, service_role;
