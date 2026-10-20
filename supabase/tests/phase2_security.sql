-- Local security checks for the phase 2 migrations. Not applied to Supabase.

CREATE SCHEMA test;

CREATE FUNCTION test.assert(p_condition boolean, p_message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(p_condition, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'ASSERTION FAILED: %', p_message;
  END IF;
END;
$$;

CREATE FUNCTION test.expect_error(p_sql text, p_fragment text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION
    WHEN OTHERS THEN
      IF position(p_fragment IN SQLERRM) = 0 THEN
        RAISE EXCEPTION 'ASSERTION FAILED: expected "%" but got [%] %',
          p_fragment, SQLSTATE, SQLERRM;
      END IF;
      RETURN;
  END;

  RAISE EXCEPTION 'ASSERTION FAILED: expected error containing "%"', p_fragment;
END;
$$;

GRANT USAGE ON SCHEMA test TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test TO anon, authenticated;

CREATE TABLE test.actors (
  name text PRIMARY KEY,
  id uuid NOT NULL UNIQUE
);

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  (
    gen_random_uuid(),
    'replace_with_admin_email',
    '{"role":"admin","is_admin":true,"full_name":"Store Admin"}'::jsonb
  ),
  (
    gen_random_uuid(),
    'customer.a@example.com',
    '{"full_name":"Customer A","phone":"01000000000"}'::jsonb
  ),
  (
    gen_random_uuid(),
    'customer.b@example.com',
    '{"full_name":"Customer B","phone":"01111111111"}'::jsonb
  ),
  (
    gen_random_uuid(),
    'attacker@example.com',
    '{"role":"admin","is_admin":true,"full_name":"Attacker"}'::jsonb
  );

INSERT INTO test.actors (name, id)
SELECT 'admin', id FROM auth.users WHERE email = 'replace_with_admin_email'
UNION ALL
SELECT 'customer_a', id FROM auth.users WHERE email = 'customer.a@example.com'
UNION ALL
SELECT 'customer_b', id FROM auth.users WHERE email = 'customer.b@example.com'
UNION ALL
SELECT 'attacker', id FROM auth.users WHERE email = 'attacker@example.com';

SELECT test.assert(
  (SELECT count(*) = (SELECT count(*) FROM auth.users) FROM public.profiles),
  'every auth user has one profile'
);
SELECT test.assert(
  (
    SELECT full_name = 'Existing Customer' AND phone = '01222222222'
    FROM public.profiles AS profile
    JOIN auth.users AS account ON account.id = profile.id
    WHERE account.email = 'existing.auth@example.com'
  ),
  'existing auth user is backfilled with name and phone'
);
SELECT test.assert(
  NOT EXISTS (
    SELECT 1
    FROM public.user_roles AS granted_role
    JOIN auth.users AS account ON account.id = granted_role.user_id
    WHERE account.email = 'existing.auth@example.com'
  ),
  'profile backfill ignores an admin claim in user metadata'
);
SELECT test.assert(
  (SELECT count(*) = 0 FROM public.user_roles),
  'signup metadata cannot grant admin'
);

SELECT test.expect_error(
  $$INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin' FROM public.profiles LIMIT 1$$,
  'ROLE_ASSIGNMENT_FORBIDDEN'
);

\i supabase/bootstrap/grant_first_admin.sql

SELECT test.assert(
  (SELECT count(*) = 1 FROM public.user_roles),
  'bootstrap grants exactly the placeholder account'
);
SELECT test.assert(
  NOT EXISTS (
    SELECT 1
    FROM public.user_roles AS granted_role
    JOIN auth.users AS account ON account.id = granted_role.user_id
    WHERE account.email <> 'replace_with_admin_email'
  ),
  'metadata attacker is not an admin'
);

SELECT id AS admin_id FROM test.actors WHERE name = 'admin' \gset
SELECT id AS customer_a FROM test.actors WHERE name = 'customer_a' \gset
SELECT id AS customer_b FROM test.actors WHERE name = 'customer_b' \gset
SELECT id AS attacker FROM test.actors WHERE name = 'attacker' \gset

SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;

WITH inserted_category AS (
  INSERT INTO public.categories (slug, name_ar, name_en, is_visible, sort_order)
  VALUES ('cookware', 'أواني الطهي', 'Cookware', true, 1)
  RETURNING id
)
INSERT INTO public.products (
  category_id, slug, name_ar, name_en, price_egp, compare_at_price_egp,
  is_visible, is_featured
)
SELECT id, 'steel-set', 'طقم حلل', 'Steel set', 100.00, 150.00, true, true
FROM inserted_category
RETURNING id AS product_id \gset

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
VALUES (:'product_id', 'https://example.test/steel.jpg', true, 0);

INSERT INTO public.product_specifications (
  product_id, label_ar, label_en, value_ar, value_en, sort_order
)
VALUES (:'product_id', 'الخامة', 'Material', 'ستانلس ستيل', 'Stainless steel', 0);

INSERT INTO public.product_variants (
  product_id, color, size, sku, price_egp, stock_quantity, is_active
)
VALUES (:'product_id', 'Red', 'M', 'STEEL-RED-M', NULL, 2, true)
RETURNING id AS variant_red \gset

INSERT INTO public.product_variants (
  product_id, color, size, sku, price_egp, stock_quantity, is_active
)
VALUES (:'product_id', 'Blue', 'L', 'STEEL-BLUE-L', 250.00, 7, true)
RETURNING id AS variant_blue \gset

INSERT INTO public.product_variants (
  product_id, color, size, sku, stock_quantity, is_active
)
VALUES (:'product_id', 'Green', 'S', 'STEEL-GREEN-S', 3, false)
RETURNING id AS variant_inactive \gset

SELECT test.expect_error(
  format(
    $$INSERT INTO public.product_variants (product_id, color, size, stock_quantity, is_active)
      VALUES (%L, ' red ', 'm', 1, true)$$,
    :'product_id'
  ),
  'duplicate key'
);
SELECT test.expect_error(
  format(
    $$INSERT INTO public.product_variants (product_id, color, size, sku, stock_quantity, is_active)
      VALUES (%L, 'Gold', 'XL', 'steel-blue-l', 1, true)$$,
    :'product_id'
  ),
  'duplicate key'
);

WITH hidden_category AS (
  INSERT INTO public.categories (slug, name_ar, name_en, is_visible)
  VALUES ('drafts', 'مسودات', 'Drafts', false)
  RETURNING id
)
INSERT INTO public.products (
  category_id, slug, name_ar, name_en, price_egp, is_visible
)
SELECT id, 'secret-pan', 'مقلاة مخفية', 'Secret pan', 70.00, true
FROM hidden_category
RETURNING id AS hidden_category_product \gset

INSERT INTO public.products (
  category_id, slug, name_ar, name_en, price_egp, is_visible
)
SELECT id, 'hidden-pot', 'حلة مخفية', 'Hidden pot', 80.00, false
FROM public.categories
WHERE slug = 'cookware'
RETURNING id AS hidden_product \gset

INSERT INTO public.product_images (product_id, image_url, is_primary)
VALUES (:'hidden_product', 'https://example.test/hidden.jpg', true);

INSERT INTO public.product_variants (product_id, color, size, stock_quantity, is_active)
VALUES (:'hidden_product', 'Black', 'M', 3, true)
RETURNING id AS variant_hidden \gset

INSERT INTO public.product_variants (product_id, color, size, stock_quantity, is_active)
VALUES (:'hidden_category_product', 'Black', 'M', 4, true)
RETURNING id AS variant_hidden_category \gset

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', false);
SET ROLE anon;

SELECT test.assert((SELECT count(*) = 1 FROM public.categories), 'anon sees only visible categories');
SELECT test.assert((SELECT count(*) = 1 FROM public.products), 'anon sees only visible products');
SELECT test.assert(
  (SELECT price_egp = 100.00 AND currency = 'EGP' FROM public.products),
  'anon can read the public EGP price'
);
SELECT test.assert(
  (SELECT count(*) = 2 FROM public.product_variants),
  'anon sees only active variants of visible products'
);
SELECT test.assert(
  (
    SELECT stock_quantity = 2 AND price_egp IS NULL AND color = 'Red' AND size = 'M'
    FROM public.product_variants
    WHERE id = :'variant_red'::uuid
  ),
  'anon can read variant stock without a price override'
);
SELECT test.assert(
  (
    SELECT stock_quantity = 7 AND price_egp = 250.00
    FROM public.product_variants
    WHERE id = :'variant_blue'::uuid
  ),
  'anon can read an independent variant price and stock'
);
SELECT test.assert((SELECT count(*) = 1 FROM public.product_images), 'anon cannot see hidden product images');
SELECT test.assert(
  (SELECT value_en = 'Stainless steel' FROM public.product_specifications),
  'anon can read visible specifications'
);
SELECT test.assert(public.is_admin() IS FALSE, 'anonymous visitor is not admin');
SELECT test.expect_error('SELECT count(*) FROM public.orders', 'permission denied');
SELECT test.expect_error('SELECT count(*) FROM public.profiles', 'permission denied');
SELECT test.expect_error('SELECT count(*) FROM public.payments', 'permission denied');
SELECT test.expect_error(
  $$SELECT public.checkout_order(
      '00000000-0000-0000-0000-000000000000',
      'cod',
      '00000000-0000-0000-0000-0000000000a1',
      ''
    )$$,
  'permission denied'
);

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;

SELECT test.assert(public.is_admin() IS FALSE, 'customer is not admin');
SELECT test.assert((SELECT count(*) = 1 FROM public.profiles), 'customer sees only their profile');
SELECT test.assert((SELECT count(*) = 1 FROM public.products), 'customer sees the same public catalog');

UPDATE public.products
SET price_egp = 1, is_visible = false
WHERE id = :'product_id'::uuid;

UPDATE public.product_variants
SET price_egp = 1, stock_quantity = 0, is_active = false
WHERE id = :'variant_red'::uuid;

SELECT test.expect_error(
  $$INSERT INTO public.products (
      category_id, slug, name_ar, name_en, price_egp, is_visible
    )
    SELECT id, 'stolen', 'مسروق', 'Stolen', 1, true
    FROM public.categories
    LIMIT 1$$,
  'row-level security'
);
SELECT test.expect_error(
  format(
    $$INSERT INTO public.product_variants (product_id, color, size, stock_quantity, is_active)
      VALUES (%L, 'Silver', 'M', 9, true)$$,
    :'product_id'
  ),
  'row-level security'
);
SELECT test.expect_error(
  'DELETE FROM public.products',
  'permission denied'
);
SELECT test.expect_error(
  format('SELECT public.grant_admin(%L)', :'customer_a'),
  'does not exist'
);
SELECT test.expect_error(
  $$INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'admin')$$,
  'permission denied'
);

INSERT INTO public.addresses (
  user_id, recipient_name, phone, governorate, city, street, is_default
)
VALUES (
  auth.uid(), 'Customer A', '01000000000', 'Cairo', 'Nasr City', 'Example Street', true
)
RETURNING id AS address_a \gset

INSERT INTO public.addresses (
  user_id, recipient_name, phone, governorate, city, street, is_default
)
VALUES (
  auth.uid(), 'Customer A work', '01000000000', 'Cairo', 'Heliopolis', 'Other Street', true
)
RETURNING id AS address_a_work \gset

SELECT test.assert(
  (
    SELECT is_default IS FALSE
    FROM public.addresses
    WHERE id = :'address_a'::uuid
  ),
  'a new default address clears the previous one'
);

SELECT test.expect_error(
  format(
    'UPDATE public.addresses SET user_id = %L WHERE id = %L',
    :'customer_b',
    :'address_a_work'
  ),
  'ADDRESS_OWNERSHIP_LOCKED'
);

INSERT INTO public.carts (user_id)
VALUES (auth.uid())
RETURNING id AS cart_a \gset

INSERT INTO public.cart_items (cart_id, variant_id, quantity)
VALUES (:'cart_a', :'variant_red', 1);

SELECT test.expect_error(
  format(
    'INSERT INTO public.cart_items (cart_id, variant_id, quantity) VALUES (%L, %L, 1)',
    :'cart_a',
    :'variant_red'
  ),
  'duplicate key'
);
SELECT test.expect_error(
  format(
    'INSERT INTO public.cart_items (cart_id, variant_id, quantity) VALUES (%L, %L, 1)',
    :'cart_a',
    :'variant_hidden'
  ),
  'row-level security'
);
SELECT test.expect_error(
  format(
    'INSERT INTO public.cart_items (cart_id, variant_id, quantity) VALUES (%L, %L, 1)',
    :'cart_a',
    :'variant_hidden_category'
  ),
  'row-level security'
);
SELECT test.expect_error(
  format(
    'INSERT INTO public.cart_items (cart_id, variant_id, quantity) VALUES (%L, %L, 1)',
    :'cart_a',
    :'variant_inactive'
  ),
  'row-level security'
);

RESET ROLE;
SELECT test.assert(
  (
    SELECT price_egp = 100.00 AND is_visible
    FROM public.products
    WHERE id = :'product_id'::uuid
  ),
  'customer cannot edit price or visibility'
);
SELECT test.assert(
  (
    SELECT stock_quantity = 2
      AND price_egp IS NULL
      AND is_active
    FROM public.product_variants
    WHERE id = :'variant_red'::uuid
  ),
  'customer cannot edit variant stock, price, or active status'
);

SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SELECT test.expect_error(
  format(
    $$INSERT INTO public.orders (
        user_id, reference, idempotency_key, status, payment_method,
        subtotal_egp, shipping_egp, total_egp, recipient_name, recipient_phone,
        delivery_governorate, delivery_city, delivery_street
      ) VALUES (
        %L, public.generate_order_reference(), gen_random_uuid(), 'pending', 'cod',
        100, 0, 100, 'Customer A', '01000000000', 'Cairo', 'Nasr City', 'Example Street'
      )$$,
    :'customer_a'
  ),
  'ORDER_WRITE_FORBIDDEN'
);

SELECT test.expect_error(
  format(
    $$WITH armed AS (
        SELECT pg_catalog.set_config('app.checkout', 'on', true) AS flag
      ),
      created_order AS (
        INSERT INTO public.orders (
          user_id, reference, idempotency_key, status, payment_method,
          subtotal_egp, shipping_egp, total_egp, recipient_name, recipient_phone,
          delivery_governorate, delivery_city, delivery_street
        )
        SELECT
          %L::uuid,
          public.generate_order_reference(),
          gen_random_uuid(),
          'pending',
          'cod',
          100,
          0,
          100,
          'Customer A',
          '01000000000',
          'Cairo',
          'Nasr City',
          'Example Street'
        FROM armed
        RETURNING id
      )
      INSERT INTO public.order_items (
        order_id, product_id, variant_id, product_slug, product_name_ar, product_name_en,
        color, size, sku, unit_price_egp, quantity, line_total_egp, currency
      )
      SELECT id, %L::uuid, %L::uuid, 'steel-set', 'طقم حلل', 'Steel set',
        'Red', 'M', 'STEEL-RED-M', 1.00, 1, 1.00, 'EGP'
      FROM created_order$$,
    :'customer_a',
    :'product_id',
    :'variant_red'
  ),
  'ORDER_ITEM_PRICE_MISMATCH'
);

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;

SELECT public.checkout_order(
  :'address_a_work'::uuid,
  'cod',
  '00000000-0000-0000-0000-0000000000a1'::uuid,
  'Leave at the door'
) AS order_a \gset

SELECT public.checkout_order(
  :'address_a'::uuid,
  'vodafone_cash',
  '00000000-0000-0000-0000-0000000000a1'::uuid,
  'different attempt'
) AS order_a_replay \gset

SELECT test.assert(:'order_a' = :'order_a_replay', 'the same idempotency key does not create a second order');
SELECT test.assert(
  (SELECT stock_quantity = 1 FROM public.product_variants WHERE id = :'variant_red'::uuid),
  'checkout decrements the selected variant once'
);
SELECT test.assert(
  (SELECT stock_quantity = 7 FROM public.product_variants WHERE id = :'variant_blue'::uuid),
  'selling red leaves the blue variant stock unchanged'
);
SELECT test.assert((SELECT count(*) = 0 FROM public.cart_items), 'checkout clears the customer cart');
SELECT test.assert(
  (
    SELECT reference ~ '^MH-[0-9]{6}$'
      AND currency = 'EGP'
      AND subtotal_egp = 100.00
      AND shipping_egp = 0
      AND total_egp = 100.00
      AND status = 'pending'
      AND payment_method = 'cod'
      AND customer_note = 'Leave at the door'
      AND delivery_street = 'Other Street'
    FROM public.orders
    WHERE id = :'order_a'::uuid
  ),
  'server snapshot uses the database price and the selected address'
);
SELECT test.assert(
  (
    SELECT unit_price_egp = 100.00
      AND line_total_egp = 100.00
      AND quantity = 1
      AND product_name_en = 'Steel set'
      AND color = 'Red'
      AND size = 'M'
      AND sku = 'STEEL-RED-M'
      AND variant_id = :'variant_red'::uuid
    FROM public.order_items
    WHERE order_id = :'order_a'::uuid
  ),
  'order item stores color, size, SKU, and price snapshots'
);
SELECT test.assert(
  (
    SELECT method = 'cod' AND status = 'pending' AND amount_egp = 100.00 AND currency = 'EGP'
    FROM public.payments
    WHERE order_id = :'order_a'::uuid
  ),
  'cash on delivery starts unpaid'
);
SELECT test.assert(
  (SELECT count(*) = 1 FROM public.order_status_events WHERE order_id = :'order_a'::uuid),
  'placing an order writes the first tracking event'
);
SELECT test.assert((SELECT count(*) = 0 FROM public.order_audit_log), 'customer cannot read the audit log');
SELECT test.expect_error(
  format('UPDATE public.orders SET status = ''delivered'' WHERE id = %L', :'order_a'),
  'permission denied'
);
SELECT test.expect_error(
  format('UPDATE public.payments SET status = ''paid'' WHERE order_id = %L', :'order_a'),
  'permission denied'
);
SELECT test.expect_error(
  format(
    'SELECT public.submit_vodafone_cash_proof(%L, ''01000000000'', ''TRANSFER1'')',
    :'order_a'
  ),
  'PROOF_NOT_ACCEPTED'
);

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;

UPDATE public.products
SET price_egp = 180.00, compare_at_price_egp = 220.00, name_en = 'Steel set renamed'
WHERE id = :'product_id'::uuid;

SELECT test.expect_error(
  format(
    'UPDATE public.product_variants SET stock_quantity = -1 WHERE id = %L',
    :'variant_red'
  ),
  'product_variants_stock_nonnegative'
);

RESET ROLE;
SELECT test.assert(
  (
    SELECT stock_quantity = 1
    FROM public.product_variants
    WHERE id = :'variant_red'::uuid
  )
  AND (
    SELECT price_egp = 180.00
    FROM public.products
    WHERE id = :'product_id'::uuid
  ),
  'admin can change the catalog price but cannot store negative variant stock'
);
SELECT test.assert(
  (
    SELECT unit_price_egp = 100.00 AND product_name_en = 'Steel set'
    FROM public.order_items
    WHERE order_id = :'order_a'::uuid
  ),
  'catalog edits do not rewrite historical order prices'
);

SELECT set_config('request.jwt.claim.sub', '', false);
SELECT test.expect_error(
  format('UPDATE public.orders SET status = ''confirmed'' WHERE id = %L', :'order_a'),
  'ORDER_STATUS_LOCKED'
);

SELECT set_config('request.jwt.claim.sub', :'customer_b', false);
SET ROLE authenticated;

SELECT test.assert((SELECT count(*) = 0 FROM public.orders), 'customer cannot read another customer order');
SELECT test.assert((SELECT count(*) = 0 FROM public.order_items), 'customer cannot read another customer order items');
SELECT test.assert((SELECT count(*) = 0 FROM public.payments), 'customer cannot read another customer payment');
SELECT test.assert((SELECT count(*) = 0 FROM public.addresses), 'customer cannot read another customer address');
SELECT test.assert((SELECT count(*) = 0 FROM public.carts), 'customer cannot read another customer cart');
SELECT test.assert(
  (SELECT full_name = 'Customer B' AND count(*) = 1 FROM public.profiles GROUP BY full_name),
  'customer profile is private'
);

INSERT INTO public.addresses (
  user_id, recipient_name, phone, governorate, city, street, is_default
)
VALUES (
  auth.uid(), 'Customer B', '01111111111', 'Giza', 'Dokki', 'Market Street', true
)
RETURNING id AS address_b \gset

INSERT INTO public.carts (user_id) VALUES (auth.uid()) RETURNING id AS cart_b \gset
INSERT INTO public.cart_items (cart_id, variant_id, quantity)
VALUES (:'cart_b', :'variant_red', 1);

SELECT public.checkout_order(
  :'address_b'::uuid,
  'cod',
  '00000000-0000-0000-0000-0000000000b1'::uuid,
  ''
) AS order_b \gset

SELECT test.assert(
  (SELECT stock_quantity = 0 FROM public.product_variants WHERE id = :'variant_red'::uuid),
  'the last unit of the selected variant can be sold once'
);
SELECT test.assert(
  (SELECT stock_quantity = 7 FROM public.product_variants WHERE id = :'variant_blue'::uuid),
  'the other variant still has its own stock'
);

INSERT INTO public.carts (user_id)
SELECT auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.carts WHERE user_id = auth.uid());

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;

INSERT INTO public.carts (user_id)
VALUES (auth.uid())
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.cart_items (cart_id, variant_id, quantity)
SELECT id, :'variant_red'::uuid, 1
FROM public.carts
WHERE user_id = auth.uid();

SELECT test.expect_error(
  $$SELECT public.checkout_order(
      (SELECT id FROM public.addresses WHERE is_default),
      'cod',
      '00000000-0000-0000-0000-0000000000a2'::uuid,
      ''
    )$$,
  'INSUFFICIENT_STOCK'
);

RESET ROLE;
SELECT test.assert(
  (SELECT stock_quantity = 0 FROM public.product_variants WHERE id = :'variant_red'::uuid),
  'a rejected checkout does not make variant stock negative'
);

SELECT set_config('request.jwt.claim.sub', '', false);
SET ROLE anon;
SELECT test.assert(
  (SELECT count(*) = 1 FROM public.products),
  'an out-of-stock variant stays on a visible product without exposing hidden products'
);
SELECT test.assert(
  (
    SELECT stock_quantity = 0
    FROM public.product_variants
    WHERE id = :'variant_red'::uuid
  ),
  'anonymous shoppers can see that the selected variant is out of stock'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;
UPDATE public.product_variants SET stock_quantity = 4 WHERE id = :'variant_red'::uuid;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;
DELETE FROM public.cart_items
WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid());
INSERT INTO public.cart_items (cart_id, variant_id, quantity)
SELECT id, :'variant_red'::uuid, 2
FROM public.carts
WHERE user_id = auth.uid();

SELECT public.checkout_order(
  :'address_a_work'::uuid,
  'vodafone_cash',
  '00000000-0000-0000-0000-0000000000a3'::uuid,
  ''
) AS order_v \gset

SELECT test.assert(
  (
    SELECT total_egp = 360.00
      AND payment_method = 'vodafone_cash'
    FROM public.orders
    WHERE id = :'order_v'::uuid
  ),
  'checkout reprices the cart from the current database price'
);
SELECT test.assert(
  (
    SELECT status = 'awaiting_verification' AND amount_egp = 360.00 AND transfer_reference IS NULL
    FROM public.payments
    WHERE order_id = :'order_v'::uuid
  ),
  'Vodafone Cash starts unverified'
);

SELECT test.expect_error(
  format('SELECT public.admin_review_payment(%L, ''paid'', ''ok'', ''note'')', :'order_v'),
  'ADMIN_REQUIRED'
);

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;
SELECT test.expect_error(
  format('SELECT public.admin_review_payment(%L, ''paid'', ''Received'', ''matched'')', :'order_v'),
  'PAYMENT_PROOF_REQUIRED'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'customer_b', false);
SET ROLE authenticated;
SELECT test.expect_error(
  format(
    'SELECT public.submit_vodafone_cash_proof(%L, ''01111111111'', ''TRANSFER9'')',
    :'order_v'
  ),
  'PROOF_NOT_ACCEPTED'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;
SELECT public.submit_vodafone_cash_proof(:'order_v'::uuid, '010 0000 0000', 'TRANSFER9');
SELECT test.assert(
  (
    SELECT status = 'awaiting_verification'
      AND sender_phone = '01000000000'
      AND transfer_reference = 'TRANSFER9'
      AND amount_egp = 360.00
    FROM public.payments
    WHERE order_id = :'order_v'::uuid
  ),
  'transfer proof does not confirm payment'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;
SELECT public.admin_review_payment(:'order_v'::uuid, 'paid', 'Payment matched', 'wallet checked');
SELECT test.assert(
  (
    SELECT status = 'paid' AND customer_message = 'Payment matched' AND amount_egp = 360.00
    FROM public.payments
    WHERE order_id = :'order_v'::uuid
  ),
  'admin verification is the only path to paid'
);
SELECT test.assert((SELECT count(*) = 1 FROM public.payment_audit), 'payment review is audited');
SELECT test.expect_error(
  format('SELECT public.admin_review_payment(%L, ''rejected'', '''', '''')', :'order_v'),
  'INVALID_PAYMENT_TRANSITION'
);
SELECT test.expect_error(
  format(
    'SELECT public.admin_update_order_status(%L, ''delivered'', '''', ''skip'')',
    :'order_a'
  ),
  'INVALID_STATUS_TRANSITION'
);
SELECT public.admin_update_order_status(:'order_a'::uuid, 'confirmed', 'Confirmed', 'called customer');
SELECT public.admin_update_order_status(:'order_a'::uuid, 'preparing', '', 'packing');
SELECT public.admin_update_order_status(:'order_a'::uuid, 'out_for_delivery', 'On the way', '');
SELECT public.admin_update_order_status(:'order_a'::uuid, 'delivered', 'Delivered', '');
SELECT test.expect_error(
  format('SELECT public.admin_update_order_status(%L, ''cancelled'', '''', '''')', :'order_a'),
  'INVALID_STATUS_TRANSITION'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;
SELECT test.assert(
  (SELECT count(*) = 5 FROM public.order_status_events WHERE order_id = :'order_a'::uuid),
  'customer can follow their own status history'
);
SELECT test.assert(
  (SELECT count(*) = 0 FROM public.order_audit_log),
  'internal status notes stay admin-only'
);
SELECT test.assert((SELECT count(*) = 0 FROM public.payment_audit), 'payment audit stays admin-only');
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;
INSERT INTO public.cart_items (cart_id, variant_id, quantity)
SELECT id, :'variant_red'::uuid, 1
FROM public.carts
WHERE user_id = auth.uid();
SELECT public.checkout_order(
  :'address_a_work'::uuid,
  'cod',
  '00000000-0000-0000-0000-0000000000a4'::uuid,
  ''
) AS order_cancel \gset
RESET ROLE;

SELECT test.assert(
  (SELECT stock_quantity = 1 FROM public.product_variants WHERE id = :'variant_red'::uuid),
  'variant stock before cancelling the spare order'
);

SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;
SELECT public.admin_update_order_status(:'order_cancel'::uuid, 'cancelled', 'Cancelled', 'customer changed their mind');
RESET ROLE;

SELECT test.assert(
  (SELECT status = 'cancelled' FROM public.orders WHERE id = :'order_cancel'::uuid),
  'admin cancellation is recorded'
);
SELECT test.assert(
  (SELECT status = 'cancelled' FROM public.payments WHERE order_id = :'order_cancel'::uuid),
  'an unpaid cancelled order does not remain collectible'
);
SELECT test.assert(
  (SELECT stock_quantity = 2 FROM public.product_variants WHERE id = :'variant_red'::uuid),
  'cancelling an unshipped order returns that variant stock'
);
SELECT test.assert(
  (SELECT stock_quantity = 7 FROM public.product_variants WHERE id = :'variant_blue'::uuid),
  'cancellation does not change a variant that was not sold'
);

SELECT set_config('request.jwt.claim.sub', :'customer_b', false);
SET ROLE authenticated;
SELECT test.assert(
  (SELECT count(*) = 1 FROM public.orders),
  'cancellation of another order is not visible'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;
SELECT test.assert(public.is_admin() IS TRUE, 'the bootstrapped account is the admin');
SELECT test.expect_error(
  format('SELECT public.grant_admin(%L::uuid)', :'customer_b'),
  'does not exist'
);
SELECT test.expect_error(
  format('SELECT public.revoke_admin(%L::uuid)', :'admin_id'),
  'does not exist'
);
SELECT test.expect_error(
  format(
    $$INSERT INTO public.user_roles (user_id, role, granted_by)
      VALUES (%L, 'admin', auth.uid())$$,
    :'customer_b'
  ),
  'permission denied'
);
RESET ROLE;

SELECT test.assert((SELECT count(*) = 1 FROM public.user_roles), 'the original admin remains');
SELECT test.assert(
  NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = :'customer_b'::uuid
  ),
  'an authenticated admin cannot grant another admin through an RPC'
);

-- Duplicate Vodafone Cash references. Stock is 2 after the earlier cancellation.
SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;
INSERT INTO public.cart_items (cart_id, variant_id, quantity)
SELECT id, :'variant_red'::uuid, 1
FROM public.carts
WHERE user_id = auth.uid();
SELECT public.checkout_order(
  :'address_a'::uuid,
  'vodafone_cash',
  '00000000-0000-0000-0000-0000000000a5'::uuid,
  ''
) AS order_ref_a \gset
SELECT public.submit_vodafone_cash_proof(:'order_ref_a'::uuid, '01000000000', 'REF-SHARED-100');
SELECT public.submit_vodafone_cash_proof(:'order_ref_a'::uuid, '01000000000', 'REF-SHARED-100');
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'customer_b', false);
SET ROLE authenticated;
INSERT INTO public.cart_items (cart_id, variant_id, quantity)
SELECT id, :'variant_red'::uuid, 1
FROM public.carts
WHERE user_id = auth.uid();
SELECT public.checkout_order(
  :'address_b'::uuid,
  'vodafone_cash',
  '00000000-0000-0000-0000-0000000000b2'::uuid,
  ''
) AS order_ref_b \gset
SELECT test.expect_error(
  format(
    'SELECT public.submit_vodafone_cash_proof(%L, ''01111111111'', ''ref-shared-100'')',
    :'order_ref_b'
  ),
  'DUPLICATE_TRANSFER_REFERENCE'
);
SELECT public.submit_vodafone_cash_proof(:'order_ref_b'::uuid, '01111111111', 'REF-B-ONLY-200');
RESET ROLE;

SELECT test.assert(
  (
    SELECT status = 'awaiting_verification'
      AND transfer_reference = 'REF-SHARED-100'
      AND amount_egp IS NOT NULL
    FROM public.payments
    WHERE order_id = :'order_ref_a'::uuid
  ),
  'the first transfer reference stays on the original payment'
);
SELECT test.assert(
  (
    SELECT transfer_reference = 'REF-B-ONLY-200' AND status = 'awaiting_verification'
    FROM public.payments
    WHERE order_id = :'order_ref_b'::uuid
  ),
  'a different transfer reference is accepted'
);

-- Deleting an address used by an order keeps the delivery snapshot.
SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;
DELETE FROM public.addresses
WHERE id = :'address_a_work'::uuid;
SELECT test.assert(
  (
    SELECT address_id IS NULL
      AND delivery_street = 'Other Street'
      AND recipient_name = 'Customer A work'
    FROM public.orders
    WHERE id = :'order_a'::uuid
  ),
  'deleting a used address keeps the order snapshot and clears only the link'
);
RESET ROLE;

SELECT test.expect_error(
  format(
    'UPDATE public.orders SET address_id = %L WHERE id = %L',
    :'address_a',
    :'order_a'
  ),
  'ORDER_IMMUTABLE_FIELD'
);

-- One order can contain two variants. Cancelling it restores each variant.
SELECT test.assert(
  (SELECT stock_quantity = 0 FROM public.product_variants WHERE id = :'variant_red'::uuid),
  'red is sold out before the mixed-variant order'
);
SELECT test.assert(
  (SELECT stock_quantity = 7 FROM public.product_variants WHERE id = :'variant_blue'::uuid),
  'blue stock survived every red sale'
);

SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;
UPDATE public.product_variants
SET stock_quantity = 1
WHERE id = :'variant_red'::uuid;
UPDATE public.product_variants
SET is_active = false
WHERE id = :'variant_blue'::uuid;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;
SELECT test.expect_error(
  format(
    $$INSERT INTO public.cart_items (cart_id, variant_id, quantity)
      SELECT id, %L::uuid, 1 FROM public.carts WHERE user_id = auth.uid()$$,
    :'variant_blue'
  ),
  'row-level security'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;
UPDATE public.product_variants
SET is_active = true
WHERE id = :'variant_blue'::uuid;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;
INSERT INTO public.cart_items (cart_id, variant_id, quantity)
SELECT id, :'variant_red'::uuid, 1
FROM public.carts
WHERE user_id = auth.uid();
INSERT INTO public.cart_items (cart_id, variant_id, quantity)
SELECT id, :'variant_blue'::uuid, 1
FROM public.carts
WHERE user_id = auth.uid();
SELECT public.checkout_order(
  :'address_a'::uuid,
  'cod',
  '00000000-0000-0000-0000-0000000000a6'::uuid,
  ''
) AS order_mixed \gset
RESET ROLE;

SELECT test.assert(
  (
    SELECT total_egp = 430.00
    FROM public.orders
    WHERE id = :'order_mixed'::uuid
  ),
  'one order prices each variant independently'
);
SELECT test.assert(
  (
    SELECT unit_price_egp = 180.00
      AND color = 'Red'
      AND size = 'M'
      AND sku = 'STEEL-RED-M'
      AND quantity = 1
    FROM public.order_items
    WHERE order_id = :'order_mixed'::uuid
      AND variant_id = :'variant_red'::uuid
  ),
  'the red line snapshots the inherited product price'
);
SELECT test.assert(
  (
    SELECT unit_price_egp = 250.00
      AND color = 'Blue'
      AND size = 'L'
      AND sku = 'STEEL-BLUE-L'
      AND quantity = 1
    FROM public.order_items
    WHERE order_id = :'order_mixed'::uuid
      AND variant_id = :'variant_blue'::uuid
  ),
  'the blue line snapshots the variant price override'
);
SELECT test.assert(
  (SELECT stock_quantity = 0 FROM public.product_variants WHERE id = :'variant_red'::uuid)
  AND (SELECT stock_quantity = 6 FROM public.product_variants WHERE id = :'variant_blue'::uuid),
  'mixed checkout deducts each variant separately'
);

SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;
UPDATE public.product_variants
SET price_egp = 999.00, sku = 'STEEL-BLUE-EDITED'
WHERE id = :'variant_blue'::uuid;
UPDATE public.products
SET name_en = 'Steel set edited again'
WHERE id = :'product_id'::uuid;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'customer_a', false);
SET ROLE authenticated;
SELECT test.assert(
  (
    SELECT count(*) = 2
      AND bool_and(color IN ('Red', 'Blue'))
      AND bool_and(unit_price_egp IN (180.00, 250.00))
      AND bool_or(sku = 'STEEL-BLUE-L')
      AND bool_or(product_name_en = 'Steel set renamed')
    FROM public.order_items
    WHERE order_id = :'order_mixed'::uuid
  ),
  'order history keeps variant snapshots after catalog edits'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'admin_id', false);
SET ROLE authenticated;
SELECT public.admin_update_order_status(:'order_mixed'::uuid, 'cancelled', 'Cancelled', 'restore both variants');
RESET ROLE;

SELECT test.assert(
  (SELECT stock_quantity = 1 FROM public.product_variants WHERE id = :'variant_red'::uuid),
  'cancellation restores the red variant'
);
SELECT test.assert(
  (SELECT stock_quantity = 7 FROM public.product_variants WHERE id = :'variant_blue'::uuid),
  'cancellation restores the blue variant to its pre-order stock'
);
SELECT test.assert(
  (
    SELECT unit_price_egp = 250.00 AND sku = 'STEEL-BLUE-L' AND color = 'Blue'
    FROM public.order_items
    WHERE order_id = :'order_mixed'::uuid
      AND variant_id = :'variant_blue'::uuid
  ),
  'restocking does not rewrite the historical variant snapshot'
);

SELECT 'PHASE2_TESTS_PASSED' AS result;
