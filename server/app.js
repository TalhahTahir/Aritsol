import express from 'express';
import routes from './routes/index.js';
import { corsPolicy, securityHeaders } from './middleware/security.js';
import { errorHandler, notFound } from './middleware/error.js';

// ─────────────────────────────────────────────────────────────
// The ARTISOL API (Express + Mongoose + Cloudinary). Every route lives under /api.
// On Vercel it runs as one serverless function (api/index.js);
// locally `npm run dev` runs it on port 3001 and Vite forwards /api to it.
// ─────────────────────────────────────────────────────────────

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // behind Vercel's proxy: use the real client address for rate limits

app.use(securityHeaders);
app.use('/api', corsPolicy);
app.use('/api', routes);
app.use('/api', notFound);
app.use(errorHandler);

export default app;
