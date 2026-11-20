import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { useContent } from '../content/store';
import { countWord, listNames } from '../content/words';
import { AdminAdd, AdminItemTools } from '../components/admin/AdminTools.jsx';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader.jsx';
import Engagements from '../components/Engagements.jsx';
import CTABand from '../components/CTABand.jsx';
import Reveal from '../components/fx/Reveal.jsx';
import s from './Services.module.css';

export default function Services() {
  const { practices } = useContent();
  usePageMeta({
    title: 'Services',
    description: `${listNames(practices.map((p) => p.short))}: ${countWord(practices.length, true)} practices, one team.`,
    path: '/services',
  });

  return (
    <>
      <PageHeader
        title={`${countWord(practices.length)} practices, built to work together`}
        intro="Most projects touch more than one of these. An AI feature needs a web app around it; a SaaS product needs a solid backend. One team covers all of it."
      >
        <nav aria-label="Jump to a practice" className={s.jump}>
          <ul role="list" className="chips">
            {practices.map((p) => (
              <li key={p.slug}>
                <a href={`#${p.slug}`} className={`chip ${s.jumpChip}`}>
                  {p.short}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="container">
        {practices.map((p) => (
          <section key={p.slug} id={p.slug} className={s.block} aria-labelledby={`${p.slug}-title`}>
            <AdminItemTools type="practices" item={p} />
            <div className={s.intro}>
              <h2 id={`${p.slug}-title`} className={s.title}>
                {p.name}
              </h2>
              <p className={s.summary}>{p.summary}</p>
              <Link to={`/services/${p.slug}`} className="btn btn--ghost">
                Explore {p.short} <FiArrowUpRight aria-hidden />
              </Link>
            </div>
            <ul role="list" className={s.services}>
              {p.services.map((sv, i) => (
                <Reveal as="li" key={`${i}-${sv.name}`} delay={(i % 2) * 0.08}>
                  <h3 className={s.svName}>{sv.name}</h3>
                  <p className={s.svDesc}>{sv.desc}</p>
                </Reveal>
              ))}
            </ul>
          </section>
        ))}
        <AdminAdd type="practices" />
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Ways to work with us</h2>
          </div>
          <Engagements />
        </div>
      </section>

      <CTABand title="Not sure which practice fits?" text="Describe the problem instead. We will tell you how we would approach it and which skills it needs." />
    </>
  );
}
