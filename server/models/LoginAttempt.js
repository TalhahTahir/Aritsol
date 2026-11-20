import mongoose from 'mongoose';

/** Failed admin sign-ins, used to lock out guessing. Each record deletes itself after 15 minutes. */
const loginAttemptSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, index: true },
    at: { type: Date, default: Date.now, expires: 15 * 60 },
  },
  { versionKey: false }
);

export const LoginAttempt = mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', loginAttemptSchema, 'login_attempts');
