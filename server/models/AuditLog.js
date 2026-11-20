import mongoose from 'mongoose';

/** A record of every admin sign-in and change. Kept for 180 days. */
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // login, login-failed, logout, create, update, delete, reorder, workflow, upload
    type: { type: String, default: '' }, // products, work, practices, process, images
    itemId: { type: String, default: '' },
    title: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    at: { type: Date, default: Date.now, expires: 180 * 24 * 60 * 60 },
  },
  { versionKey: false }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema, 'audit_log');
