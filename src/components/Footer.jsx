import { Link } from 'react-router-dom';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { site, mapHref, telHref } from '../config/site';
import SocialLinks from './SocialLinks.jsx';
import { useContent } from '../content/store';
import Logo from './Logo.jsx';
import TextPressure from './fx/TextPressure.jsx';
import LiquidField from './fx/LiquidField.jsx';
import s from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  const { practices, products } = useContent();

  return (
    <footer className={`${s.footer} tone-black`} data-fluid-off>
      {site.fx.liquidFooter && <LiquidField />}
      <div className={`container ${s.grid}`}>
        <div className={s.about}>
          <Logo />
          <p className={s.blurb}>
            A software studio building custom AI, web and enterprise systems for clients worldwide, and our own SaaS
            products.
          </p>
          <ul role="list" className={s.reach}>
            <li>
              <a className={s.mail} href={`mailto:${site.contact.email}`}>
                <FiMail aria-hidden /> {site.contact.email}
              </a>
            </li>
            {site.contact.phones?.map((p) => (
              <li key={p}>
                <a className={s.mail} href={telHref(p)}>
                  <FiPhone aria-hidden /> {p}
                </a>
              </li>
            ))}
            {site.contact.address && (
              <li>
                <a className={s.mail} href={mapHref()} target="_blank" rel="noreferrer">
                  <FiMapPin aria-hidden /> {site.contact.address}
                </a>
              </li>
            )}
          </ul>
          <SocialLinks className={s.socials} />
        </div>

        <nav aria-label="Services" className={s.col}>
          <h2 className={s.colTitle}>Services</h2>
          <ul role="list">
            {practices.map((p) => (
              <li key={p.slug}>
                <Link to={`/services/${p.slug}`}>{p.short}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Products" className={s.col}>
          <h2 className={s.colTitle}>Our products</h2>
          <ul role="list">
            {products.map((p) => (
              <li key={p.id}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer">
                    {p.name}
                  </a>
                ) : (
                  <Link to={`/products#${p.id}`}>{p.name}</Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company" className={s.col}>
          <h2 className={s.colTitle}>Company</h2>
          <ul role="list">
            <li>
              <Link to="/work">Work</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className={`container ${s.wordmark}`}>
        <TextPressure text={site.name} />
      </div>

      <div className={`container ${s.bottom}`}>
        <p>
          © {year} {site.legalName}. All rights reserved.
        </p>
        <p>Working with clients across time zones.</p>
      </div>
    </footer>
  );
}
