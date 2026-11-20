// Vercel runs this file as one serverless function for every /api/* request
// (see the rewrite in vercel.json). All the routes are in server/app.js.
export { default } from '../server/app.js';
