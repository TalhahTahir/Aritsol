import mongoose from 'mongoose';

/** Small key/value records the server keeps for itself (e.g. "the starting content was copied"). */
const metaSchema = new mongoose.Schema(
  {
    _id: { type: String },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const Meta = mongoose.models.Meta || mongoose.model('Meta', metaSchema, 'meta');
