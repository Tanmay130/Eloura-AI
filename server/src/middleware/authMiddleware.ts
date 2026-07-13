import type { Request, Response, NextFunction } from 'express';

import { verifyToken } from '../config/jwt';

/**
 * Guards protected routes. Expects an `Authorization: Bearer <token>` header,
 * verifies the JWT, and attaches the typed payload to `req.user`.
 * Any failure short-circuits with a 401 — the handler never runs.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authorized: missing bearer token' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Not authorized: invalid or expired token' });
  }
}

export default authMiddleware;
