import { useEffect, useRef } from 'react';
import { cssColor, isDark, onThemeChange } from '../../fx/theme-colors';
import s from './CursorTrail.module.css';

const MAX_PARTICLES = 220;
const INTERACTIVE = 'a, button, summary, [role="tab"], input, label';

/**
 * Particle trail + soft follower ring for mouse/trackpad users.
 * Not rendered on touch screens or when the visitor prefers reduced motion.
 * The real cursor stays visible, so nothing about pointing changes.
 */
export default function CursorTrail() {
  const ref = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    const canvas = ref.current;
    const c = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let colors = [];
    let dark = false;
    const stopTheme = onThemeChange(() => {
      colors = [cssColor('--accent'), cssColor('--ink')];
      dark = isDark();
    });

    const particles = [];
    const mouse = { x: -100, y: -100, px: -100, py: -100, seen: false };
    const ring = { x: -100, y: -100, r: 16, tr: 16, alpha: 0, ta: 0 };
    let raf = 0;

    const spawn = (x, y, vx, vy, n) => {
      for (let i = 0; i < n; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const life = 0.55 + Math.random() * 0.55;
        particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: vx * 0.12 + (Math.random() - 0.5) * 0.9,
          vy: vy * 0.12 + (Math.random() - 0.5) * 0.9 - 0.25,
          size: 1.2 + Math.random() * 2.6,
          life,
          max: life,
          col: colors[Math.random() < 0.78 ? 0 : 1],
        });
      }
    };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!mouse.seen) {
        mouse.seen = true;
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        ring.x = mouse.x;
        ring.y = mouse.y;
      }
      const dx = mouse.x - mouse.px;
      const dy = mouse.y - mouse.py;
      const dist = Math.hypot(dx, dy);
      // more particles for faster movement, interpolated along the path
      const n = Math.min(6, Math.ceil(dist / 9));
      for (let i = 1; i <= n; i++) {
        spawn(mouse.px + (dx * i) / n, mouse.py + (dy * i) / n, dx, dy, 1);
      }
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      ring.ta = 1;
      start();
    };

    const onOver = (e) => {
      const hit = e.target.closest?.(INTERACTIVE);
      ring.tr = hit ? 28 : 16;
    };
    const onDown = () => {
      ring.r = ring.tr * 0.6;
      spawn(mouse.x, mouse.y, 0, 0, 14);
      start();
    };
    const onLeave = () => {
      ring.ta = 0;
    };

    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      c.clearRect(0, 0, w, h);
      c.globalCompositeOperation = dark ? 'lighter' : 'source-over';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        const t = p.life / p.max;
        c.globalAlpha = t * (dark ? 0.85 : 0.65);
        c.fillStyle = `rgb(${p.col[0]},${p.col[1]},${p.col[2]})`;
        c.beginPath();
        c.arc(p.x, p.y, p.size * (0.4 + t * 0.6), 0, Math.PI * 2);
        c.fill();
      }

      // follower ring
      c.globalCompositeOperation = 'source-over';
      ring.x += (mouse.x - ring.x) * 0.2;
      ring.y += (mouse.y - ring.y) * 0.2;
      ring.r += (ring.tr - ring.r) * 0.18;
      ring.alpha += (ring.ta - ring.alpha) * 0.12;
      if (ring.alpha > 0.01) {
        const a = colors[0];
        c.globalAlpha = ring.alpha * 0.55;
        c.strokeStyle = `rgb(${a[0]},${a[1]},${a[2]})`;
        c.lineWidth = 1.25;
        c.beginPath();
        c.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        c.stroke();
      }
      c.globalAlpha = 1;

      const settled = Math.abs(mouse.x - ring.x) < 0.3 && Math.abs(mouse.y - ring.y) < 0.3 && Math.abs(ring.tr - ring.r) < 0.3;
      if (particles.length || !settled || Math.abs(ring.ta - ring.alpha) > 0.01) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0; // idle: stop drawing until the mouse moves again
      }
    };
    function start() {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      stopTheme();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={ref} className={s.canvas} aria-hidden="true" />;
}
