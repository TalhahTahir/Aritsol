import mongoose from 'mongoose';
import { env } from './env.js';
import { httpError } from '../utils/httpError.js';

mongoose.set('strictQuery', true); // ignore unknown fields in queries

// One connection per server instance. On Vercel the same function instance serves many
// requests, so the connection promise is kept on globalThis and reused.
const cache = (globalThis.__artisolMongoose ??= { promise: null });

export async function connectDb() {
  if (!env.mongoUri) {
    throw httpError(503, 'The database is not configured on the server yet (MONGODB_URI).');
  }
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.mongoUri, {
        dbName: env.mongoDb,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000,
        autoIndex: true, // creates the unique and expiry indexes defined in the models
      })
      .catch((err) => {
        cache.promise = null; // try again on the next request
        console.error('MongoDB connection failed:', err.message);
        throw httpError(503, 'Could not reach the database. Please try again shortly.');
      });
  }
  await cache.promise;
  return mongoose;
}

/** Express middleware: make sure the database is connected before the route runs. */
export const withDb = (req, res, next) => connectDb().then(() => next(), next);
