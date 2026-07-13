import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

import { useAuth } from '../context/AuthContext';
import api, { getApiErrorMessage } from '../lib/api';
import { Spinner } from '../components/Spinner';
import { Skeleton } from '../components/Skeleton';
import { MeshGlow } from '../components/MeshGlow';
import {
  StyleMode,
  STYLE_LABELS,
  EXAMPLE_PROMPTS,
  type GenerateImageResponse,
} from '../types/image.types';

const STYLES: readonly StyleMode[] = Object.values(StyleMode);

export function Dashboard(): JSX.Element {
  const { user, logout, setCredits } = useAuth();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<StyleMode>(StyleMode.REALISTIC);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBusy = submitting || imageLoading;

  async function handleGenerate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (prompt.trim().length < 3) {
      setError('Prompt must be at least 3 characters');
      return;
    }
    setError(null);
    setImageUrl(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<GenerateImageResponse>('/images/generate', {
        prompt: prompt.trim(),
        style,
      });
      setImageUrl(data.imageUrl);
      setImageLoading(true); // stay in skeleton state until the <img> finishes downloading
      setCredits(data.credits); // live-update the nav counter
    } catch (err: unknown) {
      // Out of credits → the server returns 403; send the user to pricing.
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        navigate('/pricing');
        return;
      }
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#030303] text-neutral-100">
      {/* Top navigation */}
      <nav className="flex items-center justify-between border-b border-neutral-800/60 px-6 py-4">
        <span className="font-semibold tracking-tight">Eloura AI</span>
        <div className="flex items-center gap-4 text-sm">
          <Link
            to="/history"
            className="text-neutral-400 transition hover:text-white"
          >
            History
          </Link>
          <span className="rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-neutral-300">
            Credits Remaining:{' '}
            <motion.span
              key={user?.credits ?? 0}
              initial={{ scale: 1.5, color: '#ffffff' }}
              animate={{ scale: 1, color: '#d4d4d4' }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="inline-block font-semibold"
            >
              {user?.credits ?? 0}
            </motion.span>
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-neutral-300 transition hover:border-neutral-600 hover:text-white"
          >
            Log out
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
          The Studio
        </h1>
        <p className="mt-2 text-neutral-400">
          Describe what you want to see, choose a style, and generate.
        </p>

        {/* Prompt + controls */}
        <form onSubmit={handleGenerate} className="mt-8">
          <div className="rounded-2xl border border-neutral-800/60 bg-neutral-950/40 backdrop-blur-md p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A serene mountain lake at golden hour, mist rising off the water…"
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-neutral-100 placeholder:text-neutral-600 outline-none"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {/* Style chips */}
              <div className="flex flex-wrap gap-2">
                {STYLES.map((mode) => {
                  const active = mode === style;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setStyle(mode)}
                      className={[
                        'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                        active
                          ? 'border-neutral-500 bg-white text-black'
                          : 'border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white',
                      ].join(' ')}
                    >
                      {STYLE_LABELS[mode]}
                    </button>
                  );
                })}
              </div>

              {/* Generate */}
              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isBusy && <Spinner />}
                {isBusy ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Example prompts — click to fill the box */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="py-1 text-xs text-neutral-600">Try:</span>
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="rounded-full border border-neutral-800/60 px-3 py-1 text-xs text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
              >
                {example.length > 34 ? `${example.slice(0, 34)}…` : example}
              </button>
            ))}
          </div>
        </form>

        {/* Result area — fixed square stage so layers overlay cleanly */}
        <div className="relative mt-8 aspect-square w-full">
          {/* Apple-Intelligence ambient mesh glow while generating */}
          <AnimatePresence>
            {isBusy && (
              <motion.div
                key="mesh"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute -inset-6"
              >
                <MeshGlow active />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isBusy ? (
              /* Shimmering skeleton (Raycast feel) */
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Skeleton className="h-full w-full" />
              </motion.div>
            ) : !imageUrl ? (
              /* Empty state */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800/70 bg-neutral-950/30 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800/60 bg-neutral-900/50 text-neutral-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-neutral-300">Your canvas is ready</p>
                <p className="mt-1 max-w-xs text-xs text-neutral-500">
                  Write a prompt above, pick a style, and your generated image will appear here.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* The image stays mounted whenever a URL exists so onLoad fires even
              while the skeleton overlays it. */}
          {imageUrl && (
            <motion.img
              key={imageUrl}
              src={imageUrl}
              alt={prompt}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setError('The image failed to load. Please try again.');
                setImageUrl(null);
              }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: imageLoading ? 0 : 1, scale: imageLoading ? 0.98 : 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              className="absolute inset-0 h-full w-full rounded-2xl border border-neutral-800/60 object-cover"
            />
          )}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
