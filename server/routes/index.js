import express, { Router } from 'express';
import { withDb } from '../config/db.js';
import { asyncHandler as h } from '../utils/httpError.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter, noStore, readLimiter, sameSiteOnly, stripMongoOperators, writeLimiter } from '../middleware/security.js';
import * as contentCtrl from '../controllers/content.controller.js';
import * as authCtrl from '../controllers/auth.controller.js';
import * as uploadCtrl from '../controllers/upload.controller.js';
import { MAX_IMAGE_BYTES } from '../services/image.service.js';
import * as contactCtrl from '../controllers/contact.controller.js';
import { rateLimit } from 'express-rate-limit';

const json = express.json({ limit: '300kb' });
const router = Router();

// ── public ────────────────────────────────────────────────────
router.get('/health', noStore, (req, res) => res.json({ ok: true }));
router.get('/content', readLimiter, withDb, h(contentCtrl.getContent));

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'You have sent several messages already. Please wait a few minutes, or email us directly.' },
});
const sameOriginForm = (req, res, next) => {
  const origin = req.get('origin');
  if (origin && !origin.endsWith(`//${req.get('host')}`)) return res.status(403).json({ error: 'Requests from other sites are not allowed.' });
  next();
};
router.post('/contact', noStore, contactLimiter, sameOriginForm, express.json({ limit: '20kb' }), stripMongoOperators, h(contactCtrl.submit));

// ── admin session ─────────────────────────────────────────────
router.get('/auth/me', noStore, authCtrl.me);
router.post('/auth/login', noStore, loginLimiter, sameSiteOnly, json, stripMongoOperators, withDb, h(authCtrl.signIn));
router.post('/auth/logout', noStore, sameSiteOnly, authCtrl.signOut);

// ── admin changes: every route below needs the header, a valid session and the database ──
const admin = [noStore, writeLimiter, sameSiteOnly, requireAdmin];

router.post(
  '/images',
  ...admin,
  express.raw({ type: () => true, limit: MAX_IMAGE_BYTES + 1024 }),
  withDb,
  h(uploadCtrl.upload)
);
router.put('/process', ...admin, json, stripMongoOperators, withDb, h(contentCtrl.replaceProcess));
router.post('/:type/reorder', ...admin, json, stripMongoOperators, withDb, h(contentCtrl.reorder));
router.post('/:type', ...admin, json, stripMongoOperators, withDb, h(contentCtrl.create));
router.put('/:type/:id', ...admin, json, stripMongoOperators, withDb, h(contentCtrl.update));
router.delete('/:type/:id', ...admin, withDb, h(contentCtrl.remove));

export default router;
