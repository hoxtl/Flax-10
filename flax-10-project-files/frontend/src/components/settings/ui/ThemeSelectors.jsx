/*
 * Theme-selection controls used by settings preferences.
 */

import styles from "../../../pages/settings/styles/Settings.module.css";
import { THEME_GROUPS } from "../../../context/ThemeConstants";

const MODE_OPTIONS = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

function ThemeModeOption({ option, value, onChange }) {
  const isActive = value === option.id;
  const previewClassName = [styles.themePreview, option.id === "light" ? styles.themePreviewLight : styles.themePreviewDark].join(" ");

  return (
    <button
      type="button"
      className={`${styles.themeOption} ${isActive ? styles.active : ""}`}
      onClick={() => onChange(option.id)}
    >
      <ThemeModePreview previewClassName={previewClassName} />
      <ThemeModeFooter label={option.label} isActive={isActive} />
    </button>
  );
}

function ThemeModePreview({ previewClassName }) {
  return <div className={previewClassName}><div className={styles.themePreviewBar} /><div className={styles.themePreviewLine} /><div className={`${styles.themePreviewLine} ${styles.themePreviewLineShort}`} /></div>;
}

function ThemeModeFooter({ label, isActive }) {
  return <div className={styles.themeOptionFooter}><span className={styles.themeLabel}>{label}</span><span className={styles.themeCheckmark}>{isActive ? "✓" : ""}</span></div>;
}

export function ThemeSelector({ value, onChange }) {
  return (
    <div className={styles.themeSelector}>
      {MODE_OPTIONS.map((option) => (
        <ThemeModeOption
          key={option.id}
          option={option}
          value={value}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function ThemePreview({ type, data }) {
  const previewVars = { '--tp-bg': data.bg, '--tp-border': data.border, '--tp-text': data.text };
  return (
    <div className={`${styles.themePreview} ${styles.themePreviewColored}`} style={previewVars}>
      <span className={`${styles.swatchTitle} ${styles.swatchTitleColored}`}>{type}</span>
      <div className={styles.swatchGrid}>
        <div className={styles.swatch} style={{ background: data.primary }} />
        <div className={styles.swatch} style={{ background: data.highlight }} />
        <div className={styles.swatch} style={{ background: data.card }} />
        <div className={styles.swatch} style={{ background: data.sidebar }} />
      </div>
    </div>
  );
}

function ThemeCard({ theme, currentTheme, onChange }) {
  const isActive = currentTheme === theme.id;

  return (
    <div className={`${styles.themeCard} ${isActive ? styles.active : ""}`} onClick={() => onChange(theme.id)}>
      <span className={styles.themeName}>{theme.name}</span>
      <div className={styles.themePreviewContainer}>
        <ThemePreview type="Light" data={theme.light} />
        <ThemePreview type="Dark" data={theme.dark} />
      </div>
    </div>
  );
}

function ThemeGroup({ group, value, onChange }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <p className={styles.groupLabel}>{group.label}</p>
      <div className={styles.themeGrid}>
        {group.themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            currentTheme={value}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

export function ThemeGridSelector({ value, onChange }) {
  return <div>{THEME_GROUPS.map((group) => <ThemeGroup key={group.label} group={group} value={value} onChange={onChange} />)}</div>;
}
