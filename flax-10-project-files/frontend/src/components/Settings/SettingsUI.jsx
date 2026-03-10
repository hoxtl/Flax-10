import styles from "../../pages/Settings/Settings.module.css";
import AnimatedDropdown from "../ui/AnimatedDropdown";
import { THEME_GROUPS } from "../../context/ThemeConstants";

export function TabButton({ id, label, isActive, onClick }) {
  return (
    <button className={`${styles.tab} ${isActive ? styles.tabActive : ""}`} onClick={() => onClick(id)}>
      {label}
    </button>
  );
}

export function SettingsTabs({ activeTab, onChange }) {
  const tabs = [
    { id: "account", label: "Account" },
    { id: "security", label: "Security" },
    { id: "preferences", label: "Preferences" },
    { id: "home", label: "Home Address" },
    { id: "sleep", label: "Sleep" },
  ];
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <TabButton key={tab.id} id={tab.id} label={tab.label} isActive={activeTab === tab.id} onClick={onChange} />
      ))}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className={styles.successBanner}>
      <span>✅</span><span>{message}</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className={styles.errorMessage}>
      <span>⚠️</span><span>{message}</span>
    </div>
  );
}

export function SectionHeader({ title, description }) {
  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description && <p className={styles.formDescription}>{description}</p>}
    </div>
  );
}

export function SubmitButton({ isSaving, label, savingLabel }) {
  return (
    <div className={styles.formActions}>
      <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
        {isSaving ? savingLabel : label}
      </button>
    </div>
  );
}

export function FormInput({ id, label, type = "text", value, onChange, required, name, maxLength }) {
  const remaining = maxLength ? maxLength - value.length : null;
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>
        {label}
        {maxLength && <span style={{ color: 'var(--muted)', fontSize: '0.9em', marginLeft: '5px' }}>({remaining} characters remaining)</span>}
      </label>
      <input type={type} id={id} name={name || id} value={value} onChange={onChange} required={required} maxLength={maxLength} />
    </div>
  );
}

export function FormSelect({ id, label, value, onChange, options, grouped }) {
  const handleChange = (val) => onChange({ target: { value: val } });
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      <AnimatedDropdown value={value} onChange={handleChange} options={options} grouped={grouped} placeholder="Select" searchable={grouped} />
    </div>
  );
}

export function ThemeSelector({ value, onChange }) {
  return (
    <div className={styles.themeSelector}>
      <button type="button" className={`${styles.themeOption} ${value === 'light' ? styles.active : ''}`} onClick={() => onChange('light')}>
        <span className={styles.themeIcon}>☀️</span>
        <span className={styles.themeLabel}>Light</span>
      </button>
      <button type="button" className={`${styles.themeOption} ${value === 'dark' ? styles.active : ''}`} onClick={() => onChange('dark')}>
        <span className={styles.themeIcon}>🌙</span>
        <span className={styles.themeLabel}>Dark</span>
      </button>
    </div>
  );
}

function ThemeCard({ t, currentTheme, onChange }) {
  const isActive = currentTheme === t.id;
  return (
    <div className={`${styles.themeCard} ${isActive ? styles.active : ''}`} onClick={() => onChange(t.id)}>
      <span className={styles.themeName}>{t.name}</span>
      <div className={styles.themePreviewContainer}>
        {/* Light Preview */}
        <div className={styles.themePreview} style={{ background: t.light.bg, borderColor: t.light.border }}>
          <span className={styles.swatchTitle} style={{ color: t.light.text }}>Light</span>
          <div className={styles.swatchGrid}>
            <div className={styles.swatch} style={{ background: t.light.primary }} />
            <div className={styles.swatch} style={{ background: t.light.highlight }} />
            <div className={styles.swatch} style={{ background: t.light.card }} />
            <div className={styles.swatch} style={{ background: t.light.sidebar }} />
          </div>
        </div>
        {/* Dark Preview */}
        <div className={styles.themePreview} style={{ background: t.dark.bg, borderColor: t.dark.border }}>
          <span className={styles.swatchTitle} style={{ color: t.dark.text }}>Dark</span>
          <div className={styles.swatchGrid}>
            <div className={styles.swatch} style={{ background: t.dark.primary }} />
            <div className={styles.swatch} style={{ background: t.dark.highlight }} />
            <div className={styles.swatch} style={{ background: t.dark.card }} />
            <div className={styles.swatch} style={{ background: t.dark.sidebar }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeGridSelector({ value, onChange }) {
  return (
    <div>
      {THEME_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: '24px' }}>
          <p className={styles.groupLabel}>{group.label}</p>
          <div className={styles.themeGrid}>
            {group.themes.map(t => (
              <ThemeCard key={t.id} t={t} currentTheme={value} onChange={onChange} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
