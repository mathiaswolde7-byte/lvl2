/* ==========================================================
   LVL — look up a finished order for the success page
   success.html calls this with the session id Stripe adds to the
   return link, and shows the shopper what they bought.
   Only returns what the shopper already saw on Stripe's page.
   ========================================================== */
const Stripe = require('stripe');

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  const id = (event.queryStringParameters || {}).session_id || '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return json(400, { error: 'Missing or invalid order reference.' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json(500, { error: 'Payments are not set up yet.' });

  try {
    const stripe = Stripe(key);
    const s = await stripe.checkout.sessions.retrieve(id, { expand: ['line_items'] });
    return json(200, {
      paid: s.payment_status === 'paid',
      reference: 'LVL-' + s.id.slice(-8).toUpperCase(),
      email: s.customer_details ? s.customer_details.email : null,
      total: s.amount_total / 100,
      shipping: s.total_details ? s.total_details.amount_shipping / 100 : 0,
      items: (s.line_items ? s.line_items.data : []).map((li) => ({
        name: li.description, qty: li.quantity, amount: li.amount_total / 100
      }))
    });
  } catch (e) {
    console.error('Stripe error:', e.message);
    return json(404, { error: 'We could not find that order.' });
  }
};
