import styles from "../../pages/Settings/Settings.module.css";

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
    { id: "home", label: "Home Address"},
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

function GroupedOptions({ options }) {
  return (
    <>
      <option value="" disabled>Select your course</option>
      {options.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

function FlatOptions({ options }) {
  return options.map((opt) => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ));
}

export function FormSelect({ id, label, value, onChange, options, name, grouped }) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name || id} value={value} onChange={onChange}>
        {grouped ? <GroupedOptions options={options} /> : <FlatOptions options={options} />}
      </select>
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
