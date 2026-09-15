import express from 'express';
import crypto from 'crypto';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 4242;

// Paystack sends webhooks as JSON. Keep this route on the raw body so the
// HMAC-SHA512 signature can be verified against the exact bytes received.
app.post('/api/paystack/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!signature || !secret) return res.sendStatus(401);

  const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex');
  if (hash !== signature) return res.sendStatus(401);

  const event = JSON.parse(req.body.toString('utf8'));
  console.log('[Paystack webhook]', event.event, event.data?.reference || '');

  // Phase 1: acknowledge the event.
  // Phase 2: persist entitlement/subscription in the database.
  return res.sendStatus(200);
});

app.use(express.json());

const plans = {
  pro: {
    name: 'THREESIXTYFX Pro',
    amount: Number(process.env.PRO_PRICE_ZAR || 69900),
    currency: 'ZAR',
    billing: 'monthly'
  },
  lifetime: {
    name: 'THREESIXTYFX Lifetime',
    amount: Number(process.env.LIFETIME_PRICE_ZAR || 199900),
    currency: 'ZAR',
    billing: 'one_time'
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'THREESIXTYFX API' });
});

app.get('/api/plans', (_req, res) => {
  res.json({
    pro: { ...plans.pro, amount_major: plans.pro.amount / 100 },
    lifetime: { ...plans.lifetime, amount_major: plans.lifetime.amount / 100 }
  });
});

app.post('/api/paystack/initialize', async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!plans[plan]) return res.status(400).json({ error: 'Invalid plan.' });
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY is not configured.' });
    }
    if (!process.env.PAYSTACK_CALLBACK_URL) {
      return res.status(500).json({ error: 'PAYSTACK_CALLBACK_URL is not configured.' });
    }

    const p = plans[plan];
    const reference = `TFX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: String(p.amount),
        currency: p.currency,
        reference,
        callback_url: process.env.PAYSTACK_CALLBACK_URL,
        metadata: {
          product: plan,
          product_name: p.name,
          billing: p.billing
        }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(400).json({ error: data.message || 'Paystack initialization failed.' });
    }

    res.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
      plan,
      amount: p.amount,
      currency: p.currency
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Payment initialization failed.' });
  }
});

app.get('/api/paystack/verify/:reference', async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY is not configured.' });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(req.params.reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    // IMPORTANT: Phase 2 will compare the verified amount/currency and then
    // grant the entitlement exactly once in the database.
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
});

app.listen(PORT, () => console.log(`THREESIXTYFX API running on port ${PORT}`));