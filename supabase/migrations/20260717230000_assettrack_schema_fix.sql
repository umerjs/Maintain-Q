-- =============================================================
-- AssetTrack — Full Database Setup
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('Admin', 'Technician', 'Student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────
-- 2. PROFILES TABLE (with role column per PRD)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  name        text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'technician', 'admin')),
  email       text NOT NULL,
  phone       text,
  department  text,
  specialty   text,
  org_name    text NOT NULL DEFAULT 'AssetTrack',
  -- Helplytics community fields (kept for compatibility)
  skills      text[] NOT NULL DEFAULT '{}',
  interests   text[] NOT NULL DEFAULT '{}',
  location    text NOT NULL DEFAULT '',
  trust_score int NOT NULL DEFAULT 50,
  badges      text[] NOT NULL DEFAULT '{}',
  contributions_count int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own_select"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "authenticated read all profiles" ON public.profiles;

CREATE POLICY "profiles_own_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ──────────────────────────────────────────────────────────────
-- 3. USER ROLES TABLE (kept for compatibility with existing app.tsx)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ──────────────────────────────────────────────────────────────
-- 4. AUTO-CREATE PROFILE ON SIGNUP
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  chosen_role text;
  profile_role text;
  app_role_val public.app_role;
  display_name text;
BEGIN
  chosen_role  := lower(COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
  display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  IF chosen_role = 'admin' THEN
    profile_role := 'admin'; app_role_val := 'Admin';
  ELSIF chosen_role = 'technician' THEN
    profile_role := 'technician'; app_role_val := 'Technician';
  ELSE
    profile_role := 'student'; app_role_val := 'Student';
  END IF;

  INSERT INTO public.profiles (id, full_name, name, email, role, org_name)
  VALUES (NEW.id, display_name, display_name, NEW.email, profile_role, 'AssetTrack')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    name      = EXCLUDED.name,
    role      = EXCLUDED.role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, app_role_val)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 5. ASSETS TABLE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id   text UNIQUE NOT NULL,
  name         text NOT NULL,
  category     text NOT NULL,
  location     text NOT NULL,
  status       text NOT NULL DEFAULT 'working'
                 CHECK (status IN ('working', 'under_repair', 'out_of_service')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT SELECT ON public.assets TO anon;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_public_select"  ON public.assets;
DROP POLICY IF EXISTS "assets_admin_insert"   ON public.assets;
DROP POLICY IF EXISTS "assets_admin_update"   ON public.assets;
DROP POLICY IF EXISTS "assets_admin_delete"   ON public.assets;

CREATE POLICY "assets_public_select" ON public.assets FOR SELECT USING (true);
CREATE POLICY "assets_admin_insert" ON public.assets FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "assets_admin_update" ON public.assets FOR UPDATE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "assets_admin_delete" ON public.assets FOR DELETE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_asset_timestamp()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_asset_updated ON public.assets;
CREATE TRIGGER on_asset_updated BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_asset_timestamp();

-- Seed sample assets
INSERT INTO public.assets (qr_code_id, name, category, location, status, notes) VALUES
  ('ASSET-001', 'Main Elevator',   'Elevator',     'Building A, Lobby',  'working',       'Primary passenger elevator, floors 1-12'),
  ('ASSET-002', 'HVAC Unit 3',     'HVAC',         'Roof, Block B',      'under_repair',  'Rooftop chiller for Block B floors 3-5'),
  ('ASSET-003', 'Lab Freezer #2',  'Laboratory',   'Lab 204',            'working',       '-80°C ultra-low temperature freezer'),
  ('ASSET-004', 'Fire Panel A',    'Fire Safety',  'Ground Floor',       'working',       'Main fire alarm control panel'),
  ('ASSET-005', 'Generator 1',     'Power',        'Basement',           'working',       '150kW backup diesel generator')
ON CONFLICT (qr_code_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 6. TICKETS TABLE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  reported_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title             text NOT NULL,
  description       text NOT NULL,
  category          text,
  severity          text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','assigned','in_progress','resolved','escalated','rejected')),
  photo_before_url  text,
  photo_after_url   text,
  resolution_notes  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_student_insert"    ON public.tickets;
DROP POLICY IF EXISTS "tickets_student_select"    ON public.tickets;
DROP POLICY IF EXISTS "tickets_technician_select" ON public.tickets;
DROP POLICY IF EXISTS "tickets_technician_update" ON public.tickets;
DROP POLICY IF EXISTS "tickets_admin_full"        ON public.tickets;

-- Students: insert own + read own
CREATE POLICY "tickets_student_insert" ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  );
CREATE POLICY "tickets_student_select" ON public.tickets FOR SELECT TO authenticated
  USING (
    reported_by = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  );

-- Technicians: read + update assigned tickets
CREATE POLICY "tickets_technician_select" ON public.tickets FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'technician')
  );
CREATE POLICY "tickets_technician_update" ON public.tickets FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'technician')
  )
  WITH CHECK (
    assigned_to = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'technician')
  );

-- Admins: full access
CREATE POLICY "tickets_admin_full" ON public.tickets FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger: mark asset working when ticket resolves
CREATE OR REPLACE FUNCTION public.update_asset_status_on_ticket_resolve()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status <> 'resolved' AND NEW.asset_id IS NOT NULL THEN
    UPDATE public.assets SET status = 'working', updated_at = now() WHERE id = NEW.asset_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_ticket_resolved ON public.tickets;
CREATE TRIGGER on_ticket_resolved AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_asset_status_on_ticket_resolve();

-- ──────────────────────────────────────────────────────────────
-- 7. NOTIFICATIONS TABLE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    text NOT NULL,
  type       text NOT NULL
               CHECK (type IN ('ticket_assigned','status_changed','resolved')),
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert"     ON public.notifications;
DROP POLICY IF EXISTS "notifications_own_update" ON public.notifications;

CREATE POLICY "notifications_own_select" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_own_update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger: notify technician on ticket assignment
CREATE OR REPLACE FUNCTION public.notify_on_ticket_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to <> NEW.assigned_to) THEN
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (NEW.assigned_to, 'New ticket assigned: ' || NEW.title, 'ticket_assigned');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_ticket_assigned ON public.tickets;
CREATE TRIGGER on_ticket_assigned AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_assigned();

-- Trigger: notify reporter on status change
CREATE OR REPLACE FUNCTION public.notify_on_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status AND NEW.reported_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (
      NEW.reported_by,
      'Ticket "' || NEW.title || '" is now: ' || replace(NEW.status, '_', ' '),
      CASE WHEN NEW.status = 'resolved' THEN 'resolved' ELSE 'status_changed' END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_ticket_status_change ON public.tickets;
CREATE TRIGGER on_ticket_status_change AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_status_change();

-- ──────────────────────────────────────────────────────────────
-- 8. CATEGORIES (for help/report form dropdowns)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO authenticated, anon;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read categories" ON public.categories;
CREATE POLICY "read categories" ON public.categories FOR SELECT USING (true);

INSERT INTO public.categories(name) VALUES
  ('Display'),('Keyboard'),('Mouse'),('Power'),('Network'),('Software'),('Hardware'),('Other')
ON CONFLICT (name) DO NOTHING;
