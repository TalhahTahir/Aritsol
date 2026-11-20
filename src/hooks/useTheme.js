import { useCallback, useEffect, useState } from 'react';

const KEY = 'artisol-theme';

function readTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Light/dark theme. The initial value is set by the inline script in
 * index.html (saved choice, otherwise the OS setting) to avoid a flash.
 * Until the visitor picks a theme, we keep following the OS setting.
 */
export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      let saved = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch {
        /* storage blocked */
      }
      if (!saved) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* storage blocked — the choice still applies for this visit */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
