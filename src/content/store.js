import { useMemo, useSyncExternalStore } from 'react';
import { practices } from '../data/practices';
import { products } from '../data/products';
import { work } from '../data/work';
import { process as processSteps } from '../data/studio';
import { api, prepareImage } from './api';

// ─────────────────────────────────────────────────────────────
// Live site content (products, work, services, workflow).
//
// The site first shows the content it was built with (or the copy cached from the
// last visit), then swaps in the latest from the database via /api/content.
// If the API is not running, the built-in content simply stays.
// ─────────────────────────────────────────────────────────────

const CACHE_KEY = 'artisol-content-v1';
const TYPES = ['products', 'work', 'practices', 'process'];
const BUILT_IN = { products, work, practices, process: processSteps };

const valid = (c) => c && TYPES.every((t) => Array.isArray(c[t]));

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY));
    return valid(c) ? c : null;
  } catch {
    return null;
  }
}
function writeCache(c) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* storage full or blocked: the site still works */
  }
}

let state = {
  ...(readCache() || BUILT_IN),
  source: 'built-in', // 'built-in' | 'live'
  admin: false,
  adminChecked: false,
};
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const set = (patch) => {
  state = { ...state, ...patch };
  emit();
};

export const contentStore = {
  get: () => state,
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

const pick = (c) => Object.fromEntries(TYPES.map((t) => [t, c[t]]));

/** Fetch the latest content. Admins always get a fresh copy (no edge cache). */
export async function loadContent({ fresh = state.admin } = {}) {
  try {
    const res = await fetch(`/api/content${fresh ? `?fresh=${Date.now()}` : ''}`, { credentials: 'same-origin' });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) throw new Error(String(res.status));
    const data = await res.json();
    if (!valid(data)) throw new Error('bad shape');
    set({ ...pick(data), source: 'live' });
    writeCache(pick(data));
    return true;
  } catch {
    return false; // no API (e.g. `npm run dev:web` only, or the database is down): keep what we have
  }
}

export async function checkAdmin() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    const data = res.ok ? await res.json() : null;
    set({ admin: !!data?.admin, adminChecked: true });
  } catch {
    set({ admin: false, adminChecked: true });
  }
  if (state.admin) await loadContent({ fresh: true });
}

/** Called once from main.jsx. */
export function startContent() {
  loadContent({ fresh: false });
  checkAdmin();
}

// ── React hooks ───────────────────────────────────────────────

export function useContent() {
  const s = useSyncExternalStore(contentStore.subscribe, contentStore.get, contentStore.get);
  return useMemo(
    () => ({
      products: s.products,
      work: s.work,
      practices: s.practices,
      process: s.process,
      source: s.source,
      getPractice: (slug) => s.practices.find((p) => p.slug === slug),
    }),
    [s.products, s.work, s.practices, s.process, s.source]
  );
}

export function useAdmin() {
  const s = useSyncExternalStore(contentStore.subscribe, contentStore.get, contentStore.get);
  return { isAdmin: s.admin, checked: s.adminChecked, live: s.source === 'live' };
}

/** For code outside React (e.g. page-transition labels). */
export const getPractice = (slug) => state.practices.find((p) => p.slug === slug);

// ── admin actions ─────────────────────────────────────────────

export async function login(email, password) {
  await api('POST', '/auth/login', { email, password });
}

export async function logout() {
  await api('POST', '/auth/logout').catch(() => {});
}

const replaceIn = (list, doc) => {
  const i = list.findIndex((x) => x._id === doc._id);
  return i >= 0 ? list.map((x, j) => (j === i ? doc : x)) : [...list, doc];
};

/** Create (no _id) or update (with _id) one product, project or service. */
export async function saveItem(type, doc) {
  const saved = doc._id ? await api('PUT', `/${type}/${doc._id}`, doc) : await api('POST', `/${type}`, doc);
  set({ [type]: replaceIn(state[type], saved) });
  loadContent({ fresh: true }); // pick up related changes (e.g. projects following a renamed service)
  return saved;
}

export async function deleteItem(type, id) {
  await api('DELETE', `/${type}/${id}`);
  set({ [type]: state[type].filter((x) => x._id !== id) });
  writeCache(pick(state));
}

/** Move an item up (-1) or down (+1). */
export async function moveItem(type, id, dir) {
  const list = [...state[type]];
  const i = list.findIndex((x) => x._id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  const before = state[type];
  set({ [type]: list });
  try {
    await api('POST', `/${type}/reorder`, { ids: list.map((x) => x._id) });
    writeCache(pick(state));
  } catch (err) {
    set({ [type]: before });
    throw err;
  }
}

export async function saveProcess(steps) {
  const saved = await api('PUT', '/process', { steps });
  set({ process: saved });
  writeCache(pick(state));
  return saved;
}

/** Shrinks the picked image, uploads it to Cloudinary through the API and returns its URL. */
export async function uploadImage(file, folder = 'misc') {
  const blob = await prepareImage(file);
  const { url } = await api('POST', `/images?folder=${encodeURIComponent(folder)}`, undefined, { raw: blob, type: blob.type });
  return url;
}
