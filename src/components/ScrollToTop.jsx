import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** SPA navigation keeps scroll position by default — reset it, but respect #hash links. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    // after a page change, move keyboard/screen-reader focus to the new content
    if (!first.current && !hash) document.getElementById('main')?.focus({ preventScroll: true });
    first.current = false;
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
