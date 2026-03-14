import styles from "../../pages/Settings/Settings.module.css";
import AnimatedDropdown from "../common/AnimatedDropdown";
import FormField from "../common/FormField/FormField";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import TextInput from "../common/TextInput/TextInput";

export function TabButton({ id, label, isActive, onClick }) {
  return (
    <button
      className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
      onClick={() => onClick(id)}
    >
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
    { id: "course", label: "Course Change" },
  ];
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          id={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={onChange}
        />
      ))}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className={styles.successBanner}>
      <span>✅</span>
      <span>{message}</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className={styles.errorMessage}>
      <span>⚠️</span>
      <span>{message}</span>
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
      <PrimaryButton
        type="submit"
        className={styles.btnPrimary}
        disabled={isSaving}
        pill
      >
        {isSaving ? savingLabel : label}
      </PrimaryButton>
    </div>
  );
}

export function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  name,
  maxLength,
}) {
  const remaining = maxLength ? maxLength - value.length : null;
  return (
    <FormField
      className={styles.formGroup}
      htmlFor={id}
      label={
        <>
          {label}
          {maxLength && (
            <span
              style={{
                color: "var(--muted)",
                fontSize: "0.9em",
                marginLeft: "5px",
              }}
            >
              ({remaining} characters remaining)
            </span>
          )}
        </>
      }
    >
      <TextInput
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
      />
    </FormField>
  );
}

export function FormSelect({ id, label, value, onChange, options, grouped }) {
  const handleChange = (val) => onChange({ target: { value: val } });
  return (
    <FormField className={styles.formGroup} htmlFor={id} label={label}>
      <AnimatedDropdown
        value={value}
        onChange={handleChange}
        options={options}
        grouped={grouped}
        placeholder="Select"
        searchable={grouped}
      />
    </FormField>
  );
}

export function ThemeSelector({ value, onChange }) {
  return (
    <div className={styles.themeSelector}>
      <button
        type="button"
        className={`${styles.themeOption} ${value === "light" ? styles.active : ""}`}
        onClick={() => onChange("light")}
      >
        <span className={styles.themeIcon}>☀️</span>
        <span className={styles.themeLabel}>Light</span>
      </button>
      <button
        type="button"
        className={`${styles.themeOption} ${value === "dark" ? styles.active : ""}`}
        onClick={() => onChange("dark")}
      >
        <span className={styles.themeIcon}>🌙</span>
        <span className={styles.themeLabel}>Dark</span>
      </button>
    </div>
  );
}
