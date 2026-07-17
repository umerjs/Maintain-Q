-- Fix broken RLS policies after the helplytics rebrand migration
-- The rebrand renamed issues → help_requests and dropped assigned_to,
-- but the UPDATE policy still referenced the old column.

-- ── Fix help_requests UPDATE policy ──
DROP POLICY IF EXISTS "admin or assignee update issues" ON public.help_requests;

-- Admin can update any request; reporter can update their own request
CREATE POLICY "update help requests" ON public.help_requests
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Admin')
    OR reporter_id = auth.uid()
  );

-- ── Fix help_requests DELETE policy (renamed table) ──
DROP POLICY IF EXISTS "admin delete issues" ON public.help_requests;
CREATE POLICY "admin delete help requests" ON public.help_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'Admin'));

-- ── Fix help_requests INSERT policy ──
-- Old policy allowed anon inserts; new one requires authentication
-- and enforces reporter_id = auth.uid()
DROP POLICY IF EXISTS "anyone can report" ON public.help_requests;
CREATE POLICY "authenticated create help requests" ON public.help_requests
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- ── Widen profiles SELECT for leaderboard, messages, request detail ──
-- Currently only "own profile read" exists — but leaderboard, messages,
-- and request detail pages need to read other users' profiles.
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "authenticated read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- ── Fix help_request_activity INSERT policy ──
DROP POLICY IF EXISTS "anyone log activity" ON public.help_request_activity;
CREATE POLICY "auth insert activity" ON public.help_request_activity
  FOR INSERT TO authenticated WITH CHECK (true);
