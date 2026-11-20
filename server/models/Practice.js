import mongoose from 'mongoose';
import { contentOptions, key, order, tags, text } from './_shared.js';

/** A service practice, with its own page at /services/<slug>. */
const subServiceSchema = new mongoose.Schema(
  {
    name: text(80, true),
    desc: text(400),
  },
  { _id: false }
);

const practiceSchema = new mongoose.Schema(
  {
    slug: { ...key(), unique: true },
    name: text(100, true),
    short: text(40, true),
    summary: text(600, true),
    fit: text(300),
    services: {
      type: [subServiceSchema],
      default: [],
      validate: { validator: (a) => a.length <= 16, message: 'Up to 16 sub-services.' },
    },
    stack: tags(20),
    deliverables: tags(12, 160),
    order,
  },
  contentOptions
);

export const Practice = mongoose.models.Practice || mongoose.model('Practice', practiceSchema, 'practices');
