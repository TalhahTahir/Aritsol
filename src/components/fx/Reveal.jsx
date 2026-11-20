import { useEffect, useRef } from 'react';
import { useInView } from '../../hooks/useInView';
import { sound } from '../../fx/sound';

/**
 * Reveals its content when scrolled into view.
 *   variant: 'up' | 'clip' | 'scale' | 'left'
 *   delay:   seconds (use for staggering lists)
 *   click:   play the soft click sound on reveal (only if sound is on)
 */
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, click = false, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (!inView || !click) return;
    const id = setTimeout(() => sound.click(0.7), delay * 1000 + 120);
    return () => clearTimeout(id);
  }, [inView, click, delay]);

  return (
    <Tag
      ref={ref}
      className={`reveal reveal--${variant} ${inView ? 'is-in' : ''} ${className}`}
      style={{ ...style, '--delay': `${delay}s` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
