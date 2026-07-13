import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import api, { getApiErrorMessage } from '../lib/api';
import { Skeleton } from '../components/Skeleton';
import { GlowCard } from '../components/GlowCard';
import { STYLE_LABELS, type ImageRecord, type ImageListResponse } from '../types/image.types';

/** Varied heights so the loading skeletons read as a masonry grid. */
const SKELETON_HEIGHTS: readonly string[] = ['h-64', 'h-48', 'h-72', 'h-56', 'h-64', 'h-52'];

export function History(): JSX.Element {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const { data } = await api.get<ImageListResponse>('/images');
        if (active) {
          setImages(data.images);
        }
      } catch (err: unknown) {
        if (active) {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  function handleSearch(event: ChangeEvent<HTMLInputElement>): void {
    setSearch(event.target.value);
  }

  async function handleDelete(id: string): Promise<void> {
    setDeletingId(id);
    try {
      await api.delete(`/images/${id}`);
      setImages((prev) => prev.filter((image) => image.id !== id));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo<ImageRecord[]>(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return images;
    }
    return images.filter((image) => image.prompt.toLowerCase().includes(query));
  }, [images, search]);

  return (
    <main className="min-h-screen bg-[#030303] text-neutral-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between border-b border-neutral-800/60 px-6 py-4">
        <Link to="/dashboard" className="font-semibold tracking-tight">
          Eloura AI
        </Link>
        <Link
          to="/dashboard"
          className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-neutral-600 hover:text-white"
        >
          Back to Studio
        </Link>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
              Your history
            </h1>
            <p className="mt-2 text-neutral-400">Every image you&apos;ve generated, in one place.</p>
          </div>
          {/* Search filter */}
          <input
            type="search"
            value={search}
            onChange={handleSearch}
            placeholder="Search prompts…"
            className="w-full rounded-lg border border-neutral-800/60 bg-neutral-950/40 px-3.5 py-2.5 text-sm placeholder:text-neutral-600 outline-none transition focus:border-neutral-600 sm:w-72"
          />
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* States */}
        {loading ? (
          // Shimmering skeleton grid while the gallery loads
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {SKELETON_HEIGHTS.map((height, index) => (
              <div key={`skeleton-${index}`} className="break-inside-avoid">
                <Skeleton className={`w-full ${height}`} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm font-medium text-neutral-300">
              {images.length === 0 ? 'No images yet' : 'No matches'}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {images.length === 0 ? (
                <>
                  Head to the{' '}
                  <Link to="/dashboard" className="text-neutral-300 underline underline-offset-4">
                    Studio
                  </Link>{' '}
                  to create your first image.
                </>
              ) : (
                'Try a different search term.'
              )}
            </p>
          </div>
        ) : (
          // Masonry via CSS columns; each tile avoids breaking across columns.
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            <AnimatePresence>
              {filtered.map((image) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                  className="group break-inside-avoid"
                >
                  <GlowCard className="bg-neutral-950/40">
                    <img src={image.url} alt={image.prompt} loading="lazy" className="block w-full" />

                    {/* Overlay: prompt + style + delete */}
                    <figcaption className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-neutral-200">{image.prompt}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
                          {STYLE_LABELS[image.style]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(image.id)}
                        disabled={deletingId === image.id}
                        aria-label="Delete image"
                        className="shrink-0 rounded-lg border border-neutral-700 bg-black/50 p-2 text-neutral-300 transition hover:border-red-800 hover:text-red-400 disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                          <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </figcaption>
                  </GlowCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
}

export default History;
