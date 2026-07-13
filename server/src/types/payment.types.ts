import type { UserPlan } from '../models/User';

/** A purchasable plan: how much it costs and what the user receives. */
export interface PlanConfig {
  id: string;
  amount: number; // in the smallest currency unit (paise for INR)
  credits: number; // credits granted on purchase
  plan: UserPlan; // the tier the user is upgraded to
}

/** Server-side catalog. Amounts are in paise (₹999 = 99900). */
export const PLANS: Record<string, PlanConfig> = {
  plus: { id: 'plus', amount: 99900, credits: 500, plan: 'plus' },
  pro: { id: 'pro', amount: 299900, credits: 2000, plan: 'pro' },
};

export interface CreateOrderBody {
  planId?: string;
}

export interface CreateOrderSuccess {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string; // public key id — safe to send to the browser
  planId: string;
}

export interface VerifyBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  planId?: string;
}

export interface VerifySuccess {
  credits: number;
  plan: UserPlan;
}
