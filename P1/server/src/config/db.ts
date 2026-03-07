// src/config/db.ts
// MongoDB connection with automatic retry on failure.
// Exported as connectDB() — called once at server startup.

import mongoose from 'mongoose';
import dotenv   from 'dotenv';

dotenv.config();

const MAX_RETRIES  = 5;
const RETRY_DELAY  = 5000; // ms

async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS:          45000,
    });

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB attempt ${attempt} failed: ${(err as Error).message}`);

    if (attempt < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY));
      return connectWithRetry(attempt + 1);
    }

    console.error('💀 Max retries reached. Shutting down.');
    process.exit(1);
  }
}

export async function connectDB(): Promise<void> {
  await connectWithRetry();

  // Log connection lifecycle events
  mongoose.connection.on('error',        (err) => console.error('🔴 MongoDB error:', err));
  mongoose.connection.on('disconnected', ()    => console.warn ('⚠️  MongoDB disconnected'));
  mongoose.connection.on('reconnected',  ()    => console.log  ('🟢 MongoDB reconnected'));

  // Graceful shutdown on Ctrl+C
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed (SIGINT)');
    process.exit(0);
  });
}
