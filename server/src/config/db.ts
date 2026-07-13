import mongoose from 'mongoose';

/**
 * Connect to MongoDB via Mongoose with sensible production defaults.
 * Fails fast: a rejected promise here aborts server bootstrap.
 */
export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log('[eloura] MongoDB connected.');
  });
  mongoose.connection.on('error', (err: Error) => {
    // eslint-disable-next-line no-console
    console.error('[eloura] MongoDB error:', err.message);
  });

  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: process.env.NODE_ENV !== 'production',
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  // eslint-disable-next-line no-console
  console.log('[eloura] MongoDB disconnected.');
}
