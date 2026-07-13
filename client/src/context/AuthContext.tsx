import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import api, { TOKEN_STORAGE_KEY, getApiErrorMessage } from '../lib/api';
import type {
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  User,
} from '../types/auth.types';

const USER_STORAGE_KEY = 'eloura_user';

/** Everything the rest of the app can read/do with auth state. */
export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  /** Update the cached credit balance (e.g. after a generation). */
  setCredits: (credits: number) => void;
  /** Patch any subset of the cached user (e.g. credits + plan after payment). */
  patchUser: (patch: Partial<User>) => void;
}

/**
 * Typed context seeded with `null`. Consuming through the `useAuth` hook
 * guarantees a non-null value, so components never guard for uninitialised
 * state.
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/** Read the persisted user (if any) from localStorage, safely typed. */
function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Keep localStorage in sync whenever token/user change.
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  async function authenticate(
    path: '/auth/login' | '/auth/signup',
    body: LoginCredentials | SignupCredentials,
  ): Promise<void> {
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>(path, body);
      setToken(data.token);
      setUser(data.user);
    } catch (error: unknown) {
      // Re-throw a clean, typed message for the form to display.
      throw new Error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    await authenticate('/auth/login', credentials);
  }

  async function signup(credentials: SignupCredentials): Promise<void> {
    await authenticate('/auth/signup', credentials);
  }

  function logout(): void {
    setToken(null);
    setUser(null);
  }

  function setCredits(credits: number): void {
    setUser((prev) => (prev ? { ...prev, credits } : prev));
  }

  function patchUser(patch: Partial<User>): void {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      signup,
      logout,
      setCredits,
      patchUser,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Strongly-typed consumer hook — throws if used outside the provider. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
