import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import s from './NotFound.module.css';

export default function NotFound() {
  usePageMeta({ title: 'Page not found' });
  return (
    <section className={`container ${s.wrap}`}>
      <p className={s.code} aria-hidden="true">
        404
      </p>
      <h1 className={s.title}>This page does not exist</h1>
      <p className="lede">The link may be old or mistyped. Try one of these instead.</p>
      <div className={s.actions}>
        <Link to="/" className="btn btn--accent">
          Go to the homepage
        </Link>
        <Link to="/services" className="btn btn--ghost">
          Browse services
        </Link>
      </div>
    </section>
  );
}
