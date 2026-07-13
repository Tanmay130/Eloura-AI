import type { UserPlan } from './auth.types';

/** Response from POST /api/payments/order. */
export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: string;
}

/** Response from POST /api/payments/verify. */
export interface VerifyResponse {
  credits: number;
  plan: UserPlan;
}

/* ---- Razorpay checkout SDK types (loaded via <script> in index.html) ---- */

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
}

export interface RazorpayInstance {
  open: () => void;
}

export type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;
