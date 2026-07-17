
-- Tighten anon INSERTs
DROP POLICY "anyone can report" ON public.issues;
CREATE POLICY "anyone can report" ON public.issues FOR INSERT
  WITH CHECK (asset_id IS NOT NULL AND title IS NOT NULL AND description IS NOT NULL);

DROP POLICY "anyone log activity" ON public.issue_activity;
CREATE POLICY "anyone log activity" ON public.issue_activity FOR INSERT
  WITH CHECK (issue_id IS NOT NULL AND who IS NOT NULL AND action IS NOT NULL);

-- Restrict issue updates to Admin or assigned technician (matched by email on profile)
DROP POLICY "auth update issues" ON public.issues;
CREATE POLICY "admin or assignee update issues" ON public.issues FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Admin')
    OR (assigned_to IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.technicians t
      JOIN public.profiles p ON p.email = t.email
      WHERE t.id = issues.assigned_to AND p.id = auth.uid()
    ))
  );

-- Lock down SECURITY DEFINER trigger helpers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_issue_code() FROM PUBLIC, anon, authenticated;
