import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { site } from '../../config/site';
import s from './Preloader.module.css';

/*
  ─────────────────────────────────────────────────────────────
  ARTISOL preloader (GSAP + SVG)

  1. Sketch   faint construction lines draw themselves round the word
              (cap line, baseline, letter edges, crop marks, CAP / BASE);
              the word's thin outline sweeps in from left to right.
  2. Fill     liquid white flows through the letters: an SVG mask whose
              edge is a soft, moving wave. A glow rises while it fills,
              then settles. The word ends solid white.
  3. Meta     the tagline fades in letter by letter from the centre while
              the counter runs.
  4. Drain    once the page has loaded, the liquid flows back out, leaving
              the outline. Tagline, counter and guides fade away.
  5. Split    after a short hold the screen splits down the middle: two
              charcoal panels, each carrying half of the outlined word,
              slide apart and the homepage settles in underneath.

  The site renders normally underneath the whole time. The preloader
  only waits for the page's own load event (max 6s) before leaving.
  Once per browser session. Reduced motion: simple fades.
  If anything fails, the overlay removes itself (and a CSS failsafe
  hides it after 10s even if this script never runs).
  ─────────────────────────────────────────────────────────────
*/

const KEY = 'artisol-intro-seen';
const WORD = 'ARTISOL';
const TAGLINE = 'IDEAS INTO INNOVATION';
const BASE_Y = 206; // baseline in the 1200 × 300 viewBox
const CAP_Y = BASE_Y - 150 * 0.72; // Unbounded's capitals are ~72% of the font size

function shouldShow() {
  try {
    if (sessionStorage.getItem(KEY) === '1') return false;
  } catch {
    /* storage blocked: show it */
  }
  return true;
}

// a vertical wavy edge at x; everything left of it is "filled"
function wavePath(x, t) {
  let d = `M -200 -80 L ${x.toFixed(1)} -80`;
  for (let y = -80; y <= 380; y += 10) {
    const off = 16 * Math.sin(y * 0.032 + t * 2.4) + 6 * Math.sin(y * 0.087 - t * 3.1);
    d += ` L ${(x + off).toFixed(1)} ${y}`;
  }
  return `${d} L -200 380 Z`;
}

