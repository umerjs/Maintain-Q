-- =============================================================
-- MaintainIQ — Complete Database Setup
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run: uses DROP IF EXISTS + IF NOT EXISTS throughout
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 0. CLEAN SLATE — drop everything in dependency order
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER  IF EXISTS on_ticket_status_change   ON public.tickets;
DROP TRIGGER  IF EXISTS on_ticket_assigned        ON public.tickets;
DROP TRIGGER  IF EXISTS on_ticket_resolved        ON public.tickets;
DROP TRIGGER  IF EXISTS on_asset_updated          ON public.assets;
DROP TRIGGER  IF EXISTS on_auth_user_created      ON auth.users;

DROP FUNCTION IF EXISTS public.notify_on_ticket_status_change();
DROP FUNCTION IF EXISTS public.notify_on_ticket_assigned();
DROP FUNCTION IF EXISTS public.update_asset_status_on_ticket_resolve();
DROP FUNCTION IF EXISTS public.update_asset_timestamp();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role text);

DROP TABLE IF EXISTS public.notifications  CASCADE;
DROP TABLE IF EXISTS public.tickets        CASCADE;
DROP TABLE IF EXISTS public.assets         CASCADE;
DROP TABLE IF EXISTS public.categories     CASCADE;
DROP TABLE IF EXISTS public.user_roles     CASCADE;
DROP TABLE IF EXISTS public.profiles       CASCADE;

-- ──────────────────────────────────────────────────────────────
-- 1. PROFILES
-- Stores role as plain text so we can accept any alias from
-- user_metadata without enum casting headaches.
-- Accepted roles: 'admin', 'administrator' → stored as 'admin'
--                 'technician'             → stored as 'technician'
--                 'student', 'reporter'    → stored as 'student'
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text        NOT NULL DEFAULT '',
  email       text        NOT NULL DEFAULT '',
  role        text        NOT NULL DEFAULT 'student'
                CHECK (role IN ('admin', 'technician', 'student')),
  phone       text,
  department  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL                    ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ──────────────────────────────────────────────────────────────
-- 2. AUTO-CREATE PROFILE ON SIGN-UP
-- Normalises any role alias that arrives in user_metadata.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  raw_role     text;
  mapped_role  text;
  display_name text;
BEGIN
  raw_role     := lower(COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
  display_name := COALESCE(
                    NEW.raw_user_meta_data->>'full_name',
                    split_part(NEW.email, '@', 1)
                  );

  -- Normalise role aliases
  IF raw_role IN ('admin', 'administrator') THEN
    mapped_role := 'admin';
  ELSIF raw_role = 'technician' THEN
    mapped_role := 'technician';
  ELSE
    mapped_role := 'student';   -- covers 'student', 'reporter', anything else
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, display_name, NEW.email, mapped_role)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email     = EXCLUDED.email,
        role      = EXCLUDED.role;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 3. ASSETS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.assets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id  text        UNIQUE NOT NULL,
  name        text        NOT NULL,
  category    text        NOT NULL,
  location    text        NOT NULL,
  status      text        NOT NULL DEFAULT 'working'
                CHECK (status IN ('working', 'under_repair', 'out_of_service')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT SELECT                         ON public.assets TO anon;
GRANT ALL                            ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Anyone can read (QR scan works without login)
CREATE POLICY "assets_public_select" ON public.assets
  FOR SELECT USING (true);

-- Only admins can write
CREATE POLICY "assets_admin_insert" ON public.assets
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "assets_admin_update" ON public.assets
  FOR UPDATE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "assets_admin_delete" ON public.assets
  FOR DELETE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Auto-bump updated_at
CREATE OR REPLACE FUNCTION public.update_asset_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER on_asset_updated
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_asset_timestamp();

-- Seed sample assets
INSERT INTO public.assets (qr_code_id, name, category, location, status, notes) VALUES
  ('ASSET-001', 'Main Elevator',  'Elevator',    'Building A, Lobby', 'working',      'Primary passenger elevator, floors 1-12'),
  ('ASSET-002', 'HVAC Unit 3',    'HVAC',        'Roof, Block B',     'under_repair', 'Rooftop chiller for Block B floors 3-5'),
  ('ASSET-003', 'Lab Freezer #2', 'Laboratory',  'Lab 204',           'working',      '-80°C ultra-low temperature freezer'),
  ('ASSET-004', 'Fire Panel A',   'Fire Safety', 'Ground Floor',      'working',      'Main fire alarm control panel'),
  ('ASSET-005', 'Generator 1',    'Power',       'Basement',          'working',      '150 kW backup diesel generator')
ON CONFLICT (qr_code_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 4. TICKETS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.tickets (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id         uuid        REFERENCES public.assets(id)   ON DELETE SET NULL,
  reported_by      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  title            text        NOT NULL,
  description      text        NOT NULL,
  category         text,
  severity         text        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status           text        NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','assigned','in_progress','resolved','escalated','rejected')),
  photo_before_url text,
  photo_after_url  text,
  resolution_notes text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL                            ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Students: insert own, read own
CREATE POLICY "tickets_student_insert" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "tickets_student_select" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    reported_by = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  );

-- Technicians: read + update assigned tickets
CREATE POLICY "tickets_technician_select" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'technician')
  );

CREATE POLICY "tickets_technician_update" ON public.tickets
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'technician')
  )
  WITH CHECK (
    assigned_to = auth.uid()
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'technician')
  );

-- Admins: full access to everything
CREATE POLICY "tickets_admin_full" ON public.tickets
  FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger: mark asset working when ticket resolves
