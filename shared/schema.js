// ─────────────────────────────────────────────────────────────
// What each editable content type contains.
// Used by the API (to validate and clean what is saved) and by the
// admin forms (to draw the fields), so the two never disagree.
//
// Field types:
//   text, textarea, url, image, select, bool,
//   list        → an array of short strings (one per line in the form)
//   objectList  → an array of small objects (e.g. sub-services: name + description)
// `path` lets a form field write into a nested property, e.g. 'links.live'.
// ─────────────────────────────────────────────────────────────

export const STATUS_OPTIONS = [
  { value: 'live', label: 'Live' },
  { value: 'beta', label: 'Public beta' },
  { value: 'soon', label: 'Launching soon' },
];

export const TONE_OPTIONS = [
  { value: 'gold', label: 'Gold' },
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
];

export const TYPES = {
  products: {
    label: 'product',
    plural: 'Products',
    key: 'id', // stable id used in URLs (#anchor on the Products page)
    titleField: 'name',
    help: 'SaaS products ARTISOL owns. Each one links out to its own website.',
    fields: [
      { name: 'name', label: 'Product name', type: 'text', required: true, max: 80, placeholder: 'e.g. TradeMind AI' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS, default: 'soon' },
      { name: 'url', label: 'Website (deployed URL)', type: 'url', placeholder: 'https://…', help: 'Leave empty to show “Site launching soon”.' },
      { name: 'image', label: 'Image', type: 'image', help: 'Optional screenshot or cover (shown on the Products page and homepage).' },
      { name: 'oneLiner', label: 'One-line pitch', type: 'text', required: true, max: 160 },
      { name: 'description', label: 'Description', type: 'textarea', required: true, max: 1200 },
      { name: 'audience', label: 'Made for', type: 'text', max: 160, placeholder: 'Who it is for' },
      { name: 'highlights', label: 'Highlights', type: 'list', max: 8, help: 'One per line, e.g. “Paper trading”.' },
      { name: 'id', label: 'URL id', type: 'slug', help: 'Optional. Made from the name if empty.' },
    ],
  },

  work: {
    label: 'project',
    plural: 'Work',
    key: 'id',
    titleField: 'title',
    help: 'Projects built for clients. Shown on the homepage, the Work page and service pages.',
    fields: [
      { name: 'title', label: 'Project name', type: 'text', required: true, max: 120 },
      { name: 'practice', label: 'Service', type: 'select', required: true, optionsFrom: 'practices', help: 'Used for filtering on the Work page.' },
      { name: 'summary', label: 'Description', type: 'textarea', required: true, max: 600 },
      { name: 'image', label: 'Image', type: 'image', help: 'Screenshot or cover, 4:3 works best (e.g. 1280×960).' },
      { name: 'live', path: 'links.live', label: 'Deployed URL', type: 'url', placeholder: 'https://…' },
      { name: 'code', path: 'links.code', label: 'Code URL', type: 'url', placeholder: 'https://github.com/…' },
      { name: 'stack', label: 'Tech stack', type: 'list', max: 12, help: 'One per line, e.g. “React”.' },
      { name: 'tone', label: 'Cover colour (when no image)', type: 'select', options: TONE_OPTIONS, default: 'black' },
      { name: 'sample', label: 'Mark as sample project', type: 'bool', default: false },
      { name: 'id', label: 'URL id', type: 'slug', help: 'Optional. Made from the name if empty.' },
    ],
  },

  practices: {
    label: 'service',
    plural: 'Services',
    key: 'slug', // the page lives at /services/<slug>
    titleField: 'name',
    help: 'Service practices. Each one has its own page at /services/<url id>.',
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, max: 100, placeholder: 'e.g. AI & Machine Learning Solutions' },
      { name: 'short', label: 'Short name', type: 'text', required: true, max: 40, help: 'Used in menus, filters and labels.' },
      { name: 'summary', label: 'Summary', type: 'textarea', required: true, max: 600 },
      { name: 'fit', label: 'A good fit when…', type: 'textarea', max: 300 },
      {
        name: 'services',
        label: 'Sub-services',
        type: 'objectList',
        max: 16,
        of: [
          { name: 'name', label: 'Name', type: 'text', required: true, max: 80 },
          { name: 'desc', label: 'Description', type: 'textarea', max: 400 },
        ],
      },
      { name: 'stack', label: 'Tools and stack', type: 'list', max: 20, help: 'One per line.' },
      { name: 'deliverables', label: 'What you get', type: 'list', max: 12, help: 'One per line.' },
      { name: 'slug', label: 'URL id', type: 'slug', help: 'Optional. Made from the name if empty. Changing it changes the page address.' },
    ],
  },

  process: {
    label: 'step',
    plural: 'Workflow',
    key: null, // edited as one ordered list
    titleField: 'title',
    help: 'How a project runs. Shown on the homepage and service pages.',
    fields: [
      { name: 'title', label: 'Step', type: 'text', required: true, max: 60 },
      { name: 'desc', label: 'Description', type: 'textarea', required: true, max: 400 },
    ],
  },
};

