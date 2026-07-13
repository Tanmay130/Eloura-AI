import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

/**
 * The payload we embed in every access token. Kept intentionally small —
 * never store sensitive fields (password, plan internals) in a JWT.
 */
export interface JwtUserPayload {
  id: string;
  email: string;
}

/** Fail fast at boot if the signing secret is not configured. */
const JWT_SECRET: Secret = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return secret;
})();

const JWT_EXPIRES_IN: NonNullable<SignOptions['expiresIn']> =
  (process.env.JWT_EXPIRES_IN ?? '7d') as NonNullable<SignOptions['expiresIn']>;

/** Sign a typed payload into a JWT. */
export function signToken(payload: JwtUserPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify a token and return the typed payload.
 * Throws (JsonWebTokenError / TokenExpiredError) on any failure — callers
 * are expected to catch and translate to a 401.
 */
export function verifyToken(token: string): JwtUserPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Unexpected string token payload');
  }
  return { id: String(decoded['id']), email: String(decoded['email']) };
}
