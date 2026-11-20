import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';
import s from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" className={s.toggle} onClick={toggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <span className={s.icon} key={theme}>
        {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
      </span>
    </button>
  );
}
