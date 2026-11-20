import { useSearchParams } from 'react-router-dom';
import { useContent } from '../content/store';
import { AdminAdd } from '../components/admin/AdminTools.jsx';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader.jsx';
import WorkCard from '../components/WorkCard.jsx';
import CTABand from '../components/CTABand.jsx';
import Reveal from '../components/fx/Reveal.jsx';
import s from './Work.module.css';

export default function Work() {
  const { practices, work } = useContent();
  usePageMeta({
    title: 'Work',
    description: 'Selected projects across AI, web, SaaS, enterprise Java and AI agents.',
    path: '/work',
  });

  const [params, setParams] = useSearchParams();
  const active = params.get('practice') || 'all';
  const filters = [{ slug: 'all', short: 'All work' }, ...practices.filter((p) => work.some((w) => w.practice === p.slug))];
  const items = active === 'all' ? work : work.filter((w) => w.practice === active);

  const choose = (slug) => {
    if (slug === 'all') setParams({}, { replace: true });
    else setParams({ practice: slug }, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Work"
        intro="A selection of what we have built. Ask us for a walkthrough of anything here, including code and architecture."
      />

      <div className="container">
        <div className={s.filters} role="group" aria-label="Filter by practice">
          {filters.map((f) => (
            <button
              key={f.slug}
              type="button"
              className={`${s.filter} dfill`}
              aria-pressed={active === f.slug}
              onClick={() => choose(f.slug)}
            >
              {f.short}
            </button>
          ))}
        </div>

        <p className="visually-hidden" aria-live="polite">
          {items.length} projects shown
        </p>

        {items.length > 0 ? (
          <div className={s.grid}>
            {items.map((w, i) => (
              <Reveal key={w.id} variant="clip" delay={(i % 3) * 0.1} click>
                <WorkCard item={w} />
              </Reveal>
            ))}
            <AdminAdd type="work" />
          </div>
        ) : (
          <div className={s.empty}>
            <p>No projects in this practice yet.</p>
            <button type="button" className="btn btn--ghost" onClick={() => choose('all')}>
              Show all work
            </button>
          </div>
        )}
      </div>

      <div className="section--tight" />
      <CTABand />
    </>
  );
}
