import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { site } from './config/site';
import { getPractice } from './content/store';
import { sound } from './fx/sound';
import Layout from './components/Layout.jsx';
import BrandCurtain from './components/brand/BrandCurtain.jsx';
import Home from './pages/Home.jsx';

// Home loads immediately; other pages are split into their own chunks.
// The loaders are kept so a page can be fetched while the transition covers the screen.
const load = {
  services: () => import('./pages/Services.jsx'),
  serviceDetail: () => import('./pages/ServiceDetail.jsx'),
  products: () => import('./pages/Products.jsx'),
  work: () => import('./pages/Work.jsx'),
  about: () => import('./pages/About.jsx'),
  contact: () => import('./pages/Contact.jsx'),
  notFound: () => import('./pages/NotFound.jsx'),
};
const Services = lazy(load.services);
const ServiceDetail = lazy(load.serviceDetail);
const Products = lazy(load.products);
const Work = lazy(load.work);
const About = lazy(load.about);
const Contact = lazy(load.contact);
const NotFound = lazy(load.notFound);

/** Which chunk a path needs, and the name shown on the transition curtain. */
function describe(pathname) {
  const [first, second] = pathname.split('/').filter(Boolean);
  if (!first) return { label: 'Home', loader: null };
  if (first === 'services' && second) {
    return { label: getPractice(second)?.short ?? 'Services', loader: load.serviceDetail };
  }
  const map = {
    services: ['Services', load.services],
    products: ['Products', load.products],
    work: ['Work', load.work],
    about: ['About', load.about],
    contact: ["Let's talk", load.contact],
  };
  const [label, loader] = map[first] ?? ['Not found', load.notFound];
  return { label, loader };
}

const HOLD_MS = 260; // minimum time the curtain stays closed, so the name can be read

export default function App() {
  const location = useLocation();
  // The page on screen lags behind the URL while the curtain is closing.
  const [shown, setShown] = useState(location);
  const [stage, setStage] = useState('idle'); // idle | cover | hold | lift
  const target = useRef(location);
  const pending = useRef(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  useEffect(() => {
    target.current = location;
    const samePage = location.pathname === shown.pathname;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (samePage || reduced || !site.fx.pageTransition) {
      setShown(location);
      return;
    }
    const { loader } = describe(location.pathname);
    pending.current = loader ? loader().catch(() => null) : Promise.resolve();
    // already closing or closed: just retarget, the curtain carries on
    if (stageRef.current === 'cover' || stageRef.current === 'hold') return;
    sound.whoosh(0.9);
    setStage('cover');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const onCovered = () => {
    setStage('hold');
    const minHold = new Promise((r) => setTimeout(r, HOLD_MS));
    const maxWait = new Promise((r) => setTimeout(r, 2500)); // never wait forever on a slow network
    Promise.race([Promise.all([minHold, pending.current]), maxWait]).then(() => {
      // new pages hold their entrance animation until the curtain is lifting
      document.documentElement.style.setProperty('--enter-delay', '0.35s');
      setShown(target.current); // swap the page while nobody can see it
      setStage('lift');
    });
  };

  return (
    <>
      <Routes location={shown}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Lazy><Services /></Lazy>} />
          <Route path="services/:slug" element={<Lazy><ServiceDetail /></Lazy>} />
          <Route path="products" element={<Lazy><Products /></Lazy>} />
          <Route path="work" element={<Lazy><Work /></Lazy>} />
          <Route path="about" element={<Lazy><About /></Lazy>} />
          <Route path="contact" element={<Lazy><Contact /></Lazy>} />
          <Route path="*" element={<Lazy><NotFound /></Lazy>} />
        </Route>
      </Routes>

      {stage !== 'idle' && (
        <BrandCurtain
          stage={stage}
          label={describe(target.current.pathname).label}
          onCovered={onCovered}
          onLifted={() => setStage('idle')}
        />
      )}
    </>
  );
}

function Lazy({ children }) {
  return <Suspense fallback={<div className="page-loading" aria-busy="true" />}>{children}</Suspense>;
}
