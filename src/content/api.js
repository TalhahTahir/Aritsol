// Small client for the ARTISOL API (/api, see server/app.js).

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

export async function api(method, path, body, { raw, type } = {}) {
  const headers = { 'x-artisol-admin': '1' };
  if (raw) headers['content-type'] = type || 'application/octet-stream';
  else if (body !== undefined) headers['content-type'] = 'application/json';

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  let data = null;
  if ((res.headers.get('content-type') || '').includes('application/json')) {
    data = await res.json().catch(() => null);
  }
  if (!res.ok) {
    // no JSON back means the request never reached our API (not running, or the host has no /api)
    const fallback = [404, 500, 502, 503, 504].includes(res.status)
      ? 'The admin server is not reachable. Locally, start everything with “npm run dev”; online, check the Vercel setup in the README.'
      : `Request failed (${res.status}).`;
    throw new ApiError(data?.error || fallback, res.status, data?.fields);
  }
  return data;
}

/** Shrinks a picked image in the browser (max 1600px, WebP) before it is uploaded. */
export async function prepareImage(file, max = 1600) {
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.type)) {
    throw new ApiError('Please choose a PNG, JPG, WebP, GIF or AVIF image.', 0);
  }
  if (file.type === 'image/gif') return file; // keep animation
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new ApiError('That image could not be read.', 0);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const toBlob = (type, q) => new Promise((r) => canvas.toBlob(r, type, q));
  let blob = await toBlob('image/webp', 0.85);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg', 0.86); // older Safari
  if (!blob) throw new ApiError('That image could not be processed.', 0);
  return blob;
}
