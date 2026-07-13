/**
 * Shared authentication types for the Eloura AI client.
 * These mirror the server's response contracts so data stays typed
 * end-to-end (server AuthUserView -> client User).
 */

export type UserPlan = 'free' | 'plus' | 'pro';

/** The authenticated user as the client knows it (no password ever). */
export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  plan: UserPlan;
}

/** Body sent to POST /api/auth/login */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Body sent to POST /api/auth/signup */
export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

/** Successful auth response from the server (signup or login). */
export interface AuthResponse {
  token: string;
  user: User;
}

/** Error shape the server returns on 4xx/5xx. */
export interface ApiErrorBody {
  error: string;
}
