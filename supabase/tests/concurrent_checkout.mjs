import { createRequire } from 'node:module'

const require = createRequire(
  'C:/Users/DELL/AppData/Local/Temp/modern-home-pgtest/package.json',
)
const { Client } = require('pg')

const config = {
  host: '127.0.0.1',
  port: 54329,
  user: 'postgres',
  database: 'postgres',
}

function client() {
  return new Client(config)
}

async function query(c, text, params) {
  return c.query(text, params)
}

const setup = client()
await setup.connect()

const category = await query(
  setup,
  `SELECT id FROM public.categories WHERE slug = 'cookware'`,
)
if (category.rowCount !== 1) {
  throw new Error('ASSERTION FAILED: visible cookware category is missing')
}

const product = await query(
  setup,
  `INSERT INTO public.products (
     category_id, slug, name_ar, name_en, price_egp, is_visible
   ) VALUES ($1, 'race-pan', 'مقلاة سباق', 'Race pan', 50.00, true)
   RETURNING id`,
  [category.rows[0].id],
)
const productId = product.rows[0].id

const variantRows = await query(
  setup,
  `INSERT INTO public.product_variants (
     product_id, color, size, sku, price_egp, stock_quantity, is_active
   ) VALUES
     ($1, 'Red', 'M', 'RACE-RED-M', NULL, 1, true),
     ($1, 'Blue', 'L', 'RACE-BLUE-L', 80.00, 1, true)
   RETURNING id, color`,
  [productId],
)
const redId = variantRows.rows.find((row) => row.color === 'Red').id
const blueId = variantRows.rows.find((row) => row.color === 'Blue').id

async function makeBuyer(email, variantId) {
  const user = await query(
    setup,
    `INSERT INTO auth.users (id, email, raw_user_meta_data)
     VALUES (gen_random_uuid(), $1, '{"full_name":"Race Buyer","phone":"01500000000"}'::jsonb)
     RETURNING id`,
    [email],
  )
  const userId = user.rows[0].id
  const address = await query(
    setup,
    `INSERT INTO public.addresses (
       user_id, recipient_name, phone, governorate, city, street, is_default
     ) VALUES ($1, 'Race Buyer', '01500000000', 'Cairo', 'Maadi', 'Race Street', true)
     RETURNING id`,
    [userId],
  )
  const cart = await query(
    setup,
    `INSERT INTO public.carts (user_id) VALUES ($1) RETURNING id`,
    [userId],
  )
  await query(
    setup,
    `INSERT INTO public.cart_items (cart_id, variant_id, quantity) VALUES ($1, $2, 1)`,
    [cart.rows[0].id, variantId],
  )
  return { userId, addressId: address.rows[0].id }
}

const redBuyers = [
  await makeBuyer('race.a@example.com', redId),
  await makeBuyer('race.b@example.com', redId),
]
const blueBuyer = await makeBuyer('race.c@example.com', blueId)
await setup.end()

async function checkout(buyer, key) {
  const connection = client()
  await connection.connect()
  try {
    await connection.query('BEGIN')
    await connection.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [buyer.userId])
    await connection.query('SET LOCAL ROLE authenticated')
    const result = await connection.query(
      `SELECT public.checkout_order($1, 'cod', $2, '') AS id`,
      [buyer.addressId, key],
    )
    await connection.query('COMMIT')
    return { ok: true, id: result.rows[0].id }
  } catch (error) {
    await connection.query('ROLLBACK').catch(() => {})
    return { ok: false, message: error.message }
  } finally {
    await connection.end()
  }
}

const holder = client()
await holder.connect()
await holder.query('BEGIN')
await holder.query('SELECT 1 FROM public.product_variants WHERE id = $1 FOR UPDATE', [redId])

const blueSale = await Promise.race([
  checkout(blueBuyer, '00000000-0000-0000-0000-00000000c021'),
  new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error('ASSERTION FAILED: buying blue waited on the red stock lock')),
      4000,
    ),
  ),
])
if (!blueSale.ok) {
  throw new Error(`ASSERTION FAILED: blue checkout failed while red was locked: ${blueSale.message}`)
}

const during = client()
await during.connect()
const duringStock = await during.query(
  `SELECT id, stock_quantity FROM public.product_variants WHERE product_id = $1`,
  [productId],
)
await during.end()
const duringRed = duringStock.rows.find((row) => row.id === redId)
const duringBlue = duringStock.rows.find((row) => row.id === blueId)
if (duringRed.stock_quantity !== 1 || duringBlue.stock_quantity !== 0) {
  throw new Error(
    `ASSERTION FAILED: independent sale changed the locked variant (${duringRed.stock_quantity}, ${duringBlue.stock_quantity})`,
  )
}

