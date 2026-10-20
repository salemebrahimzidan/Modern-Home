-- Admins can delete an order. Child rows stay locked unless this function
-- sets app.order_delete. Stock is returned only while the order still holds it.
-- Apply this file in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.protect_orders()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF pg_catalog.current_setting('app.order_delete', true) = 'on' THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'ORDER_WRITE_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF pg_catalog.current_setting('app.checkout', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'ORDER_WRITE_FORBIDDEN' USING ERRCODE = '42501';
    END IF;

    IF NEW.user_id IS DISTINCT FROM auth.uid()
      OR NEW.status IS DISTINCT FROM 'pending'
      OR NEW.currency IS DISTINCT FROM 'EGP'
      OR NEW.shipping_egp IS DISTINCT FROM 0
      OR NEW.total_egp IS DISTINCT FROM NEW.subtotal_egp
    THEN
      RAISE EXCEPTION 'ORDER_WRITE_FORBIDDEN' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR (
      NEW.address_id IS DISTINCT FROM OLD.address_id
      AND NEW.address_id IS NOT NULL
    )
    OR NEW.reference IS DISTINCT FROM OLD.reference
    OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
    OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
    OR NEW.currency IS DISTINCT FROM OLD.currency
    OR NEW.subtotal_egp IS DISTINCT FROM OLD.subtotal_egp
    OR NEW.shipping_egp IS DISTINCT FROM OLD.shipping_egp
    OR NEW.total_egp IS DISTINCT FROM OLD.total_egp
    OR NEW.customer_note IS DISTINCT FROM OLD.customer_note
    OR NEW.recipient_name IS DISTINCT FROM OLD.recipient_name
    OR NEW.recipient_phone IS DISTINCT FROM OLD.recipient_phone
    OR NEW.delivery_governorate IS DISTINCT FROM OLD.delivery_governorate
    OR NEW.delivery_city IS DISTINCT FROM OLD.delivery_city
    OR NEW.delivery_area IS DISTINCT FROM OLD.delivery_area
    OR NEW.delivery_street IS DISTINCT FROM OLD.delivery_street
    OR NEW.delivery_building IS DISTINCT FROM OLD.delivery_building
    OR NEW.delivery_floor IS DISTINCT FROM OLD.delivery_floor
    OR NEW.delivery_apartment IS DISTINCT FROM OLD.delivery_apartment
    OR NEW.delivery_landmark IS DISTINCT FROM OLD.delivery_landmark
    OR NEW.delivery_notes IS DISTINCT FROM OLD.delivery_notes
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'ORDER_IMMUTABLE_FIELD' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
    AND pg_catalog.current_setting('app.order_status', true) IS DISTINCT FROM 'on'
  THEN
    RAISE EXCEPTION 'ORDER_STATUS_LOCKED' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_order_items()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_catalog.current_setting('app.order_delete', true) = 'on' THEN
    RETURN OLD;
  END IF;

  IF TG_OP <> 'INSERT'
    OR pg_catalog.current_setting('app.checkout', true) IS DISTINCT FROM 'on'
  THEN
    RAISE EXCEPTION 'ORDER_ITEM_LOCKED' USING ERRCODE = '42501';
  END IF;

  IF NEW.currency IS DISTINCT FROM 'EGP'
    OR NOT EXISTS (
      SELECT 1
      FROM public.orders
      WHERE id = NEW.order_id
        AND user_id = auth.uid()
    )
    OR NOT EXISTS (
      SELECT 1
      FROM public.product_variants AS variant
      JOIN public.products AS product ON product.id = variant.product_id
      JOIN public.categories AS category ON category.id = product.category_id
      WHERE variant.id = NEW.variant_id
        AND product.id = NEW.product_id
        AND variant.is_active
        AND product.is_visible
        AND category.is_visible
        AND variant.stock_quantity >= NEW.quantity
        AND variant.color = NEW.color
        AND variant.size = NEW.size
        AND variant.sku IS NOT DISTINCT FROM NEW.sku
        AND COALESCE(variant.price_egp, product.price_egp) = NEW.unit_price_egp
        AND product.slug = NEW.product_slug
        AND product.name_ar = NEW.product_name_ar
        AND product.name_en = NEW.product_name_en
        AND product.currency = 'EGP'
    )
  THEN
    RAISE EXCEPTION 'ORDER_ITEM_PRICE_MISMATCH' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_order_status_events()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_catalog.current_setting('app.order_delete', true) = 'on' THEN
    RETURN OLD;
  END IF;

  IF TG_OP <> 'INSERT'
    OR pg_catalog.current_setting('app.order_status', true) IS DISTINCT FROM 'on'
  THEN
    RAISE EXCEPTION 'ORDER_HISTORY_LOCKED' USING ERRCODE = '42501';
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.from_status IS NOT NULL
    OR NEW.to_status IS DISTINCT FROM 'pending'
    OR NEW.customer_message <> ''
    OR NOT EXISTS (
      SELECT 1
      FROM public.orders
      WHERE id = NEW.order_id
        AND user_id = auth.uid()
    )
  THEN
    RAISE EXCEPTION 'ORDER_HISTORY_LOCKED' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_order_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_catalog.current_setting('app.order_delete', true) = 'on' THEN
    RETURN OLD;
  END IF;

  IF TG_OP <> 'INSERT'
    OR pg_catalog.current_setting('app.order_status', true) IS DISTINCT FROM 'on'
    OR NEW.actor_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'ORDER_AUDIT_LOCKED' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_payments()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  order_owner uuid;
  order_total numeric(12, 2);
  order_method public.payment_method;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF pg_catalog.current_setting('app.order_delete', true) = 'on' THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'PAYMENT_WRITE_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT user_id, total_egp, payment_method
    INTO order_owner, order_total, order_method
    FROM public.orders
    WHERE id = NEW.order_id;

    IF pg_catalog.current_setting('app.checkout', true) IS DISTINCT FROM 'on'
      OR order_owner IS DISTINCT FROM auth.uid()
      OR order_method IS DISTINCT FROM NEW.method
      OR order_total IS DISTINCT FROM NEW.amount_egp
      OR NEW.currency IS DISTINCT FROM 'EGP'
      OR NEW.customer_message <> ''
      OR NEW.sender_phone IS NOT NULL
      OR NEW.transfer_reference IS NOT NULL
      OR NEW.proof_submitted_at IS NOT NULL
      OR (
        NEW.method = 'cod'
        AND NEW.status IS DISTINCT FROM 'pending'
      )
      OR (
        NEW.method = 'vodafone_cash'
        AND NEW.status IS DISTINCT FROM 'awaiting_verification'
      )
    THEN
      RAISE EXCEPTION 'PAYMENT_WRITE_FORBIDDEN' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.order_id IS DISTINCT FROM OLD.order_id
    OR NEW.method IS DISTINCT FROM OLD.method
    OR NEW.amount_egp IS DISTINCT FROM OLD.amount_egp
    OR NEW.currency IS DISTINCT FROM OLD.currency
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'PAYMENT_IMMUTABLE_FIELD' USING ERRCODE = '42501';
  END IF;

  IF pg_catalog.current_setting('app.payment_review', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.customer_message IS DISTINCT FROM OLD.customer_message
    OR OLD.method IS DISTINCT FROM 'vodafone_cash'
    OR OLD.status IS DISTINCT FROM 'awaiting_verification'
    OR NEW.sender_phone IS NULL
    OR NEW.transfer_reference IS NULL
    OR NEW.proof_submitted_at IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM public.orders
      WHERE id = OLD.order_id
        AND user_id = auth.uid()
    )
  THEN
    RAISE EXCEPTION 'PAYMENT_STATUS_LOCKED' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_payment_audit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_catalog.current_setting('app.order_delete', true) = 'on' THEN
    RETURN OLD;
  END IF;

  IF TG_OP <> 'INSERT'
    OR pg_catalog.current_setting('app.payment_review', true) IS DISTINCT FROM 'on'
    OR NEW.actor_id IS DISTINCT FROM auth.uid()
    OR NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'PAYMENT_AUDIT_LOCKED' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION public.admin_delete_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_status public.order_status;
