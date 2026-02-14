import { useTheme } from '../context/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button 
      className={styles.themeToggle} 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className={`${styles.icon} ${isDark ? styles.rotate : ''}`}>
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  );
}