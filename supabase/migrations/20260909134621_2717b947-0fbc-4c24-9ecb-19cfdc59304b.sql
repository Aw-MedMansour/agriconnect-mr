DELETE FROM public.conversations
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements_text(data->'participantIds') p
  WHERE p LIKE 'prod-%' OR p LIKE 'serv-%' OR p LIKE 'post-%'
);