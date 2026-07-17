-- Helplytics AI rebrand: rename entities, add community fields, new tables
-- Do not edit prior migrations; this builds on them.

-- ── Roles: add Student, keep Technician & Admin; migrate Reporter → Student ──
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'Student';

-- After enum value exists, migrate Reporter → Student where applicable
DO $$
BEGIN
  UPDATE public.user_roles SET role = 'Student' WHERE role::text = 'Reporter';
EXCEPTION WHEN OTHERS THEN
  NULL; -- Reporter may already be gone in some environments
END $$;

-- Update signup trigger: role from metadata (Student|Technician), never Admin via signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  chosen_role text := COALESCE(NEW.raw_user_meta_data->>'role', 'Student');
  mapped_role public.app_role;
BEGIN
  IF chosen_role = 'Technician' THEN
    mapped_role := 'Technician';
  ELSE
    mapped_role := 'Student';
  END IF;

  INSERT INTO public.profiles (id, name, email, org_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'org_name', 'Helplytics AI Community')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, mapped_role);
  RETURN NEW;
END;
$$;

-- ── Profiles: community fields ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS trust_score int NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contributions_count int NOT NULL DEFAULT 0;

UPDATE public.profiles SET org_name = 'Helplytics AI Community' WHERE org_name = 'MaintainIQ Org';

-- ── Rename technicians → helpers ──
ALTER TABLE public.technicians RENAME TO helpers;
ALTER TABLE public.helpers RENAME COLUMN specialization TO skills_legacy;
ALTER TABLE public.helpers
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS trust_score int NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contributions_count int NOT NULL DEFAULT 0;

UPDATE public.helpers
SET skills = string_to_array(replace(skills_legacy, ' + ', ','), ',')
WHERE skills = '{}' AND skills_legacy IS NOT NULL;

ALTER TABLE public.helpers DROP COLUMN IF EXISTS skills_legacy;

-- ── Rename issues → help_requests ──
ALTER TABLE public.issues RENAME TO help_requests;
ALTER TABLE public.help_requests RENAME COLUMN priority TO urgency;

-- Drop asset FK and add category / tags / location / skills on the request itself
ALTER TABLE public.help_requests DROP CONSTRAINT IF EXISTS issues_asset_id_fkey;
ALTER TABLE public.help_requests ALTER COLUMN asset_id DROP NOT NULL;
ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills_needed text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Migrate category from assets where possible
UPDATE public.help_requests hr
SET category = COALESCE(a.category, 'Other'),
    location = COALESCE(a.location, '')
FROM public.assets a
WHERE hr.asset_id = a.id AND (hr.category = 'Other' OR hr.category IS NULL);

-- Drop single-assignee FK; many helpers via join table
ALTER TABLE public.help_requests DROP CONSTRAINT IF EXISTS issues_assigned_to_fkey;
ALTER TABLE public.help_requests DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE public.help_requests DROP COLUMN IF EXISTS asset_id;

-- Status: map Resolved → Solved conceptually via check; keep enum compatible
-- Add Solved label by remapping display in app; DB keeps Resolved for compatibility
-- Also allow 'Solved' as text status via new enum value if possible
DO $$
BEGIN
  ALTER TYPE public.issue_status ADD VALUE IF NOT EXISTS 'Solved';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.help_requests SET status = 'Solved' WHERE status::text = 'Resolved';

-- Rename activity table
ALTER TABLE public.issue_activity RENAME TO help_request_activity;
ALTER TABLE public.help_request_activity RENAME COLUMN issue_id TO request_id;

-- Rename code sequence helper
CREATE OR REPLACE FUNCTION public.set_help_request_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'HR-' || lpad(nextval('public.issue_code_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS issues_set_code ON public.help_requests;
CREATE TRIGGER help_requests_set_code BEFORE INSERT ON public.help_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_help_request_code();

-- ── Join table: many helpers per request ──
CREATE TABLE IF NOT EXISTS public.help_request_helpers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES public.helpers(id) ON DELETE CASCADE,
  offered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, helper_id)
);
GRANT SELECT, INSERT, DELETE ON public.help_request_helpers TO authenticated;
GRANT ALL ON public.help_request_helpers TO service_role;
ALTER TABLE public.help_request_helpers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read request helpers" ON public.help_request_helpers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth offer help" ON public.help_request_helpers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth withdraw help" ON public.help_request_helpers
  FOR DELETE TO authenticated USING (true);

-- ── Messages ──
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "auth send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

-- ── Notifications ──
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_match', 'status_change', 'new_message', 'badge_earned')),
  text TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  request_id UUID REFERENCES public.help_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "system insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Categories for help topics
DELETE FROM public.categories;
INSERT INTO public.categories(name) VALUES
  ('Coding'),('Math'),('Design'),('Writing'),('Career'),('Other');

-- Refresh helper seed data
UPDATE public.helpers SET
  name = CASE code
    WHEN 'TECH-001' THEN 'Aisha Rahman'
    WHEN 'TECH-002' THEN 'Marcus Chen'
    ELSE name END,
  email = CASE code
    WHEN 'TECH-001' THEN 'aisha@helplytics.ai'
    WHEN 'TECH-002' THEN 'marcus@helplytics.ai'
    ELSE email END,
  skills = CASE code
    WHEN 'TECH-001' THEN ARRAY['Coding','React','TypeScript']
    WHEN 'TECH-002' THEN ARRAY['Math','Calculus','Statistics']
    ELSE skills END,
  location = CASE code
    WHEN 'TECH-001' THEN 'Campus Library'
    WHEN 'TECH-002' THEN 'Science Building'
    ELSE location END,
  trust_score = CASE code WHEN 'TECH-001' THEN 75 WHEN 'TECH-002' THEN 70 ELSE trust_score END;

INSERT INTO public.helpers(code, name, email, skills, location, trust_score, badges, contributions_count)
VALUES
  ('HELP-003','Priya Patel','priya@helplytics.ai',ARRAY['Design','Figma','UI/UX'],'Art Studio',80,ARRAY['First Helper','5 Solved','Community Star'],12),
  ('HELP-004','Jordan Lee','jordan@helplytics.ai',ARRAY['Career','Resume','Interview Prep'],'Career Center',65,ARRAY['First Helper'],3)
ON CONFLICT (code) DO NOTHING;

-- Note: Admin account (hammad@code.dev / Admin_09123) must be created via
-- Supabase Auth (Dashboard or Auth Admin API), then:
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'Admin' FROM auth.users WHERE email = 'hammad@code.dev'
--   ON CONFLICT DO NOTHING;
-- The app also supports a local demo fallback for that email when Auth is unavailable.
