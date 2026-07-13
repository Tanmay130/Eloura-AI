import axios, { type AxiosInstance } from 'axios';

import { ApiErrorBody } from '../types/auth.types';

export const TOKEN_STORAGE_KEY = 'eloura_token';

/**
 * API base URL resolution:
 *  - Local dev / single-host prod: unset → `/api`, proxied to the server by
 *    Vite (dev) or nginx (prod) on the same origin.
 *  - Split deploy (client + server on different domains, e.g. Vercel + Render):
 *    set VITE_API_BASE_URL to the server's public URL at build time.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api`
  : '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Type-safe extraction of a server error message from an unknown thrown
 * value. Uses `axios.isAxiosError` as a type guard so we never touch
 * `any` — this same pattern powers the 403 credit handling on Day 6.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export default api;
