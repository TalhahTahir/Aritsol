import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { useContent } from '../content/store';
import { countWord } from '../content/words';
import { AdminAdd, AdminEditWorkflow } from '../components/admin/AdminTools.jsx';
import { usePageMeta } from '../hooks/usePageMeta';
import PracticeIndex from '../components/PracticeIndex.jsx';
import WorkCard from '../components/WorkCard.jsx';
import ProcessSteps from '../components/ProcessSteps.jsx';
import Engagements from '../components/Engagements.jsx';
import Faq from '../components/Faq.jsx';
import CTABand from '../components/CTABand.jsx';
import HeroField from '../components/fx/HeroField.jsx';
import ProjectShowcase from '../components/fx/ProjectShowcase.jsx';
import Magnetic from '../components/fx/Magnetic.jsx';
import Marquee from '../components/fx/Marquee.jsx';
import ProductRail from '../components/fx/ProductRail.jsx';
import Reveal from '../components/fx/Reveal.jsx';
import TypeHeading from '../components/fx/TypeHeading.jsx';
import s from './Home.module.css';

const heroLines = ['We build the', 'software your', 'business runs on.'];

const stackRows = [
  ['React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'TypeScript'],
  ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Microservices'],
  ['Python', 'PyTorch', 'LangGraph', 'Computer Vision', 'RAG'],
];

export default function Home() {
  usePageMeta({ path: '/' });
  const { work, practices } = useContent();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className={s.heroWrap} data-fluid-off>
        {site.fx.heroField && <HeroField />}
        <div className={`container ${s.hero}`}>
          <div className={s.heroCopy}>
            <h1 className={s.heroTitle} aria-label={heroLines.join(' ')}>
              {heroLines.map((line, i) => (
                <span key={line} className={s.line} style={{ '--i': i }} aria-hidden="true">
                  <span>{line}</span>
                </span>
              ))}
            </h1>
            <p className={`lede ${s.heroLede}`}>
              {site.name} is a software studio. We design and engineer AI systems, web platforms, SaaS products and
              Java backends for companies worldwide, and run our own SaaS products on the same stack.
            </p>
            <div className={s.heroActions}>
              <Magnetic>
                <Link to="/contact" className="btn btn--accent">
                  Start a project
                </Link>
              </Magnetic>
              <Magnetic>
                <Link to="/products" className="btn btn--ghost">
                  Explore our products
                </Link>
              </Magnetic>
            </div>
            <p className={s.heroNote}>Free 30-minute discovery call. Written estimate before any work starts.</p>
          </div>
          <ProjectShowcase variant="hero" />
        </div>
        <a href="#practices" className={s.scrollCue}>
          <span className={s.cueLine} aria-hidden="true" />
          Scroll to explore
        </a>
      </section>

      {/* ── Practices ────────────────────────────────────── */}
      <section className="section" id="practices">
        <div className="container">
          <div className="section-head">
            <TypeHeading key={practices.length}>{`${countWord(practices.length)} practices, one accountable team`}</TypeHeading>
            <Reveal as="p" delay={0.2}>
              From a first model to a platform with thousands of users, the same engineers carry the work through.
            </Reveal>
          </div>
          <Reveal delay={0.1} click>
            <PracticeIndex />
          </Reveal>
        </div>
      </section>

      {/* ── Stack marquee ────────────────────────────────── */}
      <section className={s.stack} aria-label="Technologies we use">
        <div className="container">
          <div className="section-head">
            <TypeHeading>The stack we work in</TypeHeading>
            <Reveal as="p" delay={0.2}>
              MERN and Next.js for the web, Java and Spring Boot for enterprise systems, Python for AI.
            </Reveal>
          </div>
        </div>
        <Marquee rows={stackRows} />
      </section>

      {/* ── Products (pinned horizontal scroll on desktop) ── */}
      <section className={s.productsBand}>
        <ProductRail />
      </section>

      {/* ── Process ──────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <TypeHeading>How a project runs</TypeHeading>
            <AdminEditWorkflow />
            <Reveal as="p" delay={0.2}>
              You see working software every week or two, not a big reveal at the end.
            </Reveal>
          </div>
          <ProcessSteps />
        </div>
      </section>

      {/* ── Work ─────────────────────────────────────────── */}
      <section className="section--tight">
        <div className="container">
          <div className={s.splitHead}>
            <div className="section-head">
              <TypeHeading>Selected work</TypeHeading>
            </div>
            <Link to="/work" className="link">
              See all projects
            </Link>
          </div>
          <div className={s.workGrid}>
            {work.slice(0, 3).map((w, i) => (
              <Reveal key={w.id} variant="clip" delay={i * 0.12} click>
                <WorkCard item={w} />
              </Reveal>
            ))}
          </div>
          <AdminAdd type="work" compact className={s.adminAdd} />
        </div>
      </section>

      {/* ── Engagement ───────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <TypeHeading>Ways to work with us</TypeHeading>
          </div>
          <Reveal>
            <Engagements />
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="section--tight">
        <div className={`container ${s.faq}`}>
          <TypeHeading>Common questions</TypeHeading>
          <Reveal delay={0.15}>
            <Faq />
          </Reveal>
        </div>
      </section>

      <Reveal variant="scale">
        <CTABand />
      </Reveal>
    </>
  );
}
