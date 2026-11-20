import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { site } from '../config/site';
import { sound } from '../fx/sound';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import SoundToggle from './SoundToggle.jsx';
import MenuOverlay from './MenuOverlay.jsx';
import s from './Header.module.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  // closed → opening (curtain rises, links arrive) → closing (curtain lifts) → closed
  const [menu, setMenu] = useState('closed');
  const menuBtn = useRef(null);
  const { pathname } = useLocation();

  // Hide the header while scrolling down, bring it back as soon as you scroll up.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      setScrolled(y > 8);
      if (y < 80) setHidden(false); // always visible near the top
      else if (delta > 6) setHidden(true); // scrolling down
      else if (delta < -6) setHidden(false); // scrolling up
      if (Math.abs(delta) > 6 || y < 80) lastY = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // A page change starts at the top, so show the header again.
  useEffect(() => {
    setHidden(false);
  }, [pathname]);

  // The page swaps while the brand transition covers the screen, so the menu
  // can disappear instantly at that moment without anyone seeing it.
  useEffect(() => {
    setMenu('closed');
  }, [pathname]);

  // Lock page scroll behind the open menu
  useEffect(() => {
    document.body.style.overflow = menu === 'closed' ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menu]);

  const open = () => {
    sound.whoosh(0.7);
    setMenu('opening');
  };
  const close = useCallback(() => {
    setMenu((m) => (m === 'closed' ? m : 'closing'));
  }, []);
  const closed = useCallback(() => {
    setMenu('closed');
    menuBtn.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <header className={`${s.header} ${scrolled ? s.scrolled : ''} ${hidden && menu === 'closed' ? s.hidden : ''}`}>
        <div className={`container ${s.bar}`}>
          <Link to="/" className={s.brand} aria-label={`${site.name} home`}>
            <Logo />
          </Link>

          <div className={s.actions}>
            <span className={s.optional}>
              {site.fx.sound && <SoundToggle />}
              <ThemeToggle />
            </span>
            <Link to="/contact" className={`btn btn--accent ${s.cta}`}>
              Start a project
            </Link>
            <button
              ref={menuBtn}
              type="button"
              className={`${s.menuBtn} dfill`}
              aria-expanded={menu !== 'closed'}
              aria-controls="site-menu"
              onClick={open}
            >
              <span className={s.menuLabel}>Menu</span>
              <span className={s.burger} aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      {menu !== 'closed' && <MenuOverlay stage={menu} onClose={close} onClosed={closed} />}
    </>
  );
}
