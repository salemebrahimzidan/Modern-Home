-- Order numbers are MH-000001, MH-000002, and so on.
-- Existing orders are renumbered in the order they were placed.
-- Run this once in the Supabase SQL Editor.

BEGIN;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_reference_format;

ALTER TABLE public.orders DISABLE TRIGGER USER;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS n
  FROM public.orders
)
UPDATE public.orders AS orders
SET reference = 'MH-' || lpad(numbered.n::text, 6, '0')
FROM numbered
WHERE orders.id = numbered.id;

ALTER TABLE public.orders ENABLE TRIGGER USER;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_reference_format CHECK (reference ~ '^MH-[0-9]{6}$');

CREATE SEQUENCE IF NOT EXISTS public.order_reference_seq AS bigint;

SELECT pg_catalog.setval(
  'public.order_reference_seq',
  GREATEST(COALESCE((SELECT max(substring(reference FROM 4)::bigint) FROM public.orders), 0), 1),
  EXISTS (SELECT 1 FROM public.orders)
);

REVOKE ALL ON SEQUENCE public.order_reference_seq FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.generate_order_reference()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'MH-' || pg_catalog.lpad(pg_catalog.nextval('public.order_reference_seq')::text, 6, '0');
$$;

REVOKE ALL ON FUNCTION public.generate_order_reference() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
