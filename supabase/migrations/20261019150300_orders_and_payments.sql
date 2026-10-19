-- Modern Home phase 2, migration 4 of 5.
-- Orders, price snapshots, status history, and payments.
-- Customers can read their own records. Money, ownership, stock sales, and
-- payment decisions are written only by the functions in the next migration.

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  address_id uuid REFERENCES public.addresses (id) ON DELETE SET NULL,
  reference text NOT NULL,
  idempotency_key uuid NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method NOT NULL,
  currency char(3) NOT NULL DEFAULT 'EGP',
  subtotal_egp numeric(12, 2) NOT NULL,
  shipping_egp numeric(12, 2) NOT NULL DEFAULT 0,
  total_egp numeric(12, 2) NOT NULL,
  customer_note text NOT NULL DEFAULT '',
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  delivery_governorate text NOT NULL,
  delivery_city text NOT NULL,
  delivery_area text NOT NULL DEFAULT '',
  delivery_street text NOT NULL,
  delivery_building text NOT NULL DEFAULT '',
  delivery_floor text NOT NULL DEFAULT '',
  delivery_apartment text NOT NULL DEFAULT '',
  delivery_landmark text NOT NULL DEFAULT '',
  delivery_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_reference_unique UNIQUE (reference),
  CONSTRAINT orders_user_idempotency_unique UNIQUE (user_id, idempotency_key),
  CONSTRAINT orders_reference_format CHECK (reference ~ '^MH-[0-9]{6}-[A-Z2-9]{4}$'),
  CONSTRAINT orders_currency_egp CHECK (currency = 'EGP'),
  CONSTRAINT orders_subtotal_nonnegative CHECK (subtotal_egp >= 0),
  CONSTRAINT orders_shipping_nonnegative CHECK (shipping_egp >= 0),
  CONSTRAINT orders_total_matches CHECK (total_egp = subtotal_egp + shipping_egp),
  CONSTRAINT orders_note_len CHECK (char_length(customer_note) <= 500),
  CONSTRAINT orders_recipient_len CHECK (char_length(recipient_name) BETWEEN 1 AND 120),
  CONSTRAINT orders_phone_format CHECK (
    regexp_replace(recipient_phone, '[[:space:]-]', '', 'g') ~ '^(?:\+?20|0)?1[0125][0-9]{8}$'
  )
);

COMMENT ON TABLE public.orders IS
  'Customer orders. Totals and delivery details are server snapshots. Shipping is 0 until a later server-side fee exists.';

CREATE INDEX orders_user_created_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX orders_status_created_idx ON public.orders (status, created_at DESC);

CREATE FUNCTION public.protect_orders()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
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

CREATE TRIGGER orders_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_orders();

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  variant_id uuid NOT NULL REFERENCES public.product_variants (id) ON DELETE RESTRICT,
  product_slug text NOT NULL,
  product_name_ar text NOT NULL,
  product_name_en text NOT NULL,
  color text NOT NULL,
  size text NOT NULL,
  sku text,
  unit_price_egp numeric(12, 2) NOT NULL,
  quantity integer NOT NULL,
  line_total_egp numeric(12, 2) NOT NULL,
  currency char(3) NOT NULL DEFAULT 'EGP',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_unique_variant UNIQUE (order_id, variant_id),
  CONSTRAINT order_items_quantity CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT order_items_color_len CHECK (char_length(color) BETWEEN 1 AND 40),
  CONSTRAINT order_items_size_len CHECK (char_length(size) BETWEEN 1 AND 40),
  CONSTRAINT order_items_sku_len CHECK (
    sku IS NULL OR char_length(sku) BETWEEN 1 AND 64
  ),
  CONSTRAINT order_items_unit_price_nonnegative CHECK (unit_price_egp >= 0),
  CONSTRAINT order_items_currency_egp CHECK (currency = 'EGP'),
  CONSTRAINT order_items_line_total CHECK (
    line_total_egp = round(unit_price_egp * quantity, 2)
  )
);

COMMENT ON COLUMN public.order_items.unit_price_egp IS
  'Price copied at checkout from the variant override, or from products.price_egp. Later catalog edits do not change it.';
COMMENT ON COLUMN public.order_items.color IS
  'Color copied from the variant at checkout.';
COMMENT ON COLUMN public.order_items.size IS
  'Size copied from the variant at checkout.';
COMMENT ON COLUMN public.order_items.sku IS
  'SKU copied from the variant at checkout. Null when the variant has no SKU.';

CREATE INDEX order_items_order_idx ON public.order_items (order_id);

CREATE FUNCTION public.protect_order_items()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
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

CREATE TRIGGER order_items_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_order_items();

CREATE TABLE public.order_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  from_status public.order_status,
  to_status public.order_status NOT NULL,
  customer_message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_status_events_message_len CHECK (char_length(customer_message) <= 300)
);

