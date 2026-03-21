import { useTheme } from '../../context/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  return (
    <button
      className={styles.themeToggle}
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className={`${styles.icon} ${isDark ? styles.rotate : ''}`}>
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  );
}