CREATE OR REPLACE FUNCTION public.update_asset_status_on_ticket_resolve()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status <> 'resolved' AND NEW.asset_id IS NOT NULL THEN
    UPDATE public.assets SET status = 'working', updated_at = now() WHERE id = NEW.asset_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_resolved
  AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_asset_status_on_ticket_resolve();

-- ──────────────────────────────────────────────────────────────
-- 5. NOTIFICATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    text        NOT NULL,
  type       text        NOT NULL
               CHECK (type IN ('ticket_assigned', 'status_changed', 'resolved')),
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL                    ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own_select" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notifications_own_update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger: notify technician when ticket is assigned
CREATE OR REPLACE FUNCTION public.notify_on_ticket_assigned()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL
     AND (OLD.assigned_to IS NULL OR OLD.assigned_to <> NEW.assigned_to) THEN
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (NEW.assigned_to, 'New ticket assigned: ' || NEW.title, 'ticket_assigned');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_assigned
  AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_assigned();

-- Trigger: notify reporter on status change
CREATE OR REPLACE FUNCTION public.notify_on_ticket_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
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
$$;

CREATE TRIGGER on_ticket_status_change
  AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_status_change();

-- ──────────────────────────────────────────────────────────────
-- 6. CATEGORIES  (dropdown options for the report-issue form)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO authenticated, anon;
GRANT ALL    ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_select" ON public.categories
  FOR SELECT USING (true);

INSERT INTO public.categories (name) VALUES
  ('Display'), ('Keyboard'), ('Mouse'), ('Power'),
  ('Network'), ('Software'), ('Hardware'), ('HVAC'),
  ('Electrical'), ('Plumbing'), ('Fire Safety'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 7. DEMO DATA — tickets in various states
-- Inserted after tables exist; FKs resolved via subquery on email.
-- Safe: uses ON CONFLICT DO NOTHING.
-- ──────────────────────────────────────────────────────────────

-- We need the demo user IDs first — resolved inline via subquery.

-- Insert demo tickets (reporter = student demo, assigned = tech demo)
INSERT INTO public.tickets
  (asset_id, reported_by, assigned_to, title, description, category, severity, status, resolution_notes, created_at)
SELECT
  a.id,
  student.id,
  tech.id,
  t.title,
  t.description,
  t.category,
  t.severity::text,
  t.status::text,
  t.resolution_notes,
  now() - t.age
FROM (
  VALUES
    ('ASSET-001', 'Elevator door does not close properly',       'The main elevator door hesitates and sometimes reverses before closing. Affects all users.',       'Hardware',    'high',     'assigned',    NULL,                               INTERVAL '2 days'),
    ('ASSET-002', 'HVAC making loud rattling noise',             'Rooftop HVAC unit started making a loud rattling noise during operation. Noticeable in nearby rooms.','HVAC',       'medium',   'in_progress', 'Identified loose fan bracket. Parts ordered.',  INTERVAL '5 days'),
    ('ASSET-003', 'Lab freezer temperature alarm triggered',     'Freezer alarm went off at 2am. Temperature logged at -60°C instead of -80°C. Samples at risk.', 'Hardware',    'critical', 'resolved',    'Compressor replaced. Temperature stable at -80°C.', INTERVAL '10 days'),
    ('ASSET-004', 'Fire panel showing zone fault',               'Zone 3 fault indicator is lit on fire panel A. Could be a sensor or wiring issue.',                'Fire Safety', 'high',     'open',        NULL,                               INTERVAL '1 day'),
    ('ASSET-005', 'Generator failed to start during drill',      'During yesterday''s power drill the generator did not auto-start within the 10-second window.',    'Power',       'critical', 'escalated',   'Escalated to external service provider.',         INTERVAL '3 days'),
    ('ASSET-001', 'Elevator interior light flickering',          'The ceiling light in the elevator flickers intermittently throughout the day.',                     'Electrical',  'low',      'open',        NULL,                               INTERVAL '6 hours'),
    ('ASSET-002', 'HVAC thermostat unresponsive',                'Block B thermostat does not respond to input. Temperature in affected rooms is not adjustable.',    'HVAC',        'medium',   'assigned',    NULL,                               INTERVAL '4 days'),
    ('ASSET-003', 'Freezer door seal cracked',                   'Visible crack on the door rubber seal. Cold air is leaking. Samples may be compromised.',          'Hardware',    'high',     'in_progress', 'Seal ordered. Interim: door taped shut.',         INTERVAL '7 days')
) AS t(asset_qr, title, description, category, severity, status, resolution_notes, age)
JOIN public.assets a        ON a.qr_code_id = t.asset_qr
JOIN auth.users student     ON student.email = 'student@maintainiq.demo'
JOIN auth.users tech        ON tech.email   = 'tech@maintainiq.demo'
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 8. BACKFILL DEMO USER PROFILES
-- The three demo accounts were created via Auth Admin API before
-- this migration ran, so the trigger never fired for them.
-- We upsert their profiles here using the known auth user IDs.
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, full_name, email, role)
SELECT id, 'Admin User', email, 'admin'
FROM auth.users WHERE email = 'admin@maintainiq.demo'
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Admin User';

INSERT INTO public.profiles (id, full_name, email, role)
SELECT id, 'Tech User', email, 'technician'
FROM auth.users WHERE email = 'tech@maintainiq.demo'
ON CONFLICT (id) DO UPDATE SET role = 'technician', full_name = 'Tech User';

INSERT INTO public.profiles (id, full_name, email, role)
SELECT id, 'Student User', email, 'student'
FROM auth.users WHERE email = 'student@maintainiq.demo'
ON CONFLICT (id) DO UPDATE SET role = 'student', full_name = 'Student User';
