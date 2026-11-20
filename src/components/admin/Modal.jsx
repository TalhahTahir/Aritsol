import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import s from './Admin.module.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Dialog shell: dims the page, traps focus, closes on Escape, returns focus afterwards. */
export default function Modal({ title, subtitle, onClose, children, footer, size = 'md', role = 'dialog' }) {
  const ref = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const el = ref.current;
    // first field, or the dialog itself
    const first = el.querySelector('[data-autofocus]') || el.querySelector('input, select, textarea') || el;
    requestAnimationFrame(() => first.focus({ preventScroll: true }));

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current?.();
      }
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const a = items[0];
      const z = items.at(-1);
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      before?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className={s.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()} data-fluid-off>
      <div
        ref={ref}
        className={`${s.modal} ${s[size]}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={s.modalHead}>
          <div>
            <h2 id={titleId} className={s.modalTitle}>
              {title}
            </h2>
            {subtitle && <p className={s.modalSub}>{subtitle}</p>}
          </div>
          {onClose && (
            <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
              <FiX />
            </button>
          )}
        </header>
        <div className={s.modalBody}>{children}</div>
        {footer && <footer className={s.modalFoot}>{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
