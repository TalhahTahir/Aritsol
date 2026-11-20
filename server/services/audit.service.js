import { AuditLog } from '../models/index.js';

export const clientIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

/** Record an admin action. Never blocks or fails the request it belongs to. */
export function audit(req, action, details = {}) {
  AuditLog.create({
    action,
    type: details.type || '',
    itemId: details.itemId ? String(details.itemId) : '',
    title: String(details.title || '').slice(0, 160),
    ip: clientIp(req),
    userAgent: String(req.get?.('user-agent') || '').slice(0, 200),
  }).catch((err) => console.warn('Audit log write failed:', err.message));
}
