/**
 * Shared UI primitives and the sidebar navigation for the Settings page.
 */
import { User, Lock, MapPin, BookOpen, Paintbrush, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "../../pages/Settings/Settings.module.css";
import AnimatedDropdown from "../common/AnimatedDropdown";
import FormField from "../common/FormField/FormField";
export { FormField };
import InlineAlert from "../common/InlineAlert/InlineAlert";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import TextInput from "../common/TextInput/TextInput";
import { THEME_GROUPS } from "../../context/ThemeConstants";

const TAB_CONFIG = [
  { id: "account", label: "Account", icon: User, group: "My Details" },
  { id: "home", label: "Location", icon: MapPin, group: "My Details" },
  { id: "security", label: "Security", icon: Lock, group: "My Details" },
  { id: "preferences_themes", label: "Themes", icon: Paintbrush, group: "Preferences" },
  { id: "preferences_sleep", label: "Sleep Time", icon: Moon, group: "Preferences" },
  { id: "course", label: "Teacher Access", icon: BookOpen, group: "Teacher" },
];

function getProfileCompletion(user) {
  const checks = [
    Boolean(user?.first_name),
    Boolean(user?.last_name),
    Boolean(user?.email),
    Boolean(user?.major),
    Boolean(user?.year_of_study || user?.year),
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

/**
 * Vertical sidebar navigation with grouped nav items and a user profile header.
 *
 * @param {object} props
 * @param {string} props.activeTab
 * @param {Function} props.onChange
 * @param {object} props.user
 */
export function SettingsSidebar({ activeTab, onChange, user }) {
  const groups = [...new Set(TAB_CONFIG.map((t) => t.group))];

  return (
    <aside className={styles.sidebar}>
      {(() => {
        const pct = getProfileCompletion(user);
        return pct < 100 ? (
          <div className={styles.profileCompletion}>
            <div className={styles.profileCompletionHeader}>
              <span>Profile</span>
              <span>{pct}%</span>
            </div>
            <div className={styles.profileCompletionBar}>
              <div className={styles.profileCompletionFill} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : null;
      })()}

      <nav className={styles.sidebarNav}>
        {groups.map((group) => (
          <div key={group} className={styles.sidebarGroup} style={{ width: "100%" }}>
            <div className={styles.sidebarSectionLabel}>{group}</div>
            {TAB_CONFIG.filter((t) => t.group === group).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ""}`}
                  onClick={() => onChange(tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  <Icon className={styles.navIcon} size={15} strokeWidth={2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function SettingsTabs({ activeTab, onChange }) {
  return <SettingsSidebar activeTab={activeTab} onChange={onChange} />;
}

export function TabButton({ id, label, isActive, onClick }) {
  return (
    <button
      className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  );
}

export function SuccessBanner({ message }) {
  return <InlineAlert message={message} variant="success" />;
}

export function ErrorMessage({ message }) {
  return <InlineAlert message={message} variant="error" />;
}

export function SectionHeader({ title, description }) {
  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description && <p className={styles.formDescription}>{description}</p>}
    </div>
  );
}

export function SubmitButton({
  isSaving,
  label,
  savingLabel,
  hasUnsaved = false,
  saveSignal = 0,
  savedLabel = "Saved!",
}) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!saveSignal) return undefined;
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saveSignal]);

  const buttonLabel = isSaving ? savingLabel : showSaved ? `✓ ${savedLabel}` : label;

  return (
    <div className={styles.formActions}>
      <PrimaryButton
        type="submit"
        className={`${styles.btnPrimary} ${hasUnsaved && !isSaving && !showSaved ? styles.btnPrimaryNeedsSave : ""} ${showSaved ? styles.btnPrimarySaved : ""}`}
        disabled={isSaving}
        pill
      >
        {buttonLabel}
      </PrimaryButton>
    </div>
  );
}

export function FormInput({ id, label, type = "text", value, onChange, required, name, maxLength, autoComplete }) {
  const remaining = maxLength ? maxLength - value.length : null;
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>
        {label}
        {maxLength && <span style={{ color: 'var(--muted)', fontSize: '0.9em', marginLeft: '5px' }}>({remaining} characters remaining)</span>}
      </label>
      <TextInput type={type} id={id} name={name || id} value={value} onChange={onChange} required={required} maxLength={maxLength} autoComplete={autoComplete} />
    </div>
  );
}

export function FormSelect({ id, label, value, onChange, options, grouped }) {
  const handleChange = (val) => onChange({ target: { value: val } });
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      <AnimatedDropdown
        value={value}
        onChange={handleChange}
        options={options}
        grouped={grouped}
        placeholder="Select"
        searchable={grouped}
        usePortal
      />
    </div>
  );
}

/**
 * Theme selection cards with mini UI preview mockups.
 *
 * @param {object} props
 * @param {"light"|"dark"} props.value
 * @param {Function} props.onChange
 */
export function ThemeSelector({ value, onChange }) {
  return (
    <div className={styles.themeSelector}>
      {[
        { id: "light", label: "Light" },
        { id: "dark", label: "Dark" },
      ].map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`${styles.themeOption} ${value === opt.id ? styles.active : ""}`}
          onClick={() => onChange(opt.id)}
        >
          <div className={`${styles.themePreview} ${opt.id === "light" ? styles.themePreviewLight : styles.themePreviewDark}`}>
            <div className={styles.themePreviewBar} />
            <div className={styles.themePreviewLine} />
            <div className={`${styles.themePreviewLine} ${styles.themePreviewLineShort}`} />
          </div>
          <div className={styles.themeOptionFooter}>
            <span className={styles.themeLabel}>{opt.label}</span>
            <span className={styles.themeCheckmark}>
              {value === opt.id && "✓"}
            </span>
          </div>
        </button>
      ))}
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
