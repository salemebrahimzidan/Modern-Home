-- Modern Home phase 2, migration 5 of 5.
-- Checkout prices come from the variant override, or products.price_egp when
-- the variant has no override. Stock is taken from the selected variant.
-- The arguments contain no prices, stock figures, or payment approvals.

CREATE FUNCTION public.generate_order_reference()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  hex text := replace(pg_catalog.gen_random_uuid()::text, '-', '');
  suffix text := '';
  index integer;
BEGIN
  FOR index IN 0..3 LOOP
    suffix := suffix || substr(
      alphabet,
      (pg_catalog.ascii(substr(hex, index + 1, 1)) % char_length(alphabet)) + 1,
      1
    );
  END LOOP;

  RETURN 'MH-'
    || pg_catalog.to_char(pg_catalog.now() AT TIME ZONE 'Africa/Cairo', 'YYMMDD')
    || '-'
    || suffix;
END;
$$;

CREATE FUNCTION public.checkout_order(
  p_address_id uuid,
  p_payment_method public.payment_method,
  p_idempotency_key uuid,
  p_customer_note text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_id uuid;
  v_address public.addresses%ROWTYPE;
  v_cart_id uuid;
  v_order_id uuid;
  v_reference text;
  v_note text := COALESCE(pg_catalog.btrim(p_customer_note), '');
  v_subtotal numeric(12, 2) := 0;
  v_seen integer := 0;
  v_item_count integer := 0;
  v_lines_total numeric(12, 2) := 0;
  v_lines_count integer := 0;
  v_updated integer := 0;
  v_attempt integer := 0;
  v_line public.cart_items%ROWTYPE;
  v_variant public.product_variants%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_price numeric(12, 2);
  v_category_visible boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE = '28000';
  END IF;

  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'IDEMPOTENCY_KEY_REQUIRED' USING ERRCODE = '22023';
  END IF;

  IF p_payment_method IS NULL THEN
    RAISE EXCEPTION 'PAYMENT_METHOD_REQUIRED' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_note) > 500 THEN
    RAISE EXCEPTION 'CUSTOMER_NOTE_TOO_LONG' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(871234, pg_catalog.hashtext(v_user_id::text));

  SELECT id
  INTO v_existing_id
  FROM public.orders
  WHERE user_id = v_user_id
    AND idempotency_key = p_idempotency_key;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  SELECT *
  INTO v_address
  FROM public.addresses
  WHERE id = p_address_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ADDRESS_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  SELECT id
  INTO v_cart_id
  FROM public.carts
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'CART_EMPTY' USING ERRCODE = 'P0002';
  END IF;

  PERFORM 1
  FROM public.cart_items
  WHERE cart_id = v_cart_id
  ORDER BY variant_id
  FOR UPDATE;

  SELECT count(*)
  INTO v_item_count
  FROM public.cart_items
  WHERE cart_id = v_cart_id;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'CART_EMPTY' USING ERRCODE = 'P0002';
  END IF;

  PERFORM 1
  FROM public.product_variants
  WHERE id IN (
    SELECT variant_id
    FROM public.cart_items
    WHERE cart_id = v_cart_id
  )
  ORDER BY id
  FOR UPDATE;

  FOR v_line IN
    SELECT *
    FROM public.cart_items
    WHERE cart_id = v_cart_id
    ORDER BY variant_id
  LOOP
    SELECT *
    INTO v_variant
    FROM public.product_variants
    WHERE id = v_line.variant_id;

    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = v_variant.product_id;

    SELECT is_visible
    INTO v_category_visible
    FROM public.categories
    WHERE id = v_product.category_id;

    v_price := COALESCE(v_variant.price_egp, v_product.price_egp);

    IF NOT FOUND
      OR v_variant.is_active IS NOT TRUE
      OR v_product.is_visible IS NOT TRUE
      OR v_category_visible IS NOT TRUE
      OR v_price IS NULL
      OR v_price <= 0
      OR v_product.currency IS DISTINCT FROM 'EGP'
    THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE' USING ERRCODE = 'P0002';
    END IF;

    IF v_line.quantity > v_variant.stock_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING ERRCODE = 'P0002';
    END IF;

    v_subtotal := v_subtotal + round(v_price * v_line.quantity, 2);
    v_seen := v_seen + 1;
  END LOOP;

  IF v_seen <> v_item_count OR v_subtotal <= 0 THEN
    RAISE EXCEPTION 'CART_INVALID' USING ERRCODE = 'P0002';
  END IF;

  PERFORM pg_catalog.set_config('app.checkout', 'on', true);
  PERFORM pg_catalog.set_config('app.order_status', 'on', true);

  <<insert_order>>
  LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt > 5 THEN
      RAISE EXCEPTION 'ORDER_REFERENCE_EXHAUSTED' USING ERRCODE = 'P0001';
    END IF;

    v_reference := public.generate_order_reference();

    BEGIN
      INSERT INTO public.orders (
        user_id,
        address_id,
        reference,
        idempotency_key,
        status,
        payment_method,
        currency,
        subtotal_egp,
        shipping_egp,
        total_egp,
        customer_note,
        recipient_name,
        recipient_phone,
        delivery_governorate,
        delivery_city,
        delivery_area,
        delivery_street,
        delivery_building,
        delivery_floor,
        delivery_apartment,
        delivery_landmark,
        delivery_notes
      )
      VALUES (
        v_user_id,
        v_address.id,
        v_reference,
        p_idempotency_key,
        'pending',
        p_payment_method,
        'EGP',
        v_subtotal,
        0,
        v_subtotal,
        v_note,
        v_address.recipient_name,
        v_address.phone,
        v_address.governorate,
        v_address.city,
        v_address.area,
        v_address.street,
        v_address.building,
        v_address.floor,
        v_address.apartment,
        v_address.landmark,
        v_address.notes
      )
      RETURNING id INTO v_order_id;

      EXIT insert_order;
    EXCEPTION
      WHEN unique_violation THEN
        SELECT id
        INTO v_existing_id
        FROM public.orders
        WHERE user_id = v_user_id
          AND idempotency_key = p_idempotency_key;

        IF v_existing_id IS NOT NULL THEN
          RETURN v_existing_id;
        END IF;
    END;
  END LOOP insert_order;

  INSERT INTO public.order_items (
    order_id,
    product_id,
    variant_id,
    product_slug,
    product_name_ar,
    product_name_en,
    color,
    size,
    sku,
    unit_price_egp,
    quantity,
    line_total_egp,
    currency
  )
  SELECT
    v_order_id,
    product.id,
    variant.id,
    product.slug,
    product.name_ar,
    product.name_en,
    variant.color,
    variant.size,
    variant.sku,
    COALESCE(variant.price_egp, product.price_egp),
    item.quantity,
    round(COALESCE(variant.price_egp, product.price_egp) * item.quantity, 2),
    'EGP'
  FROM public.cart_items AS item
  JOIN public.product_variants AS variant ON variant.id = item.variant_id
  JOIN public.products AS product ON product.id = variant.product_id
  WHERE item.cart_id = v_cart_id;

  SELECT COALESCE(sum(line_total_egp), 0), count(*)
  INTO v_lines_total, v_lines_count
  FROM public.order_items
  WHERE order_id = v_order_id;

  IF v_lines_count <> v_seen OR v_lines_total IS DISTINCT FROM v_subtotal THEN
    RAISE EXCEPTION 'ORDER_TOTAL_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.product_variants AS variant
  SET stock_quantity = variant.stock_quantity - item.quantity
  FROM public.cart_items AS item
  WHERE item.cart_id = v_cart_id
    AND variant.id = item.variant_id
    AND variant.stock_quantity >= item.quantity;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> v_seen THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.payments (order_id, method, status, amount_egp, currency)
  VALUES (
    v_order_id,
    p_payment_method,
    CASE p_payment_method
      WHEN 'vodafone_cash' THEN 'awaiting_verification'::public.payment_status
      ELSE 'pending'::public.payment_status
    END,
    v_subtotal,
    'EGP'
  );

  INSERT INTO public.order_status_events (order_id, from_status, to_status, customer_message)
  VALUES (v_order_id, NULL, 'pending', '');

  INSERT INTO public.order_audit_log (order_id, actor_id, from_status, to_status, internal_note)
  VALUES (v_order_id, v_user_id, NULL, 'pending', '');

  DELETE FROM public.cart_items
  WHERE cart_id = v_cart_id;

  RETURN v_order_id;
