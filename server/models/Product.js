import mongoose from 'mongoose';
import { contentOptions, image, key, order, tags, text, url } from './_shared.js';

/** A SaaS product ARTISOL owns. Each one links out to its own website. */
const productSchema = new mongoose.Schema(
  {
    id: { ...key(), unique: true }, // used as the #anchor on the Products page
    name: text(80, true),
    status: { type: String, enum: ['live', 'beta', 'soon'], default: 'soon' },
    url: url(),
    image: image(),
    oneLiner: text(160, true),
    description: text(1200, true),
    audience: text(160),
    highlights: tags(8),
    order,
  },
  contentOptions
);

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');
