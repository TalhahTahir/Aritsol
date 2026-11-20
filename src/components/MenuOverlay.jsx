import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { site } from '../config/site';
import { logout, useAdmin, useContent } from '../content/store';
import { adminUi } from '../admin/ui';
import { FiLock, FiLogOut } from 'react-icons/fi';
import { countWord, listNames } from '../content/words';
import BrandMark from './BrandMark.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import SoundToggle from './SoundToggle.jsx';
import { socialProfiles } from './SocialLinks.jsx';
import s from './MenuOverlay.module.css';

const MAIN_LINKS = [
  { to: '/', label: 'Home', hint: 'Back to the beginning.' },
  { to: '/services', label: 'Services', hint: 'Six practices, one accountable team.' },
  { to: '/products', label: 'Products', hint: 'TradeMind AI, Listing Agent and Orion AI.' },
  { to: '/work', label: 'Work', hint: 'Selected projects across AI, web and enterprise.' },
  { to: '/about', label: 'About', hint: 'Who we are and how we work.' },
  { to: '/contact', label: 'Contact', hint: 'Tell us what you are building.' },
];

/**
 * Fullscreen menu. It opens and closes with the same gold-and-midnight
 * curtain as the page transitions, so it feels like part of one system.
 * Always dark, in both themes. Traps focus while open; Escape closes it.
 */
export default function MenuOverlay({ stage, onClose, onClosed }) {
  const { practices, products } = useContent();
  const { isAdmin } = useAdmin();
  // hints that follow the live content
  const MAIN = MAIN_LINKS.map((m) =>
    m.to === '/services'
      ? { ...m, hint: `${countWord(practices.length)} practices, one accountable team.` }
      : m.to === '/products'
        ? { ...m, hint: `${listNames(products.map((p) => p.name))}.` }
        : m
  );
  const ref = useRef(null);
  const closeBtn = useRef(null);
  const { pathname } = useLocation();
  const [hint, setHint] = useState(() => MAIN.find((m) => m.to === pathname)?.hint ?? MAIN[0].hint);

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const items = ref.current.querySelectorAll('a[href], button:not([disabled])');
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // A link to the page you're already on: just close the menu.
  const onNav = (to) => (e) => {
    if (to === pathname) {
      e.preventDefault();
      onClose();
    }
  };

  const socials = socialProfiles();

  return (
    <div
      ref={ref}
      id="site-menu"
      className={`${s.overlay} ${s[stage]}`}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      <div className={s.gold} aria-hidden="true" />
      <div
        className={`${s.panel} tone-black`}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && stage === 'closing') onClosed();
        }}
      >
        <div className={`container ${s.top}`}>
          <Link to="/" className={s.brand} onClick={onNav('/')} aria-label={`${site.name} home`}>
            <BrandMark size={30} />
            <span className={s.word}>{site.name}</span>
          </Link>
          <div className={s.topActions}>
            {site.fx.sound && <SoundToggle />}
            <ThemeToggle />
            <button ref={closeBtn} type="button" className={`${s.close} dfill`} onClick={onClose}>
              <span>Close</span>
              <span className={s.cross} aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>

        <div className={`container ${s.body}`}>
          <nav aria-label="Main" className={s.main} onMouseLeave={() => setHint(MAIN.find((m) => m.to === pathname)?.hint ?? MAIN[0].hint)}>
            <ul role="list">
              {MAIN.map((m, i) => (
                <li key={m.to} className={s.item} style={{ '--i': i }}>
                  <Link
                    to={m.to}
                    className={`${s.big} ${m.to === pathname ? s.current : ''}`}
                    aria-current={m.to === pathname ? 'page' : undefined}
                    onMouseEnter={() => setHint(m.hint)}
                    onFocus={() => setHint(m.hint)}
                    onClick={onNav(m.to)}
                  >
                    <span className={s.bigText}>{m.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <aside className={s.side}>
            <p className={s.hint} key={hint} aria-live="polite">
              {hint}
            </p>

            <div className={s.group}>
              <h2 className={s.groupTitle}>Services</h2>
              <ul role="list" className={s.smallList}>
                {practices.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/services/${p.slug}`} onClick={onNav(`/services/${p.slug}`)}>
                      {p.short}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={s.group}>
              <h2 className={s.groupTitle}>Our products</h2>
              <ul role="list" className={s.smallList}>
                {products.map((p) => (
                  <li key={p.id}>
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer">
                        {p.name} <FiArrowUpRight aria-hidden />
                      </a>
                    ) : (
                      <Link to="/products" onClick={onNav('/products')}>
                        {p.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className={s.group}>
              <h2 className={s.groupTitle}>Say hello</h2>
              <a href={`mailto:${site.contact.email}`} className={s.mail}>
                {site.contact.email}
              </a>
              {socials.length > 0 && (
                <ul role="list" className={s.socials}>
                  {socials.map(({ href, label, Icon }) => (
                    <li key={label}>
                      <a href={href} target="_blank" rel="noreferrer" aria-label={label}>
                        <Icon size={17} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link to="/contact" className="btn btn--accent" onClick={onNav('/contact')}>
              Start a project
            </Link>

            {/* last item: admin sign-in (or sign-out when admin mode is on) */}
            {isAdmin ? (
              <button
                type="button"
                className={s.adminBtn}
                onClick={async () => {
                  await logout();
                  window.location.reload();
                }}
              >
                <FiLogOut aria-hidden /> Log out of admin
              </button>
            ) : (
              <button
                type="button"
                className={s.adminBtn}
                onClick={() => {
                  onClose();
                  adminUi.openLogin();
                }}
              >
                <FiLock aria-hidden /> Admin controls
              </button>
            )}
          </aside>
        </div>

        <div className={`container ${s.foot}`}>
          <span>{site.tagline}</span>
          <span>
            © {new Date().getFullYear()} {site.legalName}
          </span>
        </div>
      </div>
    </div>
  );
}
