import { FiArrowUpRight } from 'react-icons/fi';
import { statusLabel } from '../data/products';
import { useContent } from '../content/store';
import { AdminAdd, AdminItemTools } from './admin/AdminTools.jsx';
import s from './ProductList.module.css';

/** Our SaaS products. `detailed` shows the full description and highlights (Products page). */
export default function ProductList({ detailed = false }) {
  const { products } = useContent();
  return (
    <>
    <ul role="list" className={`${s.list} ${detailed ? s.detailed : ''}`}>
      {products.map((p) => (
        <li key={p.id} id={p.id} className={s.item}>
          <AdminItemTools type="products" item={p} />
          <div className={s.nameCol}>
            <span className={`status ${p.status === 'live' ? 'status--live' : ''}`}>{statusLabel[p.status]}</span>
            <h3 className={s.name}>{p.name}</h3>
            {detailed && p.image && <img className={s.shot} src={p.image} alt={`${p.name} screenshot`} loading="lazy" />}
          </div>

          <div className={s.textCol}>
            <p className={s.oneLiner}>{p.oneLiner}</p>
            {detailed && (
              <>
                <p className={s.desc}>{p.description}</p>
                {p.audience && (
                  <p className={s.audience}>
                    <span className="muted">Made for:</span> {p.audience}
                  </p>
                )}
                <ul role="list" className="chips">
                  {p.highlights.map((h) => (
                    <li key={h} className="chip">
                      {h}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className={s.actionCol}>
            {p.url ? (
              <a href={p.url} target="_blank" rel="noreferrer" className="btn btn--ghost">
                Visit {p.name} <FiArrowUpRight aria-hidden />
              </a>
            ) : (
              <span className="btn btn--ghost" aria-disabled="true">
                Site launching soon
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
    <AdminAdd type="products" compact className={s.adminAdd} />
    </>
  );
}