export const LIST_TYPES = ['products', 'work', 'practices']; // add / edit / delete one item at a time
export const ALL_TYPES = [...LIST_TYPES, 'process'];

// ── helpers ───────────────────────────────────────────────────

export const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

export const setPath = (obj, path, value) => {
  const keys = path.split('.');
  let o = obj;
  keys.slice(0, -1).forEach((k) => {
    if (typeof o[k] !== 'object' || o[k] === null) o[k] = {};
    o = o[k];
  });
  o[keys.at(-1)] = value;
  return obj;
};

const WEB_URL = /^https?:\/\/[^\s<>"']+$/i;
const SECURE_URL = /^https:\/\/[^\s<>"']+$/i; // images must be https so they load on the live (https) site
const LOCAL_PATH = /^\/[^\s<>"'/\\][^\s<>"']*$/; // files in /public, e.g. /work/a.jpg

const clean = (v, max = 200) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .trim()
    .slice(0, max);

function cleanField(f, raw, errors, where) {
  const label = f.label;
  switch (f.type) {
    case 'bool':
      return raw === true || raw === 'true' || raw === 'on';
    case 'select': {
      const v = clean(raw, 80);
      if (!v) {
        if (f.required) errors[where] = `${label} is required.`;
        return f.default ?? '';
      }
      if (f.options && !f.options.some((o) => o.value === v)) errors[where] = `Choose a valid ${label.toLowerCase()}.`;
      if (f.optionsFrom && !/^[a-z0-9-]{1,60}$/.test(v)) errors[where] = `Choose a valid ${label.toLowerCase()}.`;
      return v;
    }
    case 'url': {
      const v = clean(raw, 500);
      if (v && !WEB_URL.test(v)) errors[where] = `${label} must be a full link starting with https://`;
      if (!v && f.required) errors[where] = `${label} is required.`;
      return v;
    }
    case 'image': {
      const v = clean(raw, 500);
      if (v && !SECURE_URL.test(v) && !LOCAL_PATH.test(v)) errors[where] = 'Image must be an uploaded file or a link starting with https://';
      if (!v && f.required) errors[where] = `${label} is required.`;
      return v;
    }
    case 'slug':
      return slugify(raw);
    case 'list': {
      const arr = Array.isArray(raw) ? raw : String(raw ?? '').split('\n');
      return arr
        .map((x) => clean(x, 80))
        .filter(Boolean)
        .slice(0, f.max || 20);
    }
    case 'objectList': {
      const arr = Array.isArray(raw) ? raw : [];
      return arr.slice(0, f.max || 20).flatMap((item, i) => {
        const out = {};
        let empty = true;
        f.of.forEach((sub) => {
          const v = cleanField(sub, item?.[sub.name], errors, `${where}.${i}.${sub.name}`);
          out[sub.name] = v;
          if (v) empty = false;
        });
        if (empty) {
          // a blank row is simply dropped, not an error
          f.of.forEach((sub) => delete errors[`${where}.${i}.${sub.name}`]);
          return [];
        }
        return [out];
      });
    }
    case 'textarea':
    case 'text':
    default: {
      const v = clean(raw, f.max || (f.type === 'textarea' ? 2000 : 200));
      if (!v && f.required) errors[where] = `${label} is required.`;
      return v;
    }
  }
}

/**
 * Validate and clean one item of a content type.
 * Returns { value, errors } where errors maps field names to messages (empty when valid).
 */
export function sanitize(type, input) {
  const def = TYPES[type];
  const value = {};
  const errors = {};
  def.fields.forEach((f) => {
    // nested fields accept either { links: { live } } or a flat { live }
    const raw = getPath(input || {}, f.path || f.name) ?? (f.path ? input?.[f.name] : undefined);
    setPath(value, f.path || f.name, cleanField(f, raw, errors, f.name));
  });
  return { value, errors };
}

/** A blank item with each field's default, for the "Add" form. */
export function blank(type) {
  const out = {};
  TYPES[type].fields.forEach((f) => {
    const v =
      f.default ?? (f.type === 'list' || f.type === 'objectList' ? [] : f.type === 'bool' ? false : '');
    setPath(out, f.path || f.name, v);
  });
  return out;
}
