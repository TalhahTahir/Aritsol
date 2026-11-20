import mongoose from 'mongoose';
import { contentOptions, order, text } from './_shared.js';

/** One step of the workflow ("How a project runs"). */
const processStepSchema = new mongoose.Schema(
  {
    title: text(60, true),
    desc: text(400, true),
    order,
  },
  contentOptions
);

export const ProcessStep = mongoose.models.ProcessStep || mongoose.model('ProcessStep', processStepSchema, 'process');
