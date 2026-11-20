import BrandMark from '../BrandMark.jsx';
import s from './BrandCurtain.module.css';

/*
  ARTISOL's transition identity, shared by the loading screen and every
  page change. Two layers move together: a gold sweep leads, the midnight
  panel follows; on the way out the panel lifts away and the gold trails it.

  stage:
    'cover'  layers rise from the bottom and cover the screen
    'hold'   fully covered (the loader shows its progress here)
    'lift'   layers lift off the top, revealing the page
  onCovered / onLifted fire when the panel finishes moving.
*/
export default function BrandCurtain({ stage, label, children, extras, onCovered, onLifted }) {
  const onEnd = (e) => {
    if (!e.target.dataset.panel) return;
    if (stage === 'cover') onCovered?.();
    if (stage === 'lift') onLifted?.();
  };

  return (
    <div className={`${s.curtain} ${s[stage]}`} aria-hidden="true">
      <div className={s.gold} />
      <div className={s.panel} data-panel="1" onAnimationEnd={onEnd}>
        <div className={s.content}>
          {children ?? (
            <>
              <BrandMark size={56} ink="var(--brand-white)" bar={stage === 'cover' ? 0 : 1} />
              {label && (
                <span className={s.labelMask}>
                  <span className={s.label}>{label}</span>
                </span>
              )}
            </>
          )}
        </div>
        {extras && <div className={s.extras}>{extras}</div>}
      </div>
    </div>
  );
}
