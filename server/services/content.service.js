import mongoose from 'mongoose';
import { LIST_TYPES, TYPES, sanitize, slugify } from '../../shared/schema.js';
import { practices as seedPractices } from '../../src/data/practices.js';
import { products as seedProducts } from '../../src/data/products.js';
import { work as seedWork } from '../../src/data/work.js';
import { process as seedProcess } from '../../src/data/studio.js';
import { Meta, Practice, ProcessStep, Product, Work } from '../models/index.js';
import { httpError } from '../utils/httpError.js';
import { releaseImage } from './image.service.js';

// type in the URL → Mongoose model
const MODELS = { products: Product, work: Work, practices: Practice, process: ProcessStep };
const SEED = { products: seedProducts, work: seedWork, practices: seedPractices, process: seedProcess };
const HIDDEN = '-createdAt -updatedAt'; // the public site does not need these

export function modelFor(type, { list = false } = {}) {
  if (!(list ? LIST_TYPES : Object.keys(MODELS)).includes(type)) throw httpError(404, 'Unknown content type.');
  return MODELS[type];
}

const checkId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Item not found.');
  return id;
};

const invalid = (fields) => httpError(400, 'Please fix the highlighted fields.', { fields });

/** Clean the input with the shared rules (friendly messages), before Mongoose validates it again. */
function clean(type, input) {
  const { value, errors } = sanitize(type, input);
  if (Object.keys(errors).length) throw invalid(errors);
  return value;
}

// ── first run: copy the built-in content into an empty database ──────────

export async function ensureSeeded() {
  if (await Meta.exists({ _id: 'seeded' })) return;
  try {
    await Meta.create({ _id: 'seeded', value: true }); // whoever creates this first does the copying
  } catch (err) {
    if (err?.code === 11000) return;
    throw err;
  }
  for (const [type, Model] of Object.entries(MODELS)) {
    if ((await Model.countDocuments({})) > 0) continue;
    const { key, titleField } = TYPES[type];
    const docs = SEED[type].map((item, i) => {
      const { value } = sanitize(type, item);
      if (key) value[key] = item[key] || slugify(item[titleField]);
      return { ...value, order: i };
    });
    if (docs.length) await Model.insertMany(docs);
  }
}

// ── read ──────────────────────────────────────────────────────

export async function getAll() {
  await ensureSeeded();
  const entries = await Promise.all(
    Object.entries(MODELS).map(async ([type, Model]) => [
      type,
      await Model.find({}).sort({ order: 1, _id: 1 }).select(HIDDEN).lean(),
    ])
  );
  return Object.fromEntries(entries);
}

// ── write ─────────────────────────────────────────────────────

/** Set the URL id (from the name if empty) and make it unique: name, name-2, name-3… */
async function assignKey(type, value, selfId) {
  const { key, titleField } = TYPES[type];
  const Model = MODELS[type];
  const base = value[key] || slugify(value[titleField]) || type.replace(/s$/, '');
  for (let n = 1; n < 200; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const filter = selfId ? { [key]: candidate, _id: { $ne: selfId } } : { [key]: candidate };
    if (!(await Model.exists(filter))) {
      value[key] = candidate;
      return;
    }
  }
  throw httpError(409, 'Could not find a free URL id. Please set one yourself.');
}

async function checkPractice(type, value) {
  if (type === 'work' && !(await Practice.exists({ slug: value.practice }))) {
    throw invalid({ practice: 'Choose one of the services.' });
  }
}

export async function createItem(type, input) {
  const Model = modelFor(type, { list: true });
  const value = clean(type, input);
  await checkPractice(type, value);
  await assignKey(type, value);
  const last = await Model.findOne({}).sort({ order: -1 }).select('order').lean();
  const doc = await Model.create({ ...value, order: (last?.order ?? -1) + 1 });
  return doc.toObject();
}

export async function updateItem(type, id, input) {
  const Model = modelFor(type, { list: true });
  checkId(id);
  const before = await Model.findById(id).lean();
  if (!before) throw httpError(404, 'Item not found. It may have been deleted.');

  const value = clean(type, input);
  await checkPractice(type, value);
  await assignKey(type, value, before._id);
  const after = await Model.findByIdAndUpdate(id, { $set: value }, { new: true, runValidators: true }).lean();

  // a service's URL id changed: keep its projects pointing at it
  if (type === 'practices' && before.slug !== after.slug) {
    await Work.updateMany({ practice: before.slug }, { $set: { practice: after.slug } });
  }
  if (before.image && before.image !== after.image) await releaseImage(before.image);
  return after;
}

export async function deleteItem(type, id) {
  const Model = modelFor(type, { list: true });
  checkId(id);
  const before = await Model.findById(id).lean();
  if (!before) throw httpError(404, 'Item not found. It may already be deleted.');
  if (type === 'practices') {
    const inUse = await Work.countDocuments({ practice: before.slug });
    if (inUse) {
      throw httpError(409, `${inUse} project${inUse > 1 ? 's use' : ' uses'} this service. Move ${inUse > 1 ? 'them' : 'it'} to another service first.`);
    }
  }
  await Model.deleteOne({ _id: before._id });
  if (before.image) await releaseImage(before.image);
  return before;
}

export async function reorder(type, ids) {
  const Model = modelFor(type, { list: true });
  if (!Array.isArray(ids) || ids.length > 500) throw httpError(400, 'Send the new order as a list of ids.');
  ids.forEach(checkId);
  await Promise.all(ids.map((id, i) => Model.updateOne({ _id: id }, { $set: { order: i } })));
}

/** The workflow is edited as one list: the saved list replaces the old one. */
export async function replaceProcess(steps) {
  if (!Array.isArray(steps) || steps.length === 0) throw invalid({ steps: 'Add at least one step.' });
  if (steps.length > 12) throw invalid({ steps: 'Keep it to 12 steps or fewer.' });
  const errors = {};
  const cleanSteps = steps.map((step, i) => {
    const r = sanitize('process', step);
    Object.entries(r.errors).forEach(([k, msg]) => (errors[`${i}.${k}`] = msg));
    return { ...r.value, order: i };
  });
  if (Object.keys(errors).length) throw invalid(errors);
  await ProcessStep.deleteMany({});
  await ProcessStep.insertMany(cleanSteps);
  return ProcessStep.find({}).sort({ order: 1 }).select(HIDDEN).lean();
}
