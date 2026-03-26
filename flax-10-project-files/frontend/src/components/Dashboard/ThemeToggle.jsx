import { useTheme } from '../../context/ThemeContext';
import Tooltip from '../common/tooltip/Tooltip';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
<<<<<<< HEAD
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
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
