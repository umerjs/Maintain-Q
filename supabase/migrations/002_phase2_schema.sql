-- Phase 2: Assets, Tickets, and Notifications tables

-- Assets table
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'working' CHECK (status IN ('working', 'under_repair', 'out_of_service')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tickets table
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id),
  reported_by uuid REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  category text,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'escalated', 'rejected')),
  photo_before_url text,
  photo_after_url text,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  message text NOT NULL,
  type text CHECK (type IN ('ticket_assigned', 'status_changed', 'resolved')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ===== ASSETS RLS =====
-- Public SELECT (for QR scan page, no login required)
CREATE POLICY "assets_public_select" ON assets
  FOR SELECT
  USING (true);

-- Only admin can INSERT/UPDATE/DELETE
CREATE POLICY "assets_admin_insert" ON assets
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "assets_admin_update" ON assets
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "assets_admin_delete" ON assets
  FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ===== TICKETS RLS =====
-- Students: INSERT own tickets, SELECT where reported_by = auth.uid()
CREATE POLICY "tickets_student_insert" ON tickets
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'student')
    AND reported_by = auth.uid()
  );

CREATE POLICY "tickets_student_select" ON tickets
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'student')
    AND reported_by = auth.uid()
  );

-- Technicians: SELECT/UPDATE where assigned_to = auth.uid()
CREATE POLICY "tickets_technician_select" ON tickets
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'technician')
    AND assigned_to = auth.uid()
  );

CREATE POLICY "tickets_technician_update" ON tickets
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'technician')
    AND assigned_to = auth.uid()
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'technician')
    AND assigned_to = auth.uid()
  );

-- Admin: full access
CREATE POLICY "tickets_admin_full" ON tickets
  FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ===== NOTIFICATIONS RLS =====
-- Users can SELECT only their own notifications
CREATE POLICY "notifications_user_select" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- System/Admin can INSERT
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- ===== TRIGGERS =====
-- Auto-update asset status when ticket resolves
CREATE OR REPLACE FUNCTION public.update_asset_status_on_ticket_resolve()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    UPDATE assets
    SET status = 'working', updated_at = now()
    WHERE id = NEW.asset_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ticket_resolved
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_asset_status_on_ticket_resolve();

-- Create notification when ticket assigned
CREATE OR REPLACE FUNCTION public.create_notification_on_ticket_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS NULL THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (
      NEW.assigned_to,
      'New ticket assigned: ' || NEW.title,
      'ticket_assigned'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ticket_assigned
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_on_ticket_assigned();

-- Create notification when ticket status changes
CREATE OR REPLACE FUNCTION public.create_notification_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (
      NEW.reported_by,
      'Ticket status updated: ' || NEW.title || ' is now ' || NEW.status,
      'status_changed'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_status_changed
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_on_status_change();

-- Create notification when ticket resolved
CREATE OR REPLACE FUNCTION public.create_notification_on_ticket_resolved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (
      NEW.reported_by,
      'Your ticket has been resolved: ' || NEW.title,
      'resolved'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ticket_resolved_notification
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_on_ticket_resolved();

-- Update asset updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_asset_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_asset_updated
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_asset_timestamp();