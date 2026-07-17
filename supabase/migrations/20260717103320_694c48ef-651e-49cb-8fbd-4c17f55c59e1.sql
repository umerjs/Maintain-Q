
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  org_name TEXT NOT NULL DEFAULT 'MaintainIQ Org',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Roles
CREATE TYPE public.app_role AS ENUM ('Admin', 'Technician', 'Reporter');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile + Admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, org_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'org_name', 'MaintainIQ Org')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'Admin');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admin manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'Admin')) WITH CHECK (public.has_role(auth.uid(), 'Admin'));

INSERT INTO public.categories(name) VALUES
 ('HVAC'),('Electrical'),('Plumbing'),('Elevator'),('Fire Safety'),
 ('Laboratory'),('Power'),('IT'),('Furniture'),('Vehicle');

-- Technicians
CREATE TABLE public.technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialization TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO authenticated;
GRANT ALL ON public.technicians TO service_role;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read technicians" ON public.technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage technicians" ON public.technicians FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'Admin')) WITH CHECK (public.has_role(auth.uid(), 'Admin'));

INSERT INTO public.technicians(code, name, email, phone, specialization) VALUES
 ('TECH-001','Ravi Mehta','ravi@maintainiq.com','+91 98200 11111','Mechanical + HVAC'),
 ('TECH-002','Sana Khan','sana@maintainiq.com','+91 98200 22222','Electrical + Fire Safety');

-- Assets
CREATE TYPE public.asset_status AS ENUM ('Active','Under Maintenance','Retired');
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  installation_date DATE,
  manufacturer TEXT,
  model_number TEXT,
  status public.asset_status NOT NULL DEFAULT 'Active',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT SELECT ON public.assets TO anon;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "admin manage assets" ON public.assets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'Admin')) WITH CHECK (public.has_role(auth.uid(), 'Admin'));

INSERT INTO public.assets(code,name,category,location,description,installation_date,manufacturer,model_number,status) VALUES
 ('ASSET-001','Main Elevator','Elevator','Building A, Lobby','Primary passenger elevator serving floors 1-12.','2019-03-15','Otis','GEN2-01','Active'),
 ('ASSET-002','HVAC Unit 3','HVAC','Roof, Block B','Rooftop chiller for Block B floors 3-5.','2020-06-10','Carrier','50TC-04','Under Maintenance'),
 ('ASSET-003','Lab Freezer #2','Laboratory','Lab 204','-80°C ultra-low temperature freezer.','2021-01-20','Thermo Fisher','TSX-400','Active'),
 ('ASSET-004','Fire Panel A','Fire Safety','Ground Floor','Main fire alarm control panel.','2018-11-05','Honeywell','NFS2-3030','Active'),
 ('ASSET-005','Generator 1','Power','Basement','150kW backup diesel generator.','2017-09-01','Cummins','C150D6','Active');

-- Issues
CREATE TYPE public.issue_priority AS ENUM ('Low','Medium','High','Critical');
CREATE TYPE public.issue_status AS ENUM ('Open','In Progress','Resolved','Overdue');
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority public.issue_priority NOT NULL DEFAULT 'Medium',
  status public.issue_status NOT NULL DEFAULT 'Open',
  assigned_to UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
  reporter_name TEXT,
  reporter_contact TEXT,
  photo_url TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  internal_notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issues TO authenticated;
GRANT INSERT ON public.issues TO anon;
GRANT ALL ON public.issues TO service_role;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read issues" ON public.issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "anyone can report" ON public.issues FOR INSERT WITH CHECK (true);
CREATE POLICY "auth update issues" ON public.issues FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete issues" ON public.issues FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

-- Issue counter for human-friendly IDs
CREATE SEQUENCE IF NOT EXISTS public.issue_code_seq START 100;
CREATE OR REPLACE FUNCTION public.set_issue_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'IQ-' || lpad(nextval('public.issue_code_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER issues_set_code BEFORE INSERT ON public.issues FOR EACH ROW EXECUTE FUNCTION public.set_issue_code();

-- Activity log
CREATE TABLE public.issue_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  who TEXT NOT NULL,
  action TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.issue_activity TO authenticated;
GRANT INSERT ON public.issue_activity TO anon;
GRANT ALL ON public.issue_activity TO service_role;
ALTER TABLE public.issue_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read activity" ON public.issue_activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "anyone log activity" ON public.issue_activity FOR INSERT WITH CHECK (true);
