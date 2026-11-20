import { connectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { Message } from '../models/index.js';
import { sendAutoReply, sendEnquiryEmail } from '../services/mail.service.js';
import { clientIp } from '../services/audit.service.js';
import { httpError } from '../utils/httpError.js';

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const str = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

/** POST /api/contact  { name, email, company, interest, message } */
export async function submit(req, res) {
  const b = req.body || {};

  // honeypot: a hidden field people never see; bots fill it. Pretend it worked.
  if (b.website) return res.status(201).json({ ok: true });

  const msg = {
    name: str(b.name, 100),
    email: str(b.email, 200).toLowerCase(),
    company: str(b.company, 120),
    interest: str(b.interest, 80),
    message: str(b.message, 5000),
  };
  const fields = {};
  if (!msg.name) fields.name = 'Please tell us your name.';
  if (!EMAIL.test(msg.email)) fields.email = 'That email address doesn’t look right.';
  if (msg.message.length < 10) fields.message = 'A sentence or two about the project, please.';
  if (Object.keys(fields).length) throw httpError(400, 'Please fix the highlighted fields.', { fields });

  if (!env.mongoUri && !env.mail) {
    throw httpError(503, 'The contact form is not set up on the server yet.');
  }

  // 1. keep a copy in the database, so no enquiry is ever lost
  let saved = null;
  if (env.mongoUri) {
    try {
      await connectDb();
      saved = await Message.create({ ...msg, ip: clientIp(req), userAgent: String(req.get('user-agent') || '').slice(0, 200) });
    } catch (err) {
      console.error('Saving contact message failed:', err.message);
    }
  }

  // 2. email the team (and optionally confirm to the visitor)
  let emailed = false;
  try {
    emailed = await sendEnquiryEmail(msg);
    if (emailed) await sendAutoReply(msg).catch((err) => console.warn('Auto-reply failed:', err.message));
  } catch (err) {
    console.error('Contact email failed:', err.message);
  }
  if (saved && emailed) await Message.updateOne({ _id: saved._id }, { $set: { emailed: true } }).catch(() => {});

  if (!saved && !emailed) {
    throw httpError(502, 'Your message could not be sent right now. Please email or WhatsApp us instead.');
  }
  res.status(201).json({ ok: true });
}

