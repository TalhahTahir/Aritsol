import { useRef } from 'react';
import { FiArrowUpRight } from 'react-icons/fi';
import { statusLabel } from '../../data/products';
import { useContent } from '../../content/store';
import { AdminAdd, AdminItemTools } from '../admin/AdminTools.jsx';
import { useMediaQuery, useReducedMotion } from '../../hooks/useMediaQuery';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { sound } from '../../fx/sound';
import ProductList from '../ProductList.jsx';
import TypeHeading from './TypeHeading.jsx';
import s from './ProductRail.module.css';

const tones = ['gold', 'black', 'white'];

/**
 * Home-page products section. On desktop the section pins and the product
 * panels slide sideways as you scroll down. On phones and for reduced-motion
 * visitors it falls back to the regular stacked list.
 */
export default function ProductRail() {
  const wide = useMediaQuery('(min-width: 961px)');
  const reduced = useReducedMotion();
  if (!wide || reduced) {
    return (
      <div className={`container ${s.fallback}`}>
        <div className="section-head">
          <TypeHeading>Products we build and run ourselves</TypeHeading>
          <p>Alongside client work we ship our own SaaS products. Each one has its own site with plans and sign-up.</p>
        </div>
        <ProductList />
      </div>
    );
  }
  return <Rail />;
}

function Rail() {
  const section = useRef(null);
  const track = useRef(null);
  const current = useRef(-1);
  const { products } = useContent();
  const count = useRef(products.length);
  count.current = products.length;

  useScrollProgress(section, {
    mode: 'pin',
    onProgress: (p) => {
      const el = track.current;
      if (!el) return;
      const distance = el.scrollWidth - window.innerWidth;
      el.style.transform = `translate3d(${-p * distance}px,0,0)`;
      const idx = Math.min(count.current - 1, Math.round(p * (count.current - 1)));
      if (idx !== current.current) {
        if (current.current !== -1) sound.click(0.6);
        current.current = idx;
      }
    },
  });

  return (
    <section ref={section} className={s.rail} style={{ height: `${products.length * 85 + 40}vh` }} aria-label="Our products">
      <div className={s.sticky}>
        <div className={`container ${s.head}`}>
          <div className="section-head">
            <TypeHeading>Products we build and run ourselves</TypeHeading>
            <p>Alongside client work we ship our own SaaS products. Each has its own site with plans and sign-up.</p>
            <AdminAdd type="products" compact />
          </div>
        </div>

        <div ref={track} className={s.track}>
          {products.map((p, i) => (
            <article key={p.id} className={`${s.panel} tone-${tones[i % tones.length]}`}>
              <AdminItemTools type="products" item={p} />
              {p.image ? (
                <img className={s.shot} src={p.image} alt="" loading="lazy" />
              ) : (
                <span className={s.glyph} aria-hidden="true">
                  {p.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 3)}
                </span>
              )}
              <div className={s.panelBody}>
                <span className={`status ${p.status === 'live' ? 'status--live' : ''}`}>{statusLabel[p.status]}</span>
                <h3 className={s.name}>{p.name}</h3>
                <p className={s.one}>{p.oneLiner}</p>
                <ul role="list" className="chips">
                  {p.highlights.map((h) => (
                    <li key={h} className={`chip ${s.chip}`}>
                      {h}
                    </li>
                  ))}
                </ul>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer" className="btn btn--accent">
                    Visit {p.name} <FiArrowUpRight aria-hidden />
                  </a>
                ) : (
                  <span className="btn btn--ghost" aria-disabled="true">
                    Site launching soon
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className={`container ${s.progressWrap}`} aria-hidden="true">
          <span className={s.progress} />
        </div>
      </div>
    </section>
  );
}
