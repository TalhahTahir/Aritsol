import { useState } from 'react';
import { FiArrowUpRight, FiGithub, FiImage } from 'react-icons/fi';
import { useContent } from '../content/store';
import { AdminItemTools } from './admin/AdminTools.jsx';
import Lightbox from './Lightbox.jsx';
import s from './WorkCard.module.css';

export default function WorkCard({ item }) {
  const { getPractice } = useContent();
  const practice = getPractice(item.practice);
  const [viewer, setViewer] = useState(false);
  // main image first, then the gallery
  const photos = [item.image, ...(item.gallery || [])].filter(Boolean);
  const hasGallery = (item.gallery || []).length > 0;
  const art = item.image ? <img src={item.image} alt={`Screenshot of ${item.title}`} loading="lazy" /> : <CoverArt seed={item.id} />;
  return (
    <article id={item.id} className={s.card} data-keep-clear>
      <AdminItemTools type="work" item={item} />
      <div className={`${s.cover} ${item.tone ? `tone-${item.tone}` : ''}`}>
        {hasGallery ? (
          <button type="button" className={s.coverBtn} onClick={() => setViewer(true)} aria-label={`View ${photos.length} images of ${item.title}`}>
            {art}
            <span className={s.photos}>
              <FiImage aria-hidden /> {photos.length} images
            </span>
          </button>
        ) : (
          art
        )}
        {item.sample && <span className={s.sample}>Sample project</span>}
      </div>
      {viewer && (
        <Lightbox
          title={item.title}
          images={photos.map((src, i) => ({ src, alt: `${item.title}, image ${i + 1} of ${photos.length}` }))}
          onClose={() => setViewer(false)}
        />
      )}
      <div className={s.body}>
        <p className={s.practice}>{practice?.short}</p>
        <h3 className={s.title}>{item.title}</h3>
        <p className={s.summary}>{item.summary}</p>
        <ul role="list" className="chips">
          {(item.stack || []).map((t) => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
        {(item.links?.live || item.links?.code) && (
          <div className={s.links}>
            {item.links.live && (
              <a href={item.links.live} target="_blank" rel="noreferrer" className="link">
                Live site <FiArrowUpRight aria-hidden />
              </a>
            )}
            {item.links.code && (
              <a href={item.links.code} target="_blank" rel="noreferrer" className="link">
                <FiGithub aria-hidden /> Code
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/** Placeholder art until a real screenshot is added: a simple interface sketch. */
function CoverArt({ seed }) {
  const n = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const bars = [0, 1, 2, 3, 4].map((i) => 30 + ((n * (i + 3)) % 60));
  return (
    <svg viewBox="0 0 400 240" className={s.art} aria-hidden="true">
      <rect x="40" y="36" width="320" height="190" rx="14" className={s.window} />
      <circle cx="62" cy="56" r="5" className={s.dot} />
      <circle cx="80" cy="56" r="5" className={s.dot} />
      <circle cx="98" cy="56" r="5" className={s.dot} />
      <rect x="60" y="84" width="90" height="10" rx="5" className={s.lineA} />
      <rect x="60" y="104" width="60" height="8" rx="4" className={s.lineB} />
      <rect x="60" y="120" width="76" height="8" rx="4" className={s.lineB} />
      {bars.map((h, i) => (
        <rect key={i} x={180 + i * 34} y={206 - h * 1.4} width="20" height={h * 1.4} rx="4" className={i === n % 5 ? s.barHi : s.bar} />
      ))}
    </svg>
  );
}
