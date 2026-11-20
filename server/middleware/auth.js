import { isAdminRequest } from '../services/auth.service.js';
import { httpError } from '../utils/httpError.js';

/** Only a signed-in admin may continue. */
export function requireAdmin(req, res, next) {
  if (!isAdminRequest(req)) return next(httpError(401, 'Please sign in as admin again.'));
  next();
}
