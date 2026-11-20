import { COOKIE, cookieOptions, isAdminRequest, login, sessionMaxAge } from '../services/auth.service.js';
import { audit } from '../services/audit.service.js';

/** GET /api/auth/me */
export function me(req, res) {
  res.json({ admin: isAdminRequest(req) });
}

/** POST /api/auth/login  { email, password } */
export async function signIn(req, res) {
  const token = await login(req, req.body?.email, req.body?.password);
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieOptions(req, sessionMaxAge)}`);
  res.json({ admin: true });
}

/** POST /api/auth/logout */
export function signOut(req, res) {
  if (isAdminRequest(req)) audit(req, 'logout');
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieOptions(req, 0)}`);
  res.json({ admin: false });
}
