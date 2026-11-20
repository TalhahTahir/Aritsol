import { uploadImage } from '../services/image.service.js';
import { audit } from '../services/audit.service.js';

/** POST /api/images?folder=work  (body: the image file) */
export async function upload(req, res) {
  const result = await uploadImage(req.body, String(req.query.folder || 'misc'));
  audit(req, 'upload', { type: 'images', title: result.publicId });
  res.status(201).json(result);
}
