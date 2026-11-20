import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiPlus } from 'react-icons/fi';
import { useContent } from '../content/store';
import { useMediaQuery } from '../hooks/useMediaQuery';
import s from './PracticeIndex.module.css';

/**
 * The six practices as an index: pick one on the left, its services appear on
 * the right. On small screens it becomes an accordion.
 */
export default function PracticeIndex() {
  const wide = useMediaQuery('(min-width: 961px)');
  return wide ? <Tabs /> : <Accordion />;
}

function Tabs() {
  const { practices } = useContent();
  const [picked, setActive] = useState(0);
  const uid = useId();
  const active = Math.min(picked, practices.length - 1);
  const p = practices[active];

  const onKeyDown = (e) => {
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const nextIndex = (active + dir + practices.length) % practices.length;
    setActive(nextIndex);
    document.getElementById(`${uid}-tab-${nextIndex}`)?.focus();
  };

  if (!p) return null;

  return (
    <div className={s.tabs}>
      <div role="tablist" aria-orientation="vertical" aria-label="Practices" className={s.list} onKeyDown={onKeyDown}>
        {practices.map((x, i) => (
          <button
            key={x.slug}
            id={`${uid}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${uid}-panel`}
            tabIndex={i === active ? 0 : -1}
            className={`${s.tab} dfill`}
            onClick={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
          >
            <span className={s.tabName}>{x.short}</span>
            <span className={s.count}>{x.services.length} services</span>
          </button>
        ))}
      </div>

      <div
        id={`${uid}-panel`}
        role="tabpanel"
        aria-labelledby={`${uid}-tab-${active}`}
        className={s.panel}
        key={p.slug}
      >
        <PracticeBody p={p} />
      </div>
    </div>
  );
}

function Accordion() {
  const { practices } = useContent();
  const [open, setOpen] = useState(0);
  const uid = useId();
  return (
    <ul role="list" className={s.accordion}>
      {practices.map((p, i) => {
        const isOpen = open === i;
        return (
          <li key={p.slug} className={s.accItem}>
            <h3>
              <button
                type="button"
                className={s.accBtn}
                aria-expanded={isOpen}
                aria-controls={`${uid}-acc-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{p.short}</span>
                <FiPlus aria-hidden className={s.plus} />
              </button>
            </h3>
            <div id={`${uid}-acc-${i}`} hidden={!isOpen} className={s.accPanel}>
              <PracticeBody p={p} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PracticeBody({ p }) {
  return (
    <>
      <p className={s.summary}>{p.summary}</p>
      <p className={s.fit}>
        <strong>A good fit when</strong> {p.fit.charAt(0).toLowerCase() + p.fit.slice(1)}
      </p>
      <ul role="list" className={s.services}>
        {p.services.map((sv) => (
          <li key={sv.name}>{sv.name}</li>
        ))}
      </ul>
      <Link to={`/services/${p.slug}`} className="link">
        Explore {p.short} <FiArrowUpRight aria-hidden />
      </Link>
    </>
  );
}
