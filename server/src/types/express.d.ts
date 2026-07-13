import type { JwtUserPayload } from '../config/jwt';

/**
 * Ambient module augmentation: teach Express that a verified request may
 * carry a `user` payload. This lets middleware set `req.user` and every
 * downstream handler read it with full type-safety — no casting to `any`.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      /** Raw request body bytes — captured for webhook signature verification. */
      rawBody?: Buffer;
    }
  }
}

// Ensures this file is treated as a module so `declare global` augments
// (rather than replaces) the global scope.
export {};
