import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { site } from '../config/site';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import CursorTrail from './fx/CursorTrail.jsx';
import FerrofluidBackground from './fx/FerrofluidBackground.jsx';
import FluidControl from './fx/FluidControl.jsx';
import Preloader from './fx/Preloader.jsx';
import WhatsAppButton from './WhatsAppButton.jsx';
import AdminLayer from './admin/AdminLayer.jsx';

// Without the preloader, mark the page ready straight away (starts the hero entrance).
function ReadyFlag() {
  useEffect(() => {
    document.documentElement.classList.add('is-ready');
    document.documentElement.classList.remove('boot'); // clear the charcoal boot screen from index.html
  }, []);
  return null;
}

export default function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {site.fx.preloader ? <Preloader /> : <ReadyFlag />}
      <ScrollToTop />
      {site.fx.fluidBackground && <FerrofluidBackground />}
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      {site.fx.fluidBackground && <FluidControl />}
      {site.fx.whatsappButton && <WhatsAppButton />}
      <AdminLayer />
      {site.fx.cursorTrail && <CursorTrail />}
    </>
  );
}