BEGIN
  IF v_actor IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT status
  INTO v_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_status IN ('pending', 'confirmed', 'preparing') THEN
    PERFORM 1
    FROM public.product_variants
    WHERE id IN (
      SELECT variant_id
      FROM public.order_items
      WHERE order_id = p_order_id
    )
    ORDER BY id
    FOR UPDATE;

    UPDATE public.product_variants AS variant
    SET stock_quantity = variant.stock_quantity + item.quantity
    FROM public.order_items AS item
    WHERE item.order_id = p_order_id
      AND variant.id = item.variant_id;
  END IF;

  PERFORM pg_catalog.set_config('app.order_delete', 'on', true);

  DELETE FROM public.payment_audit
  WHERE payment_id IN (
    SELECT id
    FROM public.payments
    WHERE order_id = p_order_id
  );

  DELETE FROM public.payments
  WHERE order_id = p_order_id;

  DELETE FROM public.order_status_events
  WHERE order_id = p_order_id;

  DELETE FROM public.order_audit_log
  WHERE order_id = p_order_id;

  DELETE FROM public.order_items
  WHERE order_id = p_order_id;

  DELETE FROM public.orders
  WHERE id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.admin_delete_order(uuid) IS
  'Admin removal of one order, its payment, and its history. Restores variant stock while the order is still pending, confirmed, or being prepared.';

REVOKE ALL ON FUNCTION public.admin_delete_order(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_order(uuid) TO authenticated;
