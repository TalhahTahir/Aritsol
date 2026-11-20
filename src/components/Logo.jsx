import { site } from '../config/site';
import BrandMark from './BrandMark.jsx';
import s from './Logo.module.css';

export default function Logo({ size = 30 }) {
  return (
    <span className={s.logo}>
      <BrandMark size={size} />
      <span className={s.word}>{site.name}</span>
    </span>
  );
}