const waiter = client()
await waiter.connect()
const checkoutPromise = waiter.query('BEGIN').then(async () => {
  await waiter.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [redBuyers[1].userId])
  await waiter.query('SET LOCAL ROLE authenticated')
  return waiter.query(
    `SELECT public.checkout_order($1, 'cod', '00000000-0000-0000-0000-00000000c002', '') AS id`,
    [redBuyers[1].addressId],
  )
})

const probe = client()
await probe.connect()
let sawWait = false
for (let attempt = 0; attempt < 50; attempt += 1) {
  const locks = await probe.query(
    `SELECT count(*)::int AS waiting
     FROM pg_stat_activity
     WHERE pid <> pg_backend_pid()
       AND wait_event_type = 'Lock'`,
  )
  if (locks.rows[0].waiting > 0) {
    sawWait = true
    break
  }
  await new Promise((resolve) => setTimeout(resolve, 100))
}
await probe.end()

if (!sawWait) {
  throw new Error('ASSERTION FAILED: the second checkout did not wait on the variant stock lock')
}

await holder.query(
  'UPDATE public.product_variants SET stock_quantity = 0 WHERE id = $1',
  [redId],
)
await holder.query('COMMIT')

let waiterError = ''
try {
  await checkoutPromise
  await waiter.query('COMMIT')
  throw new Error('ASSERTION FAILED: checkout succeeded while the locked variant stock was removed')
} catch (error) {
  waiterError = error.message
  await waiter.query('ROLLBACK').catch(() => {})
}

if (!waiterError.includes('INSUFFICIENT_STOCK')) {
  throw new Error(`ASSERTION FAILED: expected INSUFFICIENT_STOCK but got ${waiterError}`)
}
await holder.end()
await waiter.end()

const restock = client()
await restock.connect()
await restock.query(
  'UPDATE public.product_variants SET stock_quantity = 1 WHERE id = $1',
  [redId],
)
await restock.end()

const raced = await Promise.all([
  checkout(redBuyers[0], '00000000-0000-0000-0000-00000000c011'),
  checkout(redBuyers[1], '00000000-0000-0000-0000-00000000c012'),
])

const wins = raced.filter((result) => result.ok)
const losses = raced.filter((result) => !result.ok)
const finalStock = client()
await finalStock.connect()
const stock = await finalStock.query(
  `SELECT id, stock_quantity FROM public.product_variants WHERE product_id = $1`,
  [productId],
)
const lines = await finalStock.query(
  `SELECT variant_id, color, size, sku, unit_price_egp
   FROM public.order_items
   WHERE product_id = $1`,
  [productId],
)
await finalStock.end()

const finalRed = stock.rows.find((row) => row.id === redId)
const finalBlue = stock.rows.find((row) => row.id === blueId)
const redLines = lines.rows.filter((row) => row.variant_id === redId)
const blueLines = lines.rows.filter((row) => row.variant_id === blueId)

if (wins.length !== 1 || losses.length !== 1) {
  throw new Error(
    `ASSERTION FAILED: expected one winner and one loser, got ${JSON.stringify(raced)}`,
  )
}
if (!losses[0].message.includes('INSUFFICIENT_STOCK')) {
  throw new Error(`ASSERTION FAILED: loser error was ${losses[0].message}`)
}
if (finalRed.stock_quantity !== 0 || finalBlue.stock_quantity !== 0) {
  throw new Error(
    `ASSERTION FAILED: final stocks red=${finalRed.stock_quantity} blue=${finalBlue.stock_quantity}`,
  )
}
if (redLines.length !== 1 || blueLines.length !== 1) {
  throw new Error(
    `ASSERTION FAILED: expected one line per variant, got red=${redLines.length} blue=${blueLines.length}`,
  )
}
if (Number(redLines[0].unit_price_egp) !== 50 || redLines[0].sku !== 'RACE-RED-M') {
  throw new Error(`ASSERTION FAILED: red snapshot ${JSON.stringify(redLines[0])}`)
}
if (Number(blueLines[0].unit_price_egp) !== 80 || blueLines[0].color !== 'Blue') {
  throw new Error(`ASSERTION FAILED: blue snapshot ${JSON.stringify(blueLines[0])}`)
}

console.log('CONCURRENT_CHECKOUT_PASSED')
console.log('independent_variant_sale=yes')
console.log('lock_wait=yes')
console.log('winner=1')
console.log('loser=INSUFFICIENT_STOCK')
console.log('final_red_stock=0')
console.log('final_blue_stock=0')
console.log('red_snapshot_price_egp=50.00')
console.log('blue_snapshot_price_egp=80.00')
