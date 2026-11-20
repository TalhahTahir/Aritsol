// Read design tokens (CSS custom properties) as RGB so canvas/WebGL effects
// use the same palette as the page, and follow theme switches.

export function cssColor(name) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return hexToRgb(v) || [128, 128, 128];
}

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Call `fn` now and whenever the theme attribute on <html> changes. */
export function onThemeChange(fn) {
  fn();
  const mo = new MutationObserver(fn);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
}

export const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
