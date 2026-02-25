
-- Update handle_new_user to use role_id 2 as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new.id, 2)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- Also update default on the column itself
ALTER TABLE public.user_roles ALTER COLUMN role_id SET DEFAULT 2;
