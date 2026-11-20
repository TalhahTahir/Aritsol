import mongoose from 'mongoose';
import { contentOptions, image, key, order, tags, text, url } from './_shared.js';

/** A project built for a client (ARTISOL does not own it). */
const workSchema = new mongoose.Schema(
  {
    id: { ...key(), unique: true },
    title: text(120, true),
    practice: { type: String, required: true, trim: true, maxlength: 60, index: true }, // a service slug
    summary: text(600, true),
    image: image(),
    links: {
      live: url(),
      code: url(),
    },
    stack: tags(12),
    tone: { type: String, enum: ['gold', 'black', 'white'], default: 'black' },
    sample: { type: Boolean, default: false },
    order,
  },
  contentOptions
);

export const Work = mongoose.models.Work || mongoose.model('Work', workSchema, 'work');
