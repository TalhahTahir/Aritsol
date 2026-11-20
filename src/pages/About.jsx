import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { usePageMeta } from '../hooks/usePageMeta';
import { useContent } from '../content/store';
import { listNames } from '../content/words';
import PageHeader from '../components/PageHeader.jsx';
import StackGrid from '../components/StackGrid.jsx';
import ScrollVideo from '../components/ScrollVideo.jsx';
import CTABand from '../components/CTABand.jsx';
import Founders from '../components/Founders.jsx';
import Reveal from '../components/fx/Reveal.jsx';
import TypeHeading from '../components/fx/TypeHeading.jsx';
import s from './About.module.css';

const principles = [
  {
    title: 'Plain scope, plain pricing',
    text: 'You get a written scope and estimate before we start. If something changes, we say so early and in writing.',
  },
  {
    title: 'Working software early',
    text: 'A staging link from the first sprint. You judge progress by using it, not by reading status reports.',
  },
  {
    title: 'You own what we build',
    text: 'Code, designs and documentation are yours. No lock-in, no hidden dependencies on us.',
  },
  {
    title: 'Built to be maintained',
    text: 'Tests, readable code and documentation, so your next developer — or ours — can pick it up quickly.',
  },
];

export default function About() {
  const { products } = useContent();
  usePageMeta({
    title: 'About',
    description: `${site.name} is a software studio building custom software for clients and its own SaaS products.`,
    path: '/about',
  });

  return (
    <>
      <PageHeader
        title="A studio that builds for clients and for itself"
        intro={`${site.name} was founded to do two things well: engineer custom software for businesses, and launch products of our own. Each side makes the other better.`}
      />

      <section className="section--tight">
        <div className={`container ${s.sides}`}>
          <div className={s.side}>
            <h2 className={s.sideTitle}>Client work</h2>
            <p>
              We design and build AI systems, web platforms, SaaS products and enterprise backends for companies
              internationally. Most of our work is long-term: we stay on to support and extend what we launch.
            </p>
            <Link to="/services" className="link">
              Our services
            </Link>
          </div>
          <div className={`${s.side} ${s.sideAlt} tone-black`}>
            <h2 className={s.sideTitle}>Our products</h2>
            <p>
              {listNames(products.map((p) => p.name))} {products.length === 1 ? 'is' : 'are'} built and operated by our team. Running products ourselves
              keeps us honest about what it takes to ship, support and scale software.
            </p>
            <Link to="/products" className="link">
              Our products
            </Link>
          </div>
        </div>
      </section>

      {site.media.officeTourVideo && (
        <ScrollVideo
          src={site.media.officeTourVideo}
          poster={site.media.officeTourPoster || undefined}
          title="Inside the studio"
          caption="Inside the studio. Keep scrolling to walk through."
        />
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <TypeHeading>How we work</TypeHeading>
          </div>
          <ul role="list" className={s.principles}>
            {principles.map((p, i) => (
              <Reveal as="li" key={p.title} className={s.principle} variant="left" delay={(i % 2) * 0.1}>
                <h3 className={s.pTitle}>{p.title}</h3>
                <p className={s.pText}>{p.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <Founders />

      <section className="section--tight">
        <div className="container">
          <div className="section-head">
            <TypeHeading>What we build with</TypeHeading>
          </div>
          <StackGrid />
        </div>
      </section>

      <CTABand />
    </>
  );
}
