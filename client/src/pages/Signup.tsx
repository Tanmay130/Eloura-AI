import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Spinner';
import type { SignupCredentials } from '../types/auth.types';

export function Signup(): JSX.Element {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<SignupCredentials>({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  }

  return (
    <main className="min-h-screen bg-[#030303] text-neutral-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-md p-8 shadow-2xl"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Start generating with 10 free credits.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-neutral-400 mb-1.5">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Tanmay"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 px-3.5 py-2.5 text-sm placeholder:text-neutral-600 outline-none transition focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-neutral-400 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 px-3.5 py-2.5 text-sm placeholder:text-neutral-600 outline-none transition focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-neutral-400 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 px-3.5 py-2.5 text-sm placeholder:text-neutral-600 outline-none transition focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black font-medium py-2.5 text-sm transition hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="text-neutral-200 hover:text-white underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default Signup;
