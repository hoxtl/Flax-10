import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { SectionHeader, SubmitButton, ThemeSelector } from "./SettingsUI";
import styles from "../../pages/Settings/Settings.module.css";

function ThemeFormGroup({ theme, onChange }) {
  return (
    <div className={styles.formGroup}>
      <label>Theme</label>
      <p className={styles.formDescription}>Choose your preferred color scheme. This will be saved and applied every time you log in.</p>
      <ThemeSelector value={theme} onChange={onChange} />
    </div>
  );
}

function usePreferencesForm() {
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({ theme });
  const handleThemeChange = (newTheme) => {
    setFormData(prev => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  };
  return { formData, handleThemeChange };
}

export default function PreferencesPanel({ onSave, isSaving }) {
  const { formData, handleThemeChange } = usePreferencesForm();
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Appearance" description="Customize how StudyFlax looks" />
      <ThemeFormGroup theme={formData.theme} onChange={handleThemeChange} />
      <SubmitButton isSaving={isSaving} label="Save Preferences" savingLabel="Saving..." />
    </form>
  );
}