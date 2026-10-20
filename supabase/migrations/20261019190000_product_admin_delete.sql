-- Admins can delete a product. Variants block product deletion, so they
-- need their own delete permission and are removed first.
-- Order lines and cart lines still reference variants with ON DELETE RESTRICT.

GRANT DELETE ON TABLE public.products TO authenticated;
GRANT DELETE ON TABLE public.product_variants TO authenticated;

DROP POLICY IF EXISTS products_admin_delete ON public.products;
CREATE POLICY products_admin_delete
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS product_variants_admin_delete ON public.product_variants;
CREATE POLICY product_variants_admin_delete
  ON public.product_variants
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
