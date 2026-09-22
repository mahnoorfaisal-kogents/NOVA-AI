-- Backfill profiles for users that existed before the NOVA signup trigger was installed.
INSERT INTO public.profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), '')
FROM auth.users AS u
LEFT JOIN public.profiles AS p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email
WHERE public.profiles.email IS DISTINCT FROM EXCLUDED.email;
