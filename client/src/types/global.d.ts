import type { RazorpayConstructor } from './payment.types';

/**
 * Razorpay's checkout script attaches a `Razorpay` constructor to `window`.
 * This ambient augmentation teaches TypeScript about it so `new window.Razorpay()`
 * type-checks without casting to `any`.
 */
declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export {};
