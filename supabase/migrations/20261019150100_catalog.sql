-- Modern Home phase 2, migration 2 of 5.
-- Categories, products, images, specifications, and variants.
-- Prices are Egyptian pounds. Inventory lives on variants and cannot go below
-- zero. New products and variants stay hidden until an admin activates them.
-- Anonymous shoppers can read only visible products and active variants.

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_slug_unique UNIQUE (slug),
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT categories_name_ar_len CHECK (char_length(name_ar) BETWEEN 1 AND 120),
  CONSTRAINT categories_name_en_len CHECK (char_length(name_en) BETWEEN 1 AND 120),
  CONSTRAINT categories_description_len CHECK (
    char_length(description_ar) <= 500
    AND char_length(description_en) <= 500
  ),
  CONSTRAINT categories_image_len CHECK (
    image_url IS NULL OR char_length(image_url) BETWEEN 1 AND 2000
  ),
  CONSTRAINT categories_sort_nonnegative CHECK (sort_order >= 0)
);

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  slug text NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  price_egp numeric(12, 2) NOT NULL,
  compare_at_price_egp numeric(12, 2),
  currency char(3) NOT NULL DEFAULT 'EGP',
  is_visible boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_best_seller boolean NOT NULL DEFAULT false,
  rating numeric(2, 1),
  reviews_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_slug_unique UNIQUE (slug),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT products_name_ar_len CHECK (char_length(name_ar) BETWEEN 1 AND 160),
  CONSTRAINT products_name_en_len CHECK (char_length(name_en) BETWEEN 1 AND 160),
  CONSTRAINT products_description_len CHECK (
    char_length(description_ar) <= 2000
    AND char_length(description_en) <= 2000
  ),
  CONSTRAINT products_price_nonnegative CHECK (price_egp >= 0),
  CONSTRAINT products_compare_at_price CHECK (
    compare_at_price_egp IS NULL OR compare_at_price_egp > price_egp
  ),
  CONSTRAINT products_currency_egp CHECK (currency = 'EGP'),
  CONSTRAINT products_rating_range CHECK (
    rating IS NULL OR (rating >= 0 AND rating <= 5)
  ),
  CONSTRAINT products_reviews_nonnegative CHECK (reviews_count >= 0)
);

COMMENT ON COLUMN public.products.price_egp IS
  'Default selling price in Egyptian pounds. A variant may override it.';
COMMENT ON COLUMN public.products.is_visible IS
  'Storefront visibility. Hidden products are admin-only. Stock lives on variants.';

CREATE INDEX products_visible_category_idx
  ON public.products (category_id)
  WHERE is_visible;

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_ar text NOT NULL DEFAULT '',
  alt_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_images_url_len CHECK (char_length(image_url) BETWEEN 1 AND 2000),
  CONSTRAINT product_images_alt_len CHECK (
    char_length(alt_ar) <= 160
    AND char_length(alt_en) <= 160
  ),
  CONSTRAINT product_images_sort_nonnegative CHECK (sort_order >= 0)
);

CREATE UNIQUE INDEX product_images_one_primary
  ON public.product_images (product_id)
  WHERE is_primary;

CREATE TABLE public.product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  value_ar text NOT NULL,
  value_en text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT product_specifications_label_len CHECK (
    char_length(label_ar) BETWEEN 1 AND 80
    AND char_length(label_en) BETWEEN 1 AND 80
  ),
  CONSTRAINT product_specifications_value_len CHECK (
    char_length(value_ar) BETWEEN 1 AND 200
    AND char_length(value_en) BETWEEN 1 AND 200
  ),
  CONSTRAINT product_specifications_sort_nonnegative CHECK (sort_order >= 0)
);

