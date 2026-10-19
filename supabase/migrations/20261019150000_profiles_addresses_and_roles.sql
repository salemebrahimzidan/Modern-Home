-- Modern Home phase 2, migration 1 of 5.
-- Customer profiles, delivery addresses, and the admin allow-list.
-- Apply supabase/migrations in filename order. This does not seed store data.

CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TYPE public.payment_method AS ENUM ('cod', 'vodafone_cash');

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'awaiting_verification',
  'paid',
  'rejected',
  'cancelled'
);

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

CREATE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_full_name_len CHECK (char_length(full_name) <= 120),
  CONSTRAINT profiles_phone_format CHECK (
    phone = ''
    OR regexp_replace(phone, '[[:space:]-]', '', 'g') ~ '^(?:\+?20|0)?1[0125][0-9]{8}$'
  )
);

COMMENT ON TABLE public.profiles IS
  'One profile per auth user. Roles are not stored here.';

CREATE FUNCTION public.protect_profiles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.id IS DISTINCT FROM OLD.id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'PROFILE_IMMUTABLE_FIELD' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_phone text := regexp_replace(
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    '[[:space:]-]',
    '',
    'g'
  );
  safe_phone text := '';
BEGIN
  -- Signup metadata is not an authorization source. Never copy a role from it.
  IF raw_phone ~ '^(?:\+?20|0)?1[0125][0-9]{8}$' THEN
    safe_phone := left(raw_phone, 20);
  END IF;

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    left(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), 120),
    safe_phone
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  recipient_name text NOT NULL,
  phone text NOT NULL,
  governorate text NOT NULL,
  city text NOT NULL,
  area text NOT NULL DEFAULT '',
  street text NOT NULL,
  building text NOT NULL DEFAULT '',
  floor text NOT NULL DEFAULT '',
  apartment text NOT NULL DEFAULT '',
  landmark text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT addresses_label_len CHECK (char_length(label) <= 40),
  CONSTRAINT addresses_recipient_len CHECK (char_length(recipient_name) BETWEEN 1 AND 120),
  CONSTRAINT addresses_phone_format CHECK (
    regexp_replace(phone, '[[:space:]-]', '', 'g') ~ '^(?:\+?20|0)?1[0125][0-9]{8}$'
  ),
  CONSTRAINT addresses_governorate_len CHECK (char_length(governorate) BETWEEN 1 AND 80),
  CONSTRAINT addresses_city_len CHECK (char_length(city) BETWEEN 1 AND 80),
  CONSTRAINT addresses_area_len CHECK (char_length(area) <= 80),
  CONSTRAINT addresses_street_len CHECK (char_length(street) BETWEEN 1 AND 200),
  CONSTRAINT addresses_building_len CHECK (char_length(building) <= 40),
  CONSTRAINT addresses_floor_len CHECK (char_length(floor) <= 20),
  CONSTRAINT addresses_apartment_len CHECK (char_length(apartment) <= 20),
  CONSTRAINT addresses_landmark_len CHECK (char_length(landmark) <= 160),
  CONSTRAINT addresses_notes_len CHECK (char_length(notes) <= 500)
);

CREATE UNIQUE INDEX addresses_one_default_per_user
  ON public.addresses (user_id)
  WHERE is_default;

CREATE FUNCTION public.protect_addresses()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'ADDRESS_OWNERSHIP_LOCKED' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'ADDRESS_IMMUTABLE_FIELD' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION public.clear_other_default_addresses()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND is_default
      AND id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER addresses_protect
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_addresses();

CREATE TRIGGER addresses_one_default
  BEFORE INSERT OR UPDATE OF is_default ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_other_default_addresses();

CREATE TRIGGER addresses_set_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'admin',
  granted_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_admin_only CHECK (role = 'admin')
);

COMMENT ON TABLE public.user_roles IS
  'Allow-list of admin users. Customers have no row. Direct writes are rejected.';

CREATE FUNCTION public.protect_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF pg_catalog.current_setting('app.role_grant', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'ROLE_ASSIGNMENT_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'ROLE_ASSIGNMENT_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER user_roles_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_roles();

CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'True only when the signed-in user is on the admin allow-list. JWT metadata is ignored.';

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_profiles() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_addresses() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.clear_other_default_addresses() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_user_roles() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

CREATE POLICY profiles_select
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_insert
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY addresses_select
  ON public.addresses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY addresses_insert
  ON public.addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY addresses_update
  ON public.addresses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY addresses_delete
  ON public.addresses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_roles_select
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.addresses FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.addresses TO authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;

-- Auth users created before this migration do not fire the signup trigger.
-- Backfill their profiles without reading any role claim from metadata.
INSERT INTO public.profiles (id, full_name, phone)
SELECT
  account.id,
  left(COALESCE(account.raw_user_meta_data ->> 'full_name', ''), 120),
  CASE
    WHEN regexp_replace(
      COALESCE(account.raw_user_meta_data ->> 'phone', ''),
      '[[:space:]-]',
      '',
      'g'
    ) ~ '^(?:\+?20|0)?1[0125][0-9]{8}$'
    THEN left(
      regexp_replace(
        COALESCE(account.raw_user_meta_data ->> 'phone', ''),
        '[[:space:]-]',
        '',
        'g'
      ),
      20
    )
    ELSE ''
  END
FROM auth.users AS account
ON CONFLICT (id) DO NOTHING;
