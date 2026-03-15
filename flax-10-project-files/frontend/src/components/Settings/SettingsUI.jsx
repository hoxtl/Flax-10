import styles from "../../pages/Settings/Settings.module.css";
import AnimatedDropdown from "../common/AnimatedDropdown";
import FormField from "../common/FormField/FormField";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import TextInput from "../common/TextInput/TextInput";
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
      <PrimaryButton type="submit" className={styles.btnPrimary} disabled={isSaving} pill>
        {isSaving ? savingLabel : label}
      </PrimaryButton>
    </div>
  );
}

export function FormInput({ id, label, type = "text", value, onChange, required, name, maxLength, autoComplete }) {
  const remaining = maxLength ? maxLength - value.length : null;
  return (
    <FormField
      className={styles.formGroup}
      htmlFor={id}
      label={
        <>
          {label}
          {maxLength && <span style={{ color: 'var(--muted)', fontSize: '0.9em', marginLeft: '5px' }}>({remaining} characters remaining)</span>}
        </>
      }
    >
      <TextInput type={type} id={id} name={name || id} value={value} onChange={onChange} required={required} maxLength={maxLength} autoComplete={autoComplete} />
    </FormField>
  );
}

export function FormSelect({ id, label, value, onChange, options, grouped }) {
  const handleChange = (val) => onChange({ target: { value: val } });
  return (
    <FormField className={styles.formGroup} htmlFor={id} label={label}>
      <AnimatedDropdown value={value} onChange={handleChange} options={options} grouped={grouped} placeholder="Select" searchable={grouped} />
    </FormField>
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

function ThemePreview({ type, data }) {
  return (
    <div className={styles.themePreview} style={{ background: data.bg, borderColor: data.border }}>
      <span className={styles.swatchTitle} style={{ color: data.text }}>{type}</span>
      <div className={styles.swatchGrid}>
        <div className={styles.swatch} style={{ background: data.primary }} />
        <div className={styles.swatch} style={{ background: data.highlight }} />
        <div className={styles.swatch} style={{ background: data.card }} />
        <div className={styles.swatch} style={{ background: data.sidebar }} />
      </div>
    </div>
  );
}

function ThemeCard({ t, currentTheme, onChange }) {
  const isActive = currentTheme === t.id;
  return (
    <div className={`${styles.themeCard} ${isActive ? styles.active : ''}`} onClick={() => onChange(t.id)}>
      <span className={styles.themeName}>{t.name}</span>
      <div className={styles.themePreviewContainer}>
        <ThemePreview type="Light" data={t.light} />
        <ThemePreview type="Dark" data={t.dark} />
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
