// Validation rules shared by the content models. (The admin forms use shared/schema.js
// for friendly messages first; these rules are the database's own last line of defence.)

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const WEB_URL = /^https?:\/\/[^\s<>"']+$/i;
export const IMAGE_URL = /^(https:\/\/[^\s<>"']+|\/[^\s<>"'/\\][^\s<>"']*)$/i; // https link or a file in /public

export const text = (max, required = false) => ({
  type: String,
  trim: true,
  maxlength: [max, `Keep this under ${max} characters.`],
  default: '',
  ...(required ? { required: [true, 'This field is required.'] } : {}),
});

export const url = () => ({
  type: String,
  trim: true,
  default: '',
  maxlength: 500,
  validate: { validator: (v) => !v || WEB_URL.test(v), message: 'Use a full link starting with https://' },
});

export const image = () => ({
  type: String,
  trim: true,
  default: '',
  maxlength: 500,
  validate: { validator: (v) => !v || IMAGE_URL.test(v), message: 'Use an uploaded image or an https:// link.' },
});

export const tags = (maxItems, maxLen = 80) => ({
  type: [{ type: String, trim: true, maxlength: maxLen }],
  default: [],
  validate: { validator: (a) => a.length <= maxItems, message: `Up to ${maxItems} items.` },
});

export const key = () => ({
  type: String,
  required: true,
  trim: true,
  maxlength: 60,
  match: [SLUG, 'Use lowercase letters, numbers and dashes.'],
});

// Every content document has a position in its list and timestamps; no __v field.
export const contentOptions = { timestamps: true, versionKey: false };
export const order = { type: Number, default: 0, index: true };
