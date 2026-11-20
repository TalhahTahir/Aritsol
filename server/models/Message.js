import mongoose from 'mongoose';

/** A message sent through the website's contact form. */
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    company: { type: String, trim: true, maxlength: 120, default: '' },
    interest: { type: String, trim: true, maxlength: 80, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    emailed: { type: Boolean, default: false }, // false if the notification email could not be sent
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
);

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema, 'messages');
