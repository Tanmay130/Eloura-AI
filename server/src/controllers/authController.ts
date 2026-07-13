import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import { User, type IUser } from '../models/User';
import { signToken } from '../config/jwt';

/* -------------------------------------------------------------------------- */
/*  Request / response contracts                                               */
/* -------------------------------------------------------------------------- */

interface SignupBody {
  name?: string;
  email?: string;
  password?: string;
}

interface LoginBody {
  email?: string;
  password?: string;
}

/** Safe, public-facing view of a user — never leaks the password hash. */
interface AuthUserView {
  id: string;
  name: string;
  email: string;
  credits: number;
  plan: string;
}

interface AuthSuccess {
  token: string;
  user: AuthUserView;
}

interface ErrorBody {
  error: string;
}

const SALT_ROUNDS = 10;

/** Map a Mongoose document to the sanitized view sent over the wire. */
function toAuthUserView(user: IUser): AuthUserView {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    credits: user.credits,
    plan: user.plan,
  };
}

/* -------------------------------------------------------------------------- */
/*  POST /api/auth/signup                                                      */
/* -------------------------------------------------------------------------- */

export async function signup(
  req: Request<unknown, unknown, SignupBody>,
  res: Response<AuthSuccess | ErrorBody>,
): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      token: signToken({ id: String(user._id), email: user.email }),
      user: toAuthUserView(user),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected signup error';
    res.status(500).json({ error: message });
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/auth/login                                                       */
/* -------------------------------------------------------------------------- */

export async function login(
  req: Request<unknown, unknown, LoginBody>,
  res: Response<AuthSuccess | ErrorBody>,
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Password is `select: false` on the schema, so re-select it explicitly.
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password',
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    res.status(200).json({
      token: signToken({ id: String(user._id), email: user.email }),
      user: toAuthUserView(user),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected login error';
    res.status(500).json({ error: message });
  }
}
