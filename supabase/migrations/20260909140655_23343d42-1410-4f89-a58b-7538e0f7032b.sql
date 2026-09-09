DELETE FROM public.products WHERE data->>'title' LIKE 'Tomates test %';
DELETE FROM public.conversations c WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.data->>'email' LIKE '%@agriconnect-test.mr' AND jsonb_exists(c.data->'participantIds', u.id));
DELETE FROM public.users WHERE data->>'email' LIKE '%@agriconnect-test.mr';