export default function Preloader() {
  const [on, setOn] = useState(shouldShow);
  const root = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    if (!on) {
      html.classList.add('is-ready');
      html.classList.remove('boot');
      return;
    }
    const el = root.current;
    const q = (sel) => Array.from(el.querySelectorAll(sel));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let tl = null;
    let outro = null;
    let killed = false;
    const timers = [];

    // the static boot screen from index.html hands over to this component
    html.classList.remove('boot');
    el.style.animation = 'none'; // script is alive: cancel the CSS failsafe
    document.body.style.overflow = 'hidden';

    const finish = () => {
      if (killed) return;
      killed = true;
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* ignore */
      }
      html.classList.add('is-ready');
      document.body.style.overflow = '';
      setOn(false);
    };

    // the page underneath: wait for its load event, but never more than 6s
    const loaded = new Promise((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
      timers.push(setTimeout(resolve, 6000));
    });
    // the wordmark font: wait briefly so the outline is drawn in Unbounded
    const fontReady = Promise.race([
      document.fonts?.load?.('600 150px Unbounded') ?? Promise.resolve(),
      new Promise((r) => timers.push(setTimeout(r, 1200))),
    ]).catch(() => {});

    const waves = q('[data-wave]');
    const counterNum = el.querySelector('[data-count]');
    const counterLine = el.querySelector('[data-line]');
    const counter = { v: 0 };
    const renderCounter = () => {
      counterNum.textContent = String(Math.round(counter.v)).padStart(3, '0');
      counterLine.style.transform = `scaleX(${counter.v / 100})`;
    };
    const liquid = { x: -120, t: 0 };
    const renderWave = () => {
      liquid.t += 1 / 60;
      const d = wavePath(liquid.x, liquid.t);
      waves.forEach((w) => w.setAttribute('d', d));
    };

    // build the construction lines from the real letter positions
    const buildGuides = () => {
      const svg = el.querySelector('[data-guides]');
      const text = el.querySelector('[data-measure]');
      const NS = 'http://www.w3.org/2000/svg';
      const line = (x1, y1, x2, y2) => {
        const l = document.createElementNS(NS, 'line');
        Object.entries({ x1, y1, x2, y2, pathLength: 1 }).forEach(([k, v]) => l.setAttribute(k, v));
        l.setAttribute('class', s.guide);
        l.setAttribute('data-guide', '');
        svg.appendChild(l);
      };
      const path = (d) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('pathLength', 1);
        p.setAttribute('class', s.guide);
        p.setAttribute('data-guide', '');
        svg.appendChild(p);
      };
      const label = (x, y, str) => {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', x);
        t.setAttribute('y', y);
        t.setAttribute('class', s.label);
        t.setAttribute('data-label', '');
        t.textContent = str;
        svg.appendChild(t);
      };
      line(40, CAP_Y, 1160, CAP_Y);
      line(40, BASE_Y, 1160, BASE_Y);
      // letter edges, measured from the rendered text (falls back to an even split)
      const edges = new Set();
      for (let i = 0; i < WORD.length; i++) {
        try {
          const r = text.getExtentOfChar(i);
          edges.add(Math.round(r.x));
          if (i === WORD.length - 1) edges.add(Math.round(r.x + r.width));
        } catch {
          edges.add(Math.round(100 + (1000 / WORD.length) * i));
          if (i === WORD.length - 1) edges.add(1100);
        }
      }
      edges.forEach((x) => line(x, CAP_Y - 34, x, BASE_Y + 30));
      // crop marks at the corners of the drawing area
      const [x0, y0, x1, y1, m] = [70, CAP_Y - 52, 1130, BASE_Y + 46, 22];
      path(`M ${x0} ${y0 + m} V ${y0} H ${x0 + m}`);
      path(`M ${x1 - m} ${y0} H ${x1} V ${y0 + m}`);
      path(`M ${x0} ${y1 - m} V ${y1} H ${x0 + m}`);
      path(`M ${x1 - m} ${y1} H ${x1} V ${y1 - m}`);
      label(40, CAP_Y - 10, 'CAP');
      label(40, BASE_Y - 10, 'BASE');
    };

    // the homepage under the curtain fades and settles in. The whole app root fades as one
    // layer (so the fixed background canvas never shows through a half-faded page) while the
    // main content eases up from a touch smaller.
    const app = document.getElementById('root');
    const main = document.getElementById('main');
    const settlePage = () => {
      const clear = () => {
        if (app) app.style.opacity = '';
        if (main) main.style.transform = '';
      };
      if (app) gsap.fromTo(app, { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power2.out', onComplete: clear });
      if (main) gsap.fromTo(main, { scale: 0.985 }, { scale: 1, duration: 1.5, ease: 'expo.out', onComplete: clear });
    };

    const runReduced = async () => {
      // no wave, no sketch, no curtain: the finished mark, then a fade
      waves.forEach((w) => w.setAttribute('d', wavePath(1400, 0)));
      q('[data-outline-mask]').forEach((r) => r.setAttribute('width', 1600));
      q('[data-letter]').forEach((l) => {
        l.style.opacity = 1;
        l.style.transform = 'none';
      });
      counter.v = 100;
      renderCounter();
      const content = el.querySelector('[data-layer]');
      gsap.fromTo(content, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out' });
      await Promise.all([loaded, new Promise((r) => timers.push(setTimeout(r, 1300)))]);
      if (killed) return;
      html.classList.add('is-ready');
      tl = gsap.timeline({ onComplete: finish });
      tl.to(el, { opacity: 0, duration: 0.6, ease: 'power1.inOut' });
    };

    const runFull = async () => {
      await fontReady;
      if (killed) return;
      buildGuides();
      const guides = q('[data-guide]');
      const labels = q('[data-label]');
      const letters = q('[data-letter]');
      const glows = q('[data-glow]');
      const sweeps = q('[data-outline-mask]');
      const word = el.querySelector('[data-word]');
      const panelWords = q('[data-panel-word]');
      renderWave();

      let introDone = false;
      let pageDone = false;
      const maybeOutro = () => {
        if (introDone && pageDone && !outro && !killed) playOutro();
      };
      loaded.then(() => {
        pageDone = true;
        maybeOutro();
      });

      // 1–3: sketch, fill, tagline + counter
      tl = gsap.timeline({
        onComplete: () => {
          introDone = true;
          maybeOutro();
        },
      });
      tl.fromTo(guides, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.045 }, 0)
        .fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.5)
        .fromTo(sweeps, { attr: { width: 0 } }, { attr: { width: 1600 }, duration: 1.6, ease: 'power2.inOut' }, 0.2)
        .fromTo(liquid, { x: -120 }, { x: 1320, duration: 1.8, ease: 'sine.inOut', onUpdate: renderWave }, 1.5)
        .fromTo(glows, { opacity: 0 }, { opacity: 0.9, duration: 0.7, ease: 'power1.out' }, 1.6)
        .to(glows, { opacity: 0, duration: 1.1, ease: 'power2.out' }, 3.0)
        .fromTo(
          letters,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: { each: 0.035, from: 'center' } },
          1.7
        )
        .fromTo(counter, { v: 0 }, { v: 92, duration: 2.2, ease: 'power1.inOut', onUpdate: renderCounter }, 1.4);

      // 4–5: drain, hold, split
      const playOutro = () => {
        const meta = el.querySelector('[data-meta]');
        const guideSvg = el.querySelector('[data-guides]');
        outro = gsap.timeline({ onComplete: finish });
        outro
          .to(counter, { v: 100, duration: 0.45, ease: 'power2.out', onUpdate: renderCounter })
          .to(liquid, { x: -140, duration: 1.4, ease: 'sine.inOut', onUpdate: renderWave }, '+=0.15')
          .to([meta, guideSvg], { opacity: 0, duration: 0.7, ease: 'power1.inOut' }, '<+=0.2')
          .call(
            () => {
              // hand the outlined word over to the two halves that are about to slide apart
              panelWords.forEach((w) => (w.style.visibility = 'visible'));
              word.style.visibility = 'hidden';
              html.style.setProperty('--enter-delay', '0.35s');
              html.classList.add('is-ready');
              document.body.style.overflow = '';
              settlePage();
            },
            null,
            '+=0.35'
          )
          .to(el.querySelector('[data-panel="l"]'), { xPercent: -50, duration: 1.4, ease: 'expo.inOut' }, '<')
          .to(el.querySelector('[data-panel="r"]'), { xPercent: 50, duration: 1.4, ease: 'expo.inOut' }, '<');
      };
    };

    (reduced ? runReduced() : runFull()).catch((err) => {
      console.warn('Preloader skipped:', err);
      finish();
    });

    // last-resort safety net: never keep anyone waiting more than 14s
    timers.push(setTimeout(finish, 14000));

    return () => {
      killed = true;
      timers.forEach(clearTimeout);
      tl?.kill();
      outro?.kill();
      document.body.style.overflow = '';
      if (app) app.style.opacity = '';
      if (main) main.style.transform = '';
    };
  }, [on]);

  if (!on) return null;

  // Rendered straight into <body>, outside the app root, so the app can fade in on its own.
  return createPortal(
    <div ref={root} className={s.root} role="status" aria-live="polite">
      <span className="visually-hidden">Loading {site.name}</span>
      {/* the two halves of the curtain: plain outlines, shown only for the split */}
      {['l', 'r'].map((side) => (
        <div key={side} className={`${s.panel} ${side === 'l' ? s.left : s.right}`} data-panel={side} aria-hidden="true">
          <div className={s.stack}>
            <svg className={`${s.svg} ${s.panelWord}`} viewBox="0 0 1200 300" data-panel-word>
              <text {...TEXT} className={`${s.word} ${s.outline}`}>
                {WORD}
              </text>
            </svg>
            <div className={s.metaSpace} />
          </div>
        </div>
      ))}
      {/* the animated drawing: guides, outline sweep, liquid fill, tagline, counter */}
      <div className={s.layer} aria-hidden="true" data-layer>
        <div className={s.stack}>
          <Wordmark />
          <div className={s.meta} data-meta>
            <p className={s.tagline}>
              {TAGLINE.split('').map((ch, i) => (
                <span key={i} data-letter>
                  {ch === ' ' ? '\u00a0' : ch}
                </span>
              ))}
            </p>
            <div className={s.counter}>
              <span className={s.num} data-count>
                000
              </span>
              <span className={s.line}>
                <span className={s.lineFill} data-line />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const TEXT = { x: 100, y: BASE_Y, textLength: 1000, lengthAdjust: 'spacingAndGlyphs' };

function Wordmark() {
  return (
    <svg className={s.svg} viewBox="0 0 1200 300" data-word>
      <defs>
        {/* outline sweep: a rect with a feathered right edge grows from the left */}
        <linearGradient id="pl-feather" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.9" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="pl-sweep" maskUnits="userSpaceOnUse" x="-200" y="-100" width="1600" height="500">
          <rect data-outline-mask x="-100" y="-100" width="0" height="500" fill="url(#pl-feather)" />
        </mask>
        {/* liquid fill: a soft-edged, wavy shape moving across */}
        <filter id="pl-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <mask id="pl-liquid" maskUnits="userSpaceOnUse" x="-200" y="-100" width="1600" height="500">
          <path data-wave d="M -200 -80 L -200 380 Z" fill="#fff" filter="url(#pl-soft)" />
        </mask>
        <filter id="pl-glow" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* construction lines are added here by buildGuides() */}
      <g data-guides />
      <text {...TEXT} className={`${s.word} ${s.outline}`} mask="url(#pl-sweep)" data-measure>
        {WORD}
      </text>
      <g mask="url(#pl-liquid)">
        <text {...TEXT} className={`${s.word} ${s.glow}`} filter="url(#pl-glow)" data-glow>
          {WORD}
        </text>
        <text {...TEXT} className={`${s.word} ${s.fill}`}>
          {WORD}
        </text>
      </g>
    </svg>
  );
}
