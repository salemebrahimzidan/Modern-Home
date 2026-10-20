-- Admins can delete a category. Products reference categories with
-- ON DELETE RESTRICT, so a category that still has products cannot be removed.
-- Apply this file in the Supabase SQL Editor.

GRANT DELETE ON TABLE public.categories TO authenticated;

CREATE POLICY categories_admin_delete
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
