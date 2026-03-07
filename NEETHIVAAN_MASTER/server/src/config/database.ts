// path: server/src/config/database.ts
// MongoDB connection with automatic retry on failure.
// Logs connection events throughout app lifecycle.

import mongoose from 'mongoose';
import { ENV }  from './env';

const MAX_RETRIES   = 5;
const RETRY_DELAY   = 5000; // 5 seconds

async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS:          45000,
    });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection attempt ${attempt} failed:`, (err as Error).message);
    if (attempt < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise(res => setTimeout(res, RETRY_DELAY));
      return connectWithRetry(attempt + 1);
    }
    console.error('💀 Max retries reached. Exiting.');
    process.exit(1);
  }
}

export async function connectDB(): Promise<void> {
  await connectWithRetry();

  mongoose.connection.on('error',        (err) => console.error('🔴 MongoDB error:',        err));
  mongoose.connection.on('disconnected', ()    => console.warn ('⚠️  MongoDB disconnected'));
  mongoose.connection.on('reconnected',  ()    => console.log  ('🟢 MongoDB reconnected'));

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed (SIGINT)');
    process.exit(0);
  });
}
