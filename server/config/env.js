// ─────────────────────────────────────────────────────────────
// All server settings come from environment variables
// (.env locally, Vercel → Settings → Environment Variables online).
// Placeholder values such as "YOUR_CLOUD_NAME" count as "not set",
// so the site keeps working until each service is configured.
// ─────────────────────────────────────────────────────────────

const PLACEHOLDER = /(YOUR_|CHANGE_ME|<[^>]*>|xxxxx)/i;

const read = (key) => {
  const v = String(process.env[key] ?? '').trim();
  return !v || PLACEHOLDER.test(v) ? '' : v;
};

export const env = {
  get isProd() {
    return process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  },

  // MongoDB Atlas
  get mongoUri() {
    return read('MONGODB_URI');
  },
  get mongoDb() {
    return read('MONGODB_DB') || 'artisol';
  },

  // Cloudinary (image uploads)
  get cloudinary() {
    const cloudName = read('CLOUDINARY_CLOUD_NAME');
    const apiKey = read('CLOUDINARY_API_KEY');
    const apiSecret = read('CLOUDINARY_API_SECRET');
    return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret, folder: read('CLOUDINARY_FOLDER') || 'artisol' } : null;
  },

  // The one admin account
  get admin() {
    const email = read('ADMIN_EMAIL').toLowerCase();
    const passwordHash = read('ADMIN_PASSWORD_HASH');
    const jwtSecret = read('JWT_SECRET');
    const ok = email && /^\$2[aby]\$\d{2}\$/.test(passwordHash) && jwtSecret.length >= 32;
    return ok ? { email, passwordHash, jwtSecret } : null;
  },

    // Email for the contact form (SMTP; Gmail by default)
  get mail() {
    const user = read('SMTP_USER');
    const pass = read('SMTP_PASS').replace(/\s+/g, ''); // Gmail shows app passwords w...
    if (!user || !pass) return null;
    return {
      host: read('SMTP_HOST') || 'smtp.gmail.com',
      port: Number(read('SMTP_PORT')) || 465,
      user,
      pass,
      from: read('MAIL_FROM') || user,
      to: read('CONTACT_TO') || user,
      autoReply: read('CONTACT_AUTOREPLY') === 'true',
    };
  },


  // Extra sites allowed to call the API from the browser (only needed if the
  // front end is hosted on a different domain), comma separated.
  get corsOrigins() {
    return read('CORS_ORIGINS')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean);
  },
};

/** What is configured, for the startup log (never prints secrets). */
export function configSummary() {
  return {
    database: env.mongoUri ? 'configured' : 'not set (MONGODB_URI)',
    images: env.cloudinary ? 'Cloudinary configured' : 'not set (CLOUDINARY_*): uploads off, image links still work',
    adminLogin: env.admin ? 'configured' : 'not set (run `npm run admin:password`)',
    email: env.mail ? `contact form emails go to ${env.mail.to}` : 'not set (SMTP_*): contact messages are only saved to the database',
  };
}
