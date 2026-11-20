import { useSyncExternalStore } from 'react';

// Which admin window is open (login, item editor, workflow editor, delete confirmation) and toasts.

let state = { login: false, editor: null, workflow: false, confirm: null, toasts: [] };
const listeners = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const get = () => state;

export const useAdminUi = () => useSyncExternalStore(subscribe, get, get);

export const adminUi = {
  openLogin: () => set({ login: true }),
  closeLogin: () => set({ login: false }),
  /** type: 'products' | 'work' | 'practices'; item: existing item to edit, or omitted to add */
  openEditor: (type, item = null) => set({ editor: { type, item } }),
  closeEditor: () => set({ editor: null }),
  openWorkflow: () => set({ workflow: true }),
  closeWorkflow: () => set({ workflow: false }),
  /** Ask before something destructive. Resolves true when confirmed. */
  confirm: (options) =>
    new Promise((resolve) => {
      set({
        confirm: {
          ...options,
          resolve: (ok) => {
            set({ confirm: null });
            resolve(ok);
          },
        },
      });
    }),
  toast(message, kind = 'ok') {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...state.toasts, { id, message, kind }] });
    setTimeout(() => set({ toasts: state.toasts.filter((t) => t.id !== id) }), kind === 'error' ? 6000 : 3200);
  },
};
