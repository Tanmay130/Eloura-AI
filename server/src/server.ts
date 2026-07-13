import 'dotenv/config';
import http from 'node:http';

import app from './app';
import { connectDatabase, disconnectDatabase } from './config/db';

/**
 * Read and validate an environment variable, falling back when provided.
 */
function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const PORT: number = Number(env('PORT', '5000'));
const MONGO_URI: string = env('MONGO_URI');

const server = http.createServer(app);

async function bootstrap(): Promise<void> {
  await connectDatabase(MONGO_URI);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[eloura] API listening on http://0.0.0.0:${PORT}`);
  });
}

/**
 * Gracefully drain connections on termination so orchestrators
 * (Docker / Kubernetes) can roll pods without dropping requests.
 */
async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[eloura] ${signal} received — shutting down.`);

  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  // Hard exit if graceful shutdown stalls.
  setTimeout(() => process.exit(1), 10_000).unref();
}

(['SIGINT', 'SIGTERM'] as const).forEach((signal) => {
  process.on(signal, () => {
    void shutdown(signal);
  });
});

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[eloura] Fatal bootstrap error:', error);
  process.exit(1);
});