END;
$$;

COMMENT ON FUNCTION public.checkout_order(uuid, public.payment_method, uuid, text) IS
  'Places one order from the signed-in customer cart. Stock is deducted from each selected variant. Reusing an idempotency key returns the original order and does not sell the stock again.';

CREATE FUNCTION public.submit_vodafone_cash_proof(
  p_order_id uuid,
  p_sender_phone text,
  p_transfer_reference text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_phone text := regexp_replace(COALESCE(p_sender_phone, ''), '[[:space:]-]', '', 'g');
  v_reference text := pg_catalog.btrim(COALESCE(p_transfer_reference, ''));
  v_updated integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE = '28000';
  END IF;

  IF v_phone !~ '^(?:\+?20|0)?1[0125][0-9]{8}$'
    OR char_length(v_reference) NOT BETWEEN 4 AND 80
  THEN
    RAISE EXCEPTION 'PAYMENT_PROOF_INVALID' USING ERRCODE = '22023';
  END IF;

  BEGIN
    UPDATE public.payments AS payment
    SET
      sender_phone = v_phone,
      transfer_reference = v_reference,
      proof_submitted_at = pg_catalog.now()
    FROM public.orders AS customer_order
    WHERE payment.order_id = customer_order.id
      AND customer_order.id = p_order_id
      AND customer_order.user_id = v_user_id
      AND payment.method = 'vodafone_cash'
      AND payment.status = 'awaiting_verification';

    GET DIAGNOSTICS v_updated = ROW_COUNT;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'DUPLICATE_TRANSFER_REFERENCE' USING ERRCODE = '23505';
  END;

  IF v_updated <> 1 THEN
    RAISE EXCEPTION 'PROOF_NOT_ACCEPTED' USING ERRCODE = '42501';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.submit_vodafone_cash_proof(uuid, text, text) IS
  'Stores a Vodafone Cash transfer reference. It cannot mark the payment paid.';

CREATE FUNCTION public.admin_update_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_customer_message text DEFAULT '',
  p_internal_note text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_message text := COALESCE(pg_catalog.btrim(p_customer_message), '');
  v_note text := COALESCE(pg_catalog.btrim(p_internal_note), '');
BEGIN
  IF v_actor IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF char_length(v_message) > 300 OR char_length(v_note) > 500 THEN
    RAISE EXCEPTION 'NOTE_TOO_LONG' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF NOT (
    (v_order.status = 'pending' AND p_status IN ('confirmed', 'cancelled'))
    OR (v_order.status = 'confirmed' AND p_status IN ('preparing', 'cancelled'))
    OR (v_order.status = 'preparing' AND p_status IN ('out_for_delivery', 'cancelled'))
    OR (v_order.status = 'out_for_delivery' AND p_status IN ('delivered', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'INVALID_STATUS_TRANSITION' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.set_config('app.order_status', 'on', true);

  UPDATE public.orders
  SET status = p_status
  WHERE id = v_order.id;

  INSERT INTO public.order_status_events (order_id, from_status, to_status, customer_message)
  VALUES (v_order.id, v_order.status, p_status, v_message);

  INSERT INTO public.order_audit_log (order_id, actor_id, from_status, to_status, internal_note)
  VALUES (v_order.id, v_actor, v_order.status, p_status, v_note);

  IF p_status = 'cancelled' AND v_order.status IN ('pending', 'confirmed', 'preparing') THEN
    PERFORM 1
    FROM public.product_variants
    WHERE id IN (
      SELECT variant_id
      FROM public.order_items
      WHERE order_id = v_order.id
    )
    ORDER BY id
    FOR UPDATE;

    UPDATE public.product_variants AS variant
    SET stock_quantity = variant.stock_quantity + item.quantity
    FROM public.order_items AS item
    WHERE item.order_id = v_order.id
      AND variant.id = item.variant_id;
  END IF;

  IF p_status = 'cancelled' THEN
    SELECT *
    INTO v_payment
    FROM public.payments
    WHERE order_id = v_order.id
    FOR UPDATE;

    IF v_payment.status IN ('pending', 'awaiting_verification') THEN
      PERFORM pg_catalog.set_config('app.payment_review', 'on', true);

      UPDATE public.payments
      SET status = 'cancelled'
      WHERE id = v_payment.id;

      INSERT INTO public.payment_audit (payment_id, actor_id, from_status, to_status, internal_note)
      VALUES (v_payment.id, v_actor, v_payment.status, 'cancelled', v_note);
    END IF;
  END IF;
END;
$$;

CREATE FUNCTION public.admin_review_payment(
  p_order_id uuid,
  p_status public.payment_status,
  p_customer_message text DEFAULT '',
  p_internal_note text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_message text := COALESCE(pg_catalog.btrim(p_customer_message), '');
  v_note text := COALESCE(pg_catalog.btrim(p_internal_note), '');
BEGIN
  IF v_actor IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF char_length(v_message) > 300 OR char_length(v_note) > 500 THEN
    RAISE EXCEPTION 'NOTE_TOO_LONG' USING ERRCODE = '22023';
  END IF;

  IF p_status NOT IN ('paid', 'rejected') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_TRANSITION' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE order_id = v_order.id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status = 'cancelled' AND p_status = 'paid' THEN
    RAISE EXCEPTION 'ORDER_CANCELLED' USING ERRCODE = '22023';
  END IF;

  IF NOT (
    (
      v_payment.method = 'vodafone_cash'
      AND v_payment.status = 'awaiting_verification'
    )
    OR (
      v_payment.method = 'cod'
      AND v_payment.status = 'pending'
    )
  ) THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_TRANSITION' USING ERRCODE = '22023';
  END IF;

  IF v_payment.method = 'vodafone_cash'
    AND p_status = 'paid'
    AND (v_payment.sender_phone IS NULL OR v_payment.transfer_reference IS NULL)
  THEN
    RAISE EXCEPTION 'PAYMENT_PROOF_REQUIRED' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.set_config('app.payment_review', 'on', true);

  UPDATE public.payments
  SET
    status = p_status,
    customer_message = v_message
  WHERE id = v_payment.id;

  INSERT INTO public.payment_audit (payment_id, actor_id, from_status, to_status, internal_note)
  VALUES (v_payment.id, v_actor, v_payment.status, p_status, v_note);
END;
$$;

COMMENT ON FUNCTION public.admin_review_payment(uuid, public.payment_status, text, text) IS
  'Admin confirmation of cash collection or manual Vodafone Cash review.';

REVOKE ALL ON FUNCTION public.generate_order_reference() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.checkout_order(uuid, public.payment_method, uuid, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.submit_vodafone_cash_proof(uuid, text, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_update_order_status(uuid, public.order_status, text, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_review_payment(uuid, public.payment_status, text, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.checkout_order(uuid, public.payment_method, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_vodafone_cash_proof(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, public.order_status, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_payment(uuid, public.payment_status, text, text) TO authenticated;
