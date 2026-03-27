<<<<<<< HEAD:flax-10-project-files/frontend/src/components/dashboard/components/ThemeToggle.jsx
import { useTheme } from '../../../context/ThemeContext';
import Tooltip from '../../common/Tooltip/Tooltip';
import styles from '../styles/ThemeToggle.module.css';
=======
import { useTheme } from '../../context/ThemeContext';
import Tooltip from '../common/tooltip/Tooltip';
import styles from './ThemeToggle.module.css';
>>>>>>> main:flax-10-project-files/frontend/src/components/dashboard/ThemeToggle.jsx

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
