import s from './PageHeader.module.css';

/** Top of every inner page: a breadcrumb-ish context line, title and intro. */
export default function PageHeader({ context, title, intro, children }) {
  return (
    <header className={`container ${s.header}`}>
      {context && <p className={s.context}>{context}</p>}
      <h1 className={s.title}>{title}</h1>
      {intro && <p className="lede">{intro}</p>}
      {children}
    </header>
  );
}
