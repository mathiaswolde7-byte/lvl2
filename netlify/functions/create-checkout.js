/* ==========================================================
   LVL — create a Stripe Checkout Session
   Called by checkout.html when the shopper clicks "Pay".
   It receives the bag (product id, colour, size, quantity), looks
   every price up in js/catalog.js, and asks Stripe for a secure
   payment page. The browser never decides the price.

   Needs one setting in Netlify:  STRIPE_SECRET_KEY  (sk_test_… or sk_live_…)
   Optional:                       STRIPE_TAX = on   (turns on Stripe Tax)
   ========================================================== */
const Stripe = require('stripe');
const catalog = require('../../js/catalog.js');

const MAX_QTY = 10;     // per line
const MAX_LINES = 30;   // Stripe allows up to 100

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body)
});

function findProduct(id) {
  if (id === catalog.MYSTERY.id) return catalog.MYSTERY;
  return catalog.PRODUCTS.find((p) => p.id === id);
}

// Turns the bag into Stripe line items. Throws a readable message if anything is off.
function buildLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Your bag is empty.');
  if (items.length > MAX_LINES) throw new Error('Too many different items in one order.');

  let subtotal = 0;
  const lines = items.map((it) => {
    const p = findProduct(String(it.id || ''));
    if (!p) throw new Error('One of the items in your bag is no longer available.');
    if (p.soldOut) throw new Error(`${p.name} is sold out. Please remove it from your bag.`);

    const color = p.colors.find((c) => c.n === it.color);
    if (!color) throw new Error(`Please pick the ${p.name} colour again.`);

    const sizes = p.shape === 'cap' ? ['One size'] : catalog.SIZES;
    if (!sizes.includes(it.size)) throw new Error(`Please pick the ${p.name} size again.`);
    if ((p.soldSizes || []).includes(it.size)) throw new Error(`${p.name} in ${it.size} is sold out.`);

    const qty = Number(it.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new Error(`Quantity for ${p.name} must be 1–${MAX_QTY}.`);

    subtotal += p.price * qty;
    return {
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(p.price * 100),            // Stripe uses cents
        product_data: {
          name: p.name,
          description: `${color.n} / ${it.size}`,
          metadata: { product_id: p.id, color: color.n, size: it.size }
        }
      }
    };
  });
  return { lines, subtotal };
}

function shippingOptions(subtotal) {
  const S = catalog.SHIPPING;
  const standard = subtotal >= S.freeOver ? 0 : S.standard;
  const rate = (name, dollars, min, max) => ({
    shipping_rate_data: {
      type: 'fixed_amount',
      display_name: name,
      fixed_amount: { amount: Math.round(dollars * 100), currency: 'usd' },
      delivery_estimate: {
        minimum: { unit: 'business_day', value: min },
        maximum: { unit: 'business_day', value: max }
      }
    }
  });
  return [
    rate(standard === 0 ? 'Free standard shipping' : 'Standard shipping', standard, 4, 6),
    rate('Express shipping', S.express, 1, 2)
  ];
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json(500, { error: 'Payments are not set up yet (STRIPE_SECRET_KEY is missing in Netlify).' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Bad request.' }); }

  let built;
  try { built = buildLineItems(body.items); } catch (e) { return json(400, { error: e.message }); }

  // Where Stripe sends the shopper back to. Netlify sets URL to the live site address.
  const site = (process.env.URL || event.headers.origin || `https://${event.headers.host}`).replace(/\/$/, '');

  try {
    const stripe = Stripe(key);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: built.lines,
      shipping_address_collection: { allowed_countries: catalog.SHIPPING.countries },
      shipping_options: shippingOptions(built.subtotal),
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      automatic_tax: { enabled: process.env.STRIPE_TAX === 'on' },
      success_url: `${site}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/cart.html`,
      metadata: {
        // a short, readable summary that shows on the payment in your Stripe dashboard
        order: body.items.map((i) => `${i.qty}x ${i.id} ${i.color} ${i.size}`).join(', ').slice(0, 490)
      }
    });
    return json(200, { url: session.url });
  } catch (e) {
    console.error('Stripe error:', e.message);
    return json(502, { error: 'Could not start checkout. Please try again in a moment.' });
  }
};

// exported for the local test script
exports._buildLineItems = buildLineItems;
exports._shippingOptions = shippingOptions;
