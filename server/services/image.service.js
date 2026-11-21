import { Readable } from 'node:stream';
import { getCloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { httpError } from '../utils/httpError.js';
import { Product, Work } from '../models/index.js';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // Vercel accepts request bodies up to 4.5 MB
const FOLDERS = ['work', 'products', 'practices', 'misc'];

// Check the file really is an image by its first bytes, not by what the browser claims.
const SIGNATURES = [
  { type: 'png', test: (b) => b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG' },
  { type: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'gif', test: (b) => b.toString('ascii', 0, 4) === 'GIF8' },
  { type: 'webp', test: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  { type: 'avif', test: (b) => b.toString('ascii', 4, 12) === 'ftypavif' },
];

/** Upload an image to Cloudinary. Returns a delivery URL with automatic format and quality. */
export async function uploadImage(buffer, folder = 'misc') {
  const cloudinary = getCloudinary();
  if (!cloudinary) {
    throw httpError(503, 'Image uploads are not set up yet (Cloudinary). Paste an image link instead, or add the Cloudinary keys.');
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw httpError(400, 'No image received.');
  if (buffer.length > MAX_IMAGE_BYTES) throw httpError(413, 'Image is too large (4 MB maximum).');
  if (!SIGNATURES.some((s) => s.test(buffer))) throw httpError(415, 'Please upload a PNG, JPG, WebP, GIF or AVIF image.');

  const base = env.cloudinary.folder;
  const sub = FOLDERS.includes(folder) ? folder : 'misc';
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${base}/${sub}`,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
        // keep originals reasonable: never larger than 2000px on the long side
        transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
      },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    Readable.from(buffer).pipe(stream);
  }).catch((err) => {
    console.error('Cloudinary upload failed:', err?.message || err);
    throw httpError(502, 'The image could not be uploaded. Please try again.');
  });

  // f_auto,q_auto: Cloudinary serves WebP/AVIF at a sensible quality to each browser
  const url = result.secure_url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
  return { url, publicId: result.public_id, width: result.width, height: result.height };
}

/** Our Cloudinary public id inside a delivery URL, or null for any other link. */
export function publicIdFromUrl(url) {
  const cfg = env.cloudinary;
  if (!cfg || !url) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.hostname !== 'res.cloudinary.com') return null;
  const parts = u.pathname.split('/').filter(Boolean); // [cloud, image, upload, ...transforms, v123, folder..., file.ext]
  if (parts[0] !== cfg.cloudName || parts[1] !== 'image' || parts[2] !== 'upload') return null;
  const rest = parts.slice(3);
  const v = rest.findIndex((p) => /^v\d+$/.test(p));
  const idParts = v >= 0 ? rest.slice(v + 1) : rest.filter((p) => !p.includes(','));
  const id = decodeURIComponent(idParts.join('/')).replace(/\.[a-z0-9]+$/i, '');
  return id.startsWith(`${cfg.folder}/`) ? id : null; // only ever delete images this site uploaded
}

/** Delete an uploaded image from Cloudinary once no product or project uses it. */
export async function releaseImage(url) {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  const counts = await Promise.all([
    Product.countDocuments({ image: url }),
    Work.countDocuments({ image: url }),
    Work.countDocuments({ gallery: url }), // matches when the gallery list contains it
  ]);
  if (counts.some((n) => n > 0)) return;
  try {
    await getCloudinary()?.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch (err) {
    console.warn('Cloudinary delete failed for', publicId, err?.message || err); // not worth failing the request
  }
}