COMMENT ON TABLE public.order_status_events IS
  'Customer-visible tracking events. Internal notes live in order_audit_log.';

CREATE INDEX order_status_events_order_idx
  ON public.order_status_events (order_id, created_at);

CREATE TABLE public.order_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  from_status public.order_status,
  to_status public.order_status NOT NULL,
  internal_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_audit_note_len CHECK (char_length(internal_note) <= 500)
);

COMMENT ON TABLE public.order_audit_log IS
  'Admin-only history of who changed an order status.';

CREATE INDEX order_audit_log_order_idx
  ON public.order_audit_log (order_id, created_at);

CREATE FUNCTION public.protect_order_status_events()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
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

CREATE FUNCTION public.protect_order_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'INSERT'
    OR pg_catalog.current_setting('app.order_status', true) IS DISTINCT FROM 'on'
    OR NEW.actor_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'ORDER_AUDIT_LOCKED' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER order_status_events_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.order_status_events
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_order_status_events();

CREATE TRIGGER order_audit_log_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.order_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_order_audit_log();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  method public.payment_method NOT NULL,
  status public.payment_status NOT NULL,
  amount_egp numeric(12, 2) NOT NULL,
  currency char(3) NOT NULL DEFAULT 'EGP',
  sender_phone text,
  transfer_reference text,
  customer_message text NOT NULL DEFAULT '',
  proof_submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_one_per_order UNIQUE (order_id),
  CONSTRAINT payments_currency_egp CHECK (currency = 'EGP'),
  CONSTRAINT payments_amount_nonnegative CHECK (amount_egp >= 0),
  CONSTRAINT payments_sender_phone CHECK (
    sender_phone IS NULL
    OR regexp_replace(sender_phone, '[[:space:]-]', '', 'g') ~ '^(?:\+?20|0)?1[0125][0-9]{8}$'
  ),
  CONSTRAINT payments_reference_len CHECK (
    transfer_reference IS NULL
    OR char_length(btrim(transfer_reference)) BETWEEN 4 AND 80
  ),
  CONSTRAINT payments_cod_has_no_transfer_proof CHECK (
    method = 'vodafone_cash'
    OR (
      sender_phone IS NULL
      AND transfer_reference IS NULL
      AND proof_submitted_at IS NULL
    )
  ),
  CONSTRAINT payments_customer_message_len CHECK (char_length(customer_message) <= 300)
);

COMMENT ON TABLE public.payments IS
  'One payment per order. Vodafone Cash stays unverified until an admin reviews it. Customers cannot mark a payment paid.';

CREATE INDEX payments_awaiting_verification_idx
  ON public.payments (created_at)
  WHERE status = 'awaiting_verification';

CREATE UNIQUE INDEX payments_active_transfer_reference_unique
  ON public.payments (lower(transfer_reference))
  WHERE transfer_reference IS NOT NULL
    AND status IN ('awaiting_verification', 'paid');

CREATE FUNCTION public.protect_payments()
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

CREATE TRIGGER payments_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_payments();

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  from_status public.payment_status NOT NULL,
  to_status public.payment_status NOT NULL,
  internal_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_audit_note_len CHECK (char_length(internal_note) <= 500)
);

COMMENT ON TABLE public.payment_audit IS
  'Admin-only record of payment verification and rejection.';

CREATE INDEX payment_audit_payment_idx
  ON public.payment_audit (payment_id, created_at);

CREATE FUNCTION public.protect_payment_audit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
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

CREATE TRIGGER payment_audit_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.payment_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_payment_audit();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit FORCE ROW LEVEL SECURITY;

CREATE POLICY orders_select
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY order_items_select
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders AS customer_order
      WHERE customer_order.id = order_id
        AND (
          customer_order.user_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY order_status_events_select
  ON public.order_status_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders AS customer_order
      WHERE customer_order.id = order_id
        AND (
          customer_order.user_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY order_audit_log_select
  ON public.order_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY payments_select
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders AS customer_order
      WHERE customer_order.id = order_id
        AND (
          customer_order.user_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY payment_audit_select
  ON public.payment_audit
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON FUNCTION public.protect_orders() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_order_items() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_order_status_events() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_order_audit_log() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_payments() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_payment_audit() FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON TABLE public.orders FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.order_items FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.order_status_events FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.order_audit_log FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.payments FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.payment_audit FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE public.orders TO authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;
GRANT SELECT ON TABLE public.order_status_events TO authenticated;
GRANT SELECT ON TABLE public.order_audit_log TO authenticated;
GRANT SELECT ON TABLE public.payments TO authenticated;
GRANT SELECT ON TABLE public.payment_audit TO authenticated;
