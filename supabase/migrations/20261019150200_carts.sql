-- Modern Home phase 2, migration 3 of 5.
-- One open cart per customer. Each line is one color and size. Carts do not
-- store prices; checkout reads the variant override or the product price.

CREATE TABLE public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT carts_one_per_user UNIQUE (user_id)
);

CREATE FUNCTION public.protect_carts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'CART_IMMUTABLE_FIELD' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER carts_protect
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_carts();

CREATE TRIGGER carts_set_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts (id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants (id) ON DELETE RESTRICT,
  quantity integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_quantity CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT cart_items_unique_variant UNIQUE (cart_id, variant_id)
);

CREATE INDEX cart_items_cart_idx ON public.cart_items (cart_id);

CREATE FUNCTION public.protect_cart_items()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.cart_id IS DISTINCT FROM OLD.cart_id
    OR NEW.variant_id IS DISTINCT FROM OLD.variant_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'CART_ITEM_IMMUTABLE_FIELD' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION public.touch_cart_from_item()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_cart uuid := COALESCE(NEW.cart_id, OLD.cart_id);
BEGIN
  UPDATE public.carts
  SET updated_at = now()
  WHERE id = target_cart;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER cart_items_protect
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_cart_items();

CREATE TRIGGER cart_items_set_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER cart_items_touch_cart
  AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_cart_from_item();

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items FORCE ROW LEVEL SECURITY;

CREATE POLICY carts_select
  ON public.carts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY carts_insert
  ON public.carts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY carts_update
  ON public.carts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY carts_delete
  ON public.carts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY cart_items_select
  ON public.cart_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.carts AS cart
      WHERE cart.id = cart_id
        AND cart.user_id = auth.uid()
    )
  );

CREATE POLICY cart_items_insert
  ON public.cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.carts AS cart
      WHERE cart.id = cart_id
        AND cart.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.product_variants AS variant
      JOIN public.products AS product ON product.id = variant.product_id
      JOIN public.categories AS category ON category.id = product.category_id
      WHERE variant.id = variant_id
        AND variant.is_active
        AND product.is_visible
        AND category.is_visible
    )
  );

CREATE POLICY cart_items_update
  ON public.cart_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.carts AS cart
      WHERE cart.id = cart_id
        AND cart.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.carts AS cart
      WHERE cart.id = cart_id
        AND cart.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.product_variants AS variant
      JOIN public.products AS product ON product.id = variant.product_id
      JOIN public.categories AS category ON category.id = product.category_id
      WHERE variant.id = variant_id
        AND variant.is_active
        AND product.is_visible
        AND category.is_visible
    )
  );

CREATE POLICY cart_items_delete
  ON public.cart_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.carts AS cart
      WHERE cart.id = cart_id
        AND cart.user_id = auth.uid()
    )
  );

REVOKE ALL ON FUNCTION public.protect_carts() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_cart_items() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.touch_cart_from_item() FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON TABLE public.carts FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.cart_items FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cart_items TO authenticated;
