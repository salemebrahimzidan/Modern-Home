-- Modern Home product image storage.
-- Private bucket. Visitors can read an object only when its product and category
-- are visible. Admins can upload and delete. The Storage API also rejects files
-- that are not WebP or are larger than 2 MB. The dashboard converts JPG, PNG,
-- and WebP uploads to WebP before sending them.
-- Apply this file in the Supabase SQL Editor after the five catalog migrations.
-- Do not run it from the storefront.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  false,
  2000000,
  ARRAY['image/webp']::text[]
);

COMMENT ON TABLE public.product_images IS
  'Gallery rows. image_url is either a legacy https URL or a product-images object path: {product_id}/{image_id}.webp.';

CREATE FUNCTION public.enforce_product_image_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_storage_path text := '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$';
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.image_url IS NOT DISTINCT FROM OLD.image_url THEN
    RETURN NEW;
  END IF;

  IF NEW.image_url ~* '^https://' THEN
    RETURN NEW;
  END IF;

  IF NEW.image_url !~* v_storage_path
    OR split_part(NEW.image_url, '/', 1) IS DISTINCT FROM NEW.product_id::text
  THEN
    RAISE EXCEPTION 'IMAGE_PATH_INVALID' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_product_image_location() IS
  'Keeps a new gallery row on a storage path inside its own product folder, or on an existing https URL.';

CREATE TRIGGER product_images_location
  BEFORE INSERT OR UPDATE OF image_url, product_id ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_image_location();

REVOKE ALL ON FUNCTION public.enforce_product_image_location() FROM PUBLIC, anon, authenticated, service_role;

CREATE POLICY product_images_storage_select
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.products AS product
        JOIN public.categories AS category ON category.id = product.category_id
        WHERE product.id::text = (storage.foldername(name))[1]
          AND product.is_visible
          AND category.is_visible
      )
    )
  );

CREATE POLICY product_images_storage_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
    AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$'
    AND EXISTS (
      SELECT 1
      FROM public.products AS product
      WHERE product.id::text = (storage.foldername(name))[1]
    )
    AND (
      metadata->>'mimetype' IS NULL
      OR metadata->>'mimetype' = 'image/webp'
    )
    AND (
      COALESCE(metadata->>'size', metadata->>'contentLength') IS NULL
      OR COALESCE((metadata->>'size')::bigint, (metadata->>'contentLength')::bigint)
        BETWEEN 1 AND 2000000
    )
  );

CREATE POLICY product_images_storage_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );
