import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowUpRight, FiCheck } from 'react-icons/fi';
import { useContent } from '../content/store';
import { AdminEditWorkflow, AdminItemTools } from '../components/admin/AdminTools.jsx';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader.jsx';
import WorkCard from '../components/WorkCard.jsx';
import ProcessSteps from '../components/ProcessSteps.jsx';
import CTABand from '../components/CTABand.jsx';
import NotFound from './NotFound.jsx';
import Reveal from '../components/fx/Reveal.jsx';
import TypeHeading from '../components/fx/TypeHeading.jsx';
import s from './ServiceDetail.module.css';

// The two agent practices are easy to confuse, so each page points to the other.
const siblingNotes = {
  'ai-agents-automation': {
    to: 'agentic-ai-as-a-service',
    text: 'Here we build agents for you, and you own the code. Prefer a ready, hosted agent on a monthly plan?',
    link: 'See Agentic AI as a Service',
  },
  'agentic-ai-as-a-service': {
    to: 'ai-agents-automation',
    text: 'Here you subscribe to agents we host and run. Need a custom agent built and owned by your company?',
    link: 'See AI Agents & Automation',
  },
};

export default function ServiceDetail() {
  const { getPractice, practices, work } = useContent();
  const { slug } = useParams();
  const navigate = useNavigate();
  const p = getPractice(slug);

  usePageMeta({
    title: p ? p.name : 'Service not found',
    description: p?.summary,
    path: `/services/${slug}`,
  });

  if (!p) return <NotFound />;

  const related = work.filter((w) => w.practice === p.slug);
  const others = practices.filter((x) => x.slug !== p.slug);
  const note = siblingNotes[p.slug];

  return (
    <>
      <PageHeader
        context={
          <>
            <Link to="/services">Services</Link> / {p.short}
          </>
        }
        title={p.name}
        intro={p.summary}
      >
        <div className={s.headActions}>
          <Link to={`/contact?service=${p.slug}`} className="btn btn--accent">
            Discuss your project
          </Link>
          {p.fit && (
            <p className={s.fit}>
              <strong>A good fit when</strong> {p.fit.charAt(0).toLowerCase() + p.fit.slice(1)}
            </p>
          )}
          <AdminItemTools type="practices" item={p} inline onDeleted={() => navigate('/services')} />
        </div>
      </PageHeader>

      {note && (
        <div className="container">
          <p className={s.note}>
            {note.text}{' '}
            <Link to={`/services/${note.to}`} className="link">
              {note.link}
            </Link>
          </p>
        </div>
      )}

      <section className="section--tight">
        <div className="container">
          <TypeHeading className={s.h2}>What we offer</TypeHeading>
          <ul role="list" className={s.services}>
            {p.services.map((sv, i) => (
              <Reveal as="li" key={sv.name} className={s.service} delay={(i % 4) * 0.07}>
                <h3 className={s.svName}>{sv.name}</h3>
                <p className={s.svDesc}>{sv.desc}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section--tight">
        <div className={`container ${s.twoCol}`}>
          <div className={s.panel}>
            <h2 className={s.h3}>What you get</h2>
            <ul role="list" className={s.ticks}>
              {p.deliverables.map((d) => (
                <li key={d}>
                  <FiCheck aria-hidden /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className={s.panel}>
            <h2 className={s.h3}>Tools we use</h2>
            <ul role="list" className="chips">
              {p.stack.map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <TypeHeading className={s.h2}>How we work</TypeHeading>
          <AdminEditWorkflow className={s.workflowBtn} />
          <ProcessSteps />
        </div>
      </section>

      {related.length > 0 && (
        <section className="section--tight">
          <div className="container">
            <TypeHeading className={s.h2}>Related work</TypeHeading>
            <div className={s.workGrid}>
              {related.map((w) => (
                <WorkCard key={w.id} item={w} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section--tight">
        <div className="container">
          <h2 className={s.h2}>Other practices</h2>
          <ul role="list" className={s.others}>
            {others.map((o) => (
              <li key={o.slug}>
                <Link to={`/services/${o.slug}`} className={`${s.other} dfill`}>
                  <span>{o.short}</span>
                  <FiArrowUpRight aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTABand title={`Talk to us about ${p.short}`} />
    </>
  );
}
