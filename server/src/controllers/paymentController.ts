import crypto from 'node:crypto';
import type { Request, Response } from 'express';

import { User } from '../models/User';
import { Payment } from '../models/Payment';
import {
  PLANS,
  type PlanConfig,
  type CreateOrderBody,
  type CreateOrderSuccess,
  type VerifyBody,
  type VerifySuccess,
} from '../types/payment.types';

interface ErrorBody {
  error: string;
}

interface PaymentConfig {
  keyId: string;
  keySecret: string;
}

/** Read + validate Razorpay credentials. Returns null when unconfigured. */
function getPaymentConfig(): PaymentConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return null;
  }
  return { keyId, keySecret };
}

/** Constant-time string comparison to resist timing attacks. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/** MongoDB duplicate-key error (used for idempotency), without touching `any`. */
function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 11000
  );
}

/**
 * Idempotently credit a user for a payment. Inserting the Payment first (with a
 * unique paymentId) guarantees the same payment can never be credited twice —
 * a duplicate insert throws 11000 and we bail.
 * Returns the new balance, or null if already processed.
 */
async function creditUserForPayment(params: {
  userId: string;
  paymentId: string;
  orderId: string;
  plan: PlanConfig;
}): Promise<number | null> {
  try {
    await Payment.create({
      user: params.userId,
      paymentId: params.paymentId,
      orderId: params.orderId,
      plan: params.plan.id,
      credits: params.plan.credits,
      amount: params.plan.amount,
    });
  } catch (err: unknown) {
    if (isDuplicateKeyError(err)) {
      return null; // already processed — do not double-credit
    }
    throw err;
  }

  const updated = await User.findByIdAndUpdate(
    params.userId,
    { $inc: { credits: params.plan.credits }, $set: { plan: params.plan.plan } },
    { new: true },
  );
  return updated?.credits ?? null;
}

/* -------------------------------------------------------------------------- */
/*  POST /api/payments/order   (auth) — create a Razorpay order                */
/* -------------------------------------------------------------------------- */

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export async function createOrder(
  req: Request<unknown, unknown, CreateOrderBody>,
  res: Response<CreateOrderSuccess | ErrorBody>,
): Promise<void> {
  try {
    const config = getPaymentConfig();
    if (!config) {
      res.status(503).json({ error: 'Payments are not configured on this server.' });
      return;
    }
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const planId = req.body.planId;
    const plan = planId ? PLANS[planId] : undefined;
    if (!plan) {
      res.status(400).json({ error: 'Invalid plan selected' });
      return;
    }

    const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: plan.amount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { userId: req.user.id, planId: plan.id },
      }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay order failed (${response.status}): ${await response.text()}`);
    }

    const order = (await response.json()) as RazorpayOrder;
    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.keyId,
      planId: plan.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    res.status(500).json({ error: message });
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/payments/verify   (auth) — verify checkout signature + credit    */
/* -------------------------------------------------------------------------- */

export async function verifyPayment(
  req: Request<unknown, unknown, VerifyBody>,
  res: Response<VerifySuccess | ErrorBody>,
): Promise<void> {
  try {
    const config = getPaymentConfig();
    if (!config) {
      res.status(503).json({ error: 'Payments are not configured on this server.' });
      return;
    }
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      res.status(400).json({ error: 'Missing payment verification fields' });
      return;
    }

    const plan = PLANS[planId];
    if (!plan) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    // Razorpay checkout signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expected = crypto
      .createHmac('sha256', config.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!safeEqual(expected, razorpay_signature)) {
      res.status(400).json({ error: 'Payment signature verification failed' });
      return;
    }

    await creditUserForPayment({
      userId: req.user.id,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      plan,
    });

    const user = await User.findById(req.user.id);
    res.status(200).json({ credits: user?.credits ?? 0, plan: plan.plan });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment verification failed';
    res.status(500).json({ error: message });
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/payments/webhook   (public, signature-verified)                  */
/* -------------------------------------------------------------------------- */

interface RazorpayWebhookEvent {
  event: string;
  payload: {
    payment?: {
      entity?: {
        id: string;
        order_id: string;
        notes?: { userId?: string; planId?: string };
      };
    };
  };
}

export async function webhook(req: Request, res: Response): Promise<void> {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const raw = req.rawBody;

    if (!secret || !raw || typeof signature !== 'string') {
      res.status(400).json({ error: 'Invalid webhook request' });
      return;
    }

    // Webhook signature = HMAC_SHA256(rawBody, webhook_secret)
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (!safeEqual(expected, signature)) {
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }

    const event = JSON.parse(raw.toString('utf8')) as RazorpayWebhookEvent;
    if (event.event === 'payment.captured') {
      const entity = event.payload.payment?.entity;
      const planId = entity?.notes?.planId;
      const userId = entity?.notes?.userId;
      const plan = planId ? PLANS[planId] : undefined;
      if (entity && userId && plan) {
        await creditUserForPayment({
          userId,
          paymentId: entity.id,
          orderId: entity.order_id,
          plan,
        });
      }
    }

    res.status(200).json({ received: true });
  } catch {
    // Always 200 on internal errors so Razorpay doesn't infinitely retry a
    // request we've already accepted the signature for.
    res.status(200).json({ received: true });
  }
}
