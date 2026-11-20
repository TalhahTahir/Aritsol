import { FiLinkedin } from 'react-icons/fi';
import { site } from '../config/site';
import { founders } from '../data/team';
import Ferrofluid from './fx/Ferrofluid.jsx';
import Reveal from './fx/Reveal.jsx';
import TypeHeading from './fx/TypeHeading.jsx';
import s from './Founders.module.css';

/** The founders, standing over a glossy black ferrofluid field that reacts to the cursor like a magnet. */
export default function Founders() {
  return (
    <section className={`${s.section} tone-black`} aria-label="The founders" data-fluid-off>
      {site.fx.ferrofluid && <Ferrofluid />}

      <div className={`container ${s.inner}`}>
        <div className={s.head}>
          <TypeHeading as="h2" className={s.title}>
            The founders
          </TypeHeading>
          <p className={s.intro}>
            {site.name} is founder-led. The people you speak to on the first call are the people who design and build
            your software.
          </p>
          <p className={s.hint} aria-hidden="true">
            Move your cursor over the fluid. It follows like a magnet.
          </p>
        </div>

        <ul role="list" className={s.grid}>
          {founders.map((f, i) => (
            <Reveal as="li" key={i} className={s.card} delay={i * 0.15}>
              <figure className={`${s.portrait} ${f.cutout && f.photo ? s.cutout : ''} ${f.mono ? s.mono : ''}`}>
                {f.photo ? (
                  <img src={f.photo} alt={`${f.name}, ${f.role}`} loading="lazy" />
                ) : (
                  <span className={s.placeholder} aria-hidden="true">
                    {f.initials}
                  </span>
                )}
              </figure>
              <div className={s.meta}>
                <h3 className={s.name}>
                  {f.name}
                </h3>
                <p className={s.role}>
                  {f.role}, {f.focus}
                </p>
                <p className={s.bio}>{f.bio}</p>
                {f.linkedin && (
                  <a href={f.linkedin} target="_blank" rel="noreferrer" className="link">
                    <FiLinkedin aria-hidden /> LinkedIn
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