COMMENT ON TABLE public.product_specifications IS
  'Bilingual product specs. The storefront material filter reads label_en = Material.';

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  color text NOT NULL,
  size text NOT NULL,
  sku text,
  price_egp numeric(12, 2),
  stock_quantity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_color_len CHECK (char_length(color) BETWEEN 1 AND 40),
  CONSTRAINT product_variants_size_len CHECK (char_length(size) BETWEEN 1 AND 40),
  CONSTRAINT product_variants_sku_len CHECK (
    sku IS NULL OR char_length(sku) BETWEEN 1 AND 64
  ),
  CONSTRAINT product_variants_price_positive CHECK (
    price_egp IS NULL OR price_egp > 0
  ),
  CONSTRAINT product_variants_stock_nonnegative CHECK (stock_quantity >= 0)
);

COMMENT ON TABLE public.product_variants IS
  'One sellable color and size. Stock is independent for each combination.';
COMMENT ON COLUMN public.product_variants.price_egp IS
  'Optional price override in Egyptian pounds. Null uses products.price_egp.';
COMMENT ON COLUMN public.product_variants.stock_quantity IS
  'Units available for this color and size. Checkout decrements this column.';
COMMENT ON COLUMN public.product_variants.is_active IS
  'Inactive variants are hidden and cannot be added to a cart or checked out.';

CREATE UNIQUE INDEX product_variants_combination_unique
  ON public.product_variants (product_id, lower(color), lower(size));

CREATE UNIQUE INDEX product_variants_sku_unique
  ON public.product_variants (lower(sku))
  WHERE sku IS NOT NULL;

CREATE INDEX product_variants_product_idx
  ON public.product_variants (product_id);

CREATE FUNCTION public.normalize_product_variant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.color := pg_catalog.btrim(NEW.color);
  NEW.size := pg_catalog.btrim(NEW.size);
  NEW.sku := NULLIF(pg_catalog.btrim(COALESCE(NEW.sku, '')), '');
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.protect_product_variants()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.product_id IS DISTINCT FROM OLD.product_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'VARIANT_IMMUTABLE_FIELD' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER product_variants_normalize
  BEFORE INSERT OR UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_product_variant();

CREATE TRIGGER product_variants_protect
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_product_variants();

CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images FORCE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants FORCE ROW LEVEL SECURITY;

CREATE POLICY categories_select
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_visible OR public.is_admin());

CREATE POLICY categories_admin_insert
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY categories_admin_update
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY products_select
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    public.is_admin()
    OR (
      is_visible
      AND EXISTS (
        SELECT 1
        FROM public.categories AS category
        WHERE category.id = category_id
          AND category.is_visible
      )
    )
  );

CREATE POLICY products_admin_insert
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY products_admin_update
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY product_images_select
  ON public.product_images
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products AS product
      WHERE product.id = product_id
    )
  );

CREATE POLICY product_images_admin_insert
  ON public.product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY product_images_admin_update
  ON public.product_images
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY product_images_admin_delete
  ON public.product_images
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY product_specifications_select
  ON public.product_specifications
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products AS product
      WHERE product.id = product_id
    )
  );

CREATE POLICY product_specifications_admin_insert
  ON public.product_specifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY product_specifications_admin_update
  ON public.product_specifications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY product_specifications_admin_delete
  ON public.product_specifications
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY product_variants_select
  ON public.product_variants
  FOR SELECT
  TO anon, authenticated
  USING (
    public.is_admin()
    OR (
      is_active
      AND EXISTS (
        SELECT 1
        FROM public.products AS product
        JOIN public.categories AS category ON category.id = product.category_id
        WHERE product.id = product_id
          AND product.is_visible
          AND category.is_visible
      )
    )
  );

CREATE POLICY product_variants_admin_insert
  ON public.product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY product_variants_admin_update
  ON public.product_variants
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON FUNCTION public.normalize_product_variant() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_product_variants() FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON TABLE public.categories FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.products FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.product_images FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.product_specifications FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.product_variants FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE public.categories, public.products TO anon, authenticated;
GRANT SELECT ON TABLE public.product_images, public.product_specifications TO anon, authenticated;
GRANT SELECT ON TABLE public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.categories, public.products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_images TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_specifications TO authenticated;
GRANT INSERT, UPDATE ON TABLE public.product_variants TO authenticated;
