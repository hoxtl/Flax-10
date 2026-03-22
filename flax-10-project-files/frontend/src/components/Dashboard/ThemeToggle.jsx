import { useTheme } from '../../context/ThemeContext';
import Tooltip from '../Common/Tooltip/Tooltip';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  const tooltip = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <Tooltip content={tooltip} position="bottom" wrapperClassName={styles.tooltipWrap}>
      <button
        className={styles.themeToggle}
        onClick={() => setMode(isDark ? 'light' : 'dark')}
        aria-label="Toggle theme"
      >
        <div className={`${styles.icon} ${isDark ? styles.rotate : ''}`}>
          {isDark ? '🌙' : '☀️'}
        </div>
      </button>
    </Tooltip>
  );
}
