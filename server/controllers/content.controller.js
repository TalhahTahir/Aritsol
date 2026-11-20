import { TYPES } from '../../shared/schema.js';
import * as content from '../services/content.service.js';
import { audit } from '../services/audit.service.js';

const title = (type, doc) => doc?.[TYPES[type]?.titleField] || '';

/** GET /api/content: everything the public site shows. */
export async function getContent(req, res) {
  const data = await content.getAll();
  // visitors get a copy cached for a few seconds at Vercel's edge; admins ask for a fresh one (?fresh=…)
  if (req.query.fresh) res.set('Cache-Control', 'no-store');
  else res.set('Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=600');
  res.json(data);
}

/** POST /api/:type */
export async function create(req, res) {
  const { type } = req.params;
  const doc = await content.createItem(type, req.body);
  audit(req, 'create', { type, itemId: doc._id, title: title(type, doc) });
  res.status(201).json(doc);
}

/** PUT /api/:type/:id */
export async function update(req, res) {
  const { type, id } = req.params;
  const doc = await content.updateItem(type, id, req.body);
  audit(req, 'update', { type, itemId: id, title: title(type, doc) });
  res.json(doc);
}

/** DELETE /api/:type/:id */
export async function remove(req, res) {
  const { type, id } = req.params;
  const doc = await content.deleteItem(type, id);
  audit(req, 'delete', { type, itemId: id, title: title(type, doc) });
  res.json({ deleted: id });
}

/** POST /api/:type/reorder  { ids: [...] } */
export async function reorder(req, res) {
  const { type } = req.params;
  await content.reorder(type, req.body?.ids);
  audit(req, 'reorder', { type });
  res.json({ ok: true });
}

/** PUT /api/process  { steps: [...] } */
export async function replaceProcess(req, res) {
  const steps = await content.replaceProcess(req.body?.steps);
  audit(req, 'workflow', { type: 'process', title: `${steps.length} steps` });
  res.json(steps);
}
