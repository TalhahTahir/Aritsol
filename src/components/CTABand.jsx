import { Link } from 'react-router-dom';
import { site } from '../config/site';
import Magnetic from './fx/Magnetic.jsx';
import s from './CTABand.module.css';

export default function CTABand({
  title = 'Have a project in mind?',
  text = 'Tell us what you are building. We will reply within one business day with questions, a suggested approach and next steps.',
}) {
  return (
    <section className="section--tight">
      <div className="container">
        <div className={`${s.band} tone-gold`}>
          <div className={s.copy}>
            <h2 className={s.title}>{title}</h2>
            <p className={s.text}>{text}</p>
          </div>
          <div className={s.actions}>
            <Magnetic>
              <Link to="/contact" className="btn btn--accent">
                Start a project
              </Link>
            </Magnetic>
            <a href={`mailto:${site.contact.email}`} className={s.mail}>
              or email {site.contact.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
