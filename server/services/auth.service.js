import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { LoginAttempt } from '../models/index.js';
import { httpError } from '../utils/httpError.js';
import { audit, clientIp } from './audit.service.js';

// One shared admin account:
//   ADMIN_EMAIL          the login email
//   ADMIN_PASSWORD_HASH  a bcrypt hash made by `npm run admin:password` (the password is never stored)
//   JWT_SECRET           signs the session cookie

export const COOKIE = 'artisol_admin';
const SESSION_DAYS = 7;
const MAX_PER_IP = 8; // failed attempts from one address in 15 minutes
const MAX_TOTAL = 30; // failed attempts from all addresses in 15 minutes (slows spread-out guessing)
const JWT_OPTS = { issuer: 'artisol-api', audience: 'artisol-admin' };

// A fake hash to compare against when the email is wrong, so both cases take the same time.
const DUMMY_HASH = bcrypt.hashSync('not-the-password', 10);

// Sessions carry a fingerprint of the current password hash: changing the password signs everyone out.
const passwordVersion = (cfg) => crypto.createHash('sha256').update(cfg.passwordHash).digest('base64url').slice(0, 16);

const sameText = (a, b) =>
  crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(), crypto.createHash('sha256').update(b).digest());

function requireConfig() {
  const cfg = env.admin;
  if (!cfg) throw httpError(503, 'Admin login is not set up on the server yet. See the README, “Admin controls”.');
  return cfg;
}

export function cookieOptions(req, maxAgeSeconds) {
  const secure = env.isProd || req.secure || req.get('x-forwarded-proto') === 'https';
  return `Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`;
}

/** Check email and password; on success returns a signed session token. */
export async function login(req, email, password) {
  const cfg = requireConfig();
  const ip = clientIp(req);
  const since = new Date(Date.now() - 15 * 60 * 1000);

  const [fromIp, total] = await Promise.all([
    LoginAttempt.countDocuments({ ip, at: { $gt: since } }),
    LoginAttempt.countDocuments({ at: { $gt: since } }),
  ]);
  if (fromIp >= MAX_PER_IP) throw httpError(429, 'Too many attempts. Please wait 15 minutes and try again.');
  if (total >= MAX_TOTAL) throw httpError(429, 'Admin sign-in is paused for a few minutes after many failed attempts.');

  const emailOk = sameText(String(email || '').trim().toLowerCase(), cfg.email);
  const passwordOk = await bcrypt.compare(String(password || ''), emailOk ? cfg.passwordHash : DUMMY_HASH);

  if (!emailOk || !passwordOk) {
    await LoginAttempt.create({ ip });
    audit(req, 'login-failed');
    throw httpError(401, 'That email and password combination is not right.');
  }

  await LoginAttempt.deleteMany({ ip });
  audit(req, 'login');
  return jwt.sign({ sub: 'admin', pv: passwordVersion(cfg) }, cfg.jwtSecret, {
    ...JWT_OPTS,
    algorithm: 'HS256',
    expiresIn: `${SESSION_DAYS}d`,
  });
}

export const sessionMaxAge = SESSION_DAYS * 24 * 60 * 60;

/** True when the request carries a valid, current admin session cookie. */
export function isAdminRequest(req) {
  const cfg = env.admin;
  if (!cfg) return false;
  const token = readCookie(req, COOKIE);
  if (!token) return false;
  try {
    const data = jwt.verify(token, cfg.jwtSecret, { ...JWT_OPTS, algorithms: ['HS256'] });
    return data.sub === 'admin' && data.pv === passwordVersion(cfg);
  } catch {
    return false;
  }
}

function readCookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}
