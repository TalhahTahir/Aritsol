import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import s from './Lightbox.module.css';

/**
 * Full-screen image viewer: arrows, keyboard (← → Esc), swipe on touch, thumbnails.
 * images: [{ src, alt }]
 */
export default function Lightbox({ images, start = 0, title, onClose }) {
  const [i, setI] = useState(start);
  const n = images.length;
  const go = useCallback((d) => setI((x) => (x + d + n) % n), [n]);
  const closeRef = useRef(null);
  const touch = useRef(null);

  useEffect(() => {
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      before?.focus?.({ preventScroll: true });
    };
  }, [go, onClose]);

  // load the next and previous images ahead of time
  useEffect(() => {
    [1, -1].forEach((d) => {
      const img = new Image();
      img.src = images[(i + d + n) % n].src;
    });
  }, [i, images, n]);

  const img = images[i];

  return createPortal(
    <div className={s.root} role="dialog" aria-modal="true" aria-label={`${title}: images`} data-fluid-off>
      <div className={s.top}>
        <p className={s.title}>
          {title}
          <span className={s.count}>
            {i + 1} / {n}
          </span>
        </p>
        <button ref={closeRef} type="button" className={s.btn} onClick={onClose} aria-label="Close">
          <FiX />
        </button>
      </div>

      <div
        className={s.stage}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {n > 1 && (
          <button type="button" className={`${s.btn} ${s.prev}`} onClick={() => go(-1)} aria-label="Previous image">
            <FiChevronLeft />
          </button>
        )}
        <img key={img.src} className={s.img} src={img.src} alt={img.alt} />
        {n > 1 && (
          <button type="button" className={`${s.btn} ${s.next}`} onClick={() => go(1)} aria-label="Next image">
            <FiChevronRight />
          </button>
        )}
      </div>

      {n > 1 && (
        <ul role="list" className={s.thumbs}>
          {images.map((im, j) => (
            <li key={im.src}>
              <button
                type="button"
                className={`${s.thumb} ${j === i ? s.thumbOn : ''}`}
                onClick={() => setI(j)}
                aria-label={`Image ${j + 1}`}
                aria-current={j === i}
              >
                <img src={im.src} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body
  );
}
