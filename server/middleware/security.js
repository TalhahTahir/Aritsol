import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { httpError } from '../utils/httpError.js';

/** Secure HTTP headers. The API only returns JSON and images, so the policy can be very strict. */
export const securityHeaders = helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'same-origin' },
});

/**
 * Cross-origin access. The site and API share one domain, so by default no other site may call the
 * API from a browser. Add domains to CORS_ORIGINS only if the front end is hosted elsewhere.
 */
export const corsPolicy = cors((req, cb) => {
  const origin = req.get('origin');
  const allowed = !!origin && env.corsOrigins.includes(origin);
  cb(null, allowed ? { origin: true, credentials: true, allowedHeaders: ['content-type', 'x-artisol-admin'] } : { origin: false });
});

/**
 * Changes must come from this site (or an allowed origin) and carry the X-Artisol-Admin header.
 * Browsers will not attach that header to a cross-site request without CORS permission,
 * which blocks cross-site request forgery even before the SameSite cookie rule does.
 */
export function sameSiteOnly(req, res, next) {
  if (req.get('x-artisol-admin') !== '1') return next(httpError(403, 'Missing admin request header.'));
  const origin = req.get('origin');
  if (origin && !env.corsOrigins.includes(origin)) {
    let host = '';
    try {
      host = new URL(origin).host;
    } catch {
      /* malformed origin */
    }
    if (host !== req.get('host')) return next(httpError(403, 'Requests from other sites are not allowed.'));
  }
  next();
}

/**
 * Strips MongoDB operators ($gt, $where…) and dotted keys from anything a client sends,
 * so request data can never turn into a query operator.
 */
export function stripMongoOperators(req, res, next) {
  const clean = (v, depth = 0) => {
    if (depth > 8 || v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map((x) => clean(x, depth + 1));
    if (Buffer.isBuffer(v)) return v;
    const out = {};
    for (const [k, x] of Object.entries(v)) {
      if (k.startsWith('$') || k.includes('.') || k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      out[k] = clean(x, depth + 1);
    }
    return out;
  };
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) req.body = clean(req.body);
  next();
}

const limitMessage = (msg) => ({ error: msg });

/** Burst protection for sign-in (on top of the database lockout in auth.service.js). */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Too many sign-in attempts. Please wait a few minutes.'),
});

/** Admin changes: generous for real use, stops runaway scripts. */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Too many changes in a short time. Please wait a few minutes.'),
});

/** Public reads. */
export const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 240,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Too many requests. Please slow down.'),
});

export const noStore = (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
