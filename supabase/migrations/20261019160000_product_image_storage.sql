-- Modern Home product image storage.
-- Private bucket "product-images". Storefront visitors can read an object only
-- when that exact path is a gallery row for a visible product in a visible
-- category. Admins can read, upload, and delete every object in the bucket.
-- The Storage API rejects files that are not WebP or are larger than 2 MB.
-- The admin converts JPG, PNG, and WebP to WebP and stores
-- {product_id}/{image_id}.webp.
--
-- Safe to run once in the Supabase SQL Editor. It does not delete storage
-- objects, product rows, or gallery rows. Re-running replaces only these
-- policies and the path check.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  false,
  2000000,
  ARRAY['image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 2000000,
  allowed_mime_types = ARRAY['image/webp']::text[];

COMMENT ON TABLE public.product_images IS
  'Gallery rows. image_url is either a legacy https URL or a product-images object path: {product_id}/{image_id}.webp.';

CREATE OR REPLACE FUNCTION public.enforce_product_image_location()
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

DROP TRIGGER IF EXISTS product_images_location ON public.product_images;
CREATE TRIGGER product_images_location
  BEFORE INSERT OR UPDATE OF image_url, product_id ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_image_location();

REVOKE ALL ON FUNCTION public.enforce_product_image_location() FROM PUBLIC, anon, authenticated, service_role;

DROP POLICY IF EXISTS product_images_storage_select ON storage.objects;
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
        FROM public.product_images AS image
        JOIN public.products AS product ON product.id = image.product_id
        JOIN public.categories AS category ON category.id = product.category_id
        WHERE image.image_url = storage.objects.name
          AND product.is_visible
          AND category.is_visible
      )
    )
  );

DROP POLICY IF EXISTS product_images_storage_insert ON storage.objects;
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

DROP POLICY IF EXISTS product_images_storage_delete ON storage.objects;
CREATE POLICY product_images_storage_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );
