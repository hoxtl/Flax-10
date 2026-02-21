import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { SectionHeader, SubmitButton, ThemeSelector } from "./SettingsUI";
import styles from "../../pages/Settings/Settings.module.css";

export default function PreferencesPanel({ onSave, isSaving }) {
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({ theme });

  const handleThemeChange = (newTheme) => {
    setFormData(prev => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Appearance" description="Customize how StudyFlax looks" />
      <div className={styles.formGroup}>
        <label>Theme</label>
        <p className={styles.formDescription}>Choose your preferred color scheme. This will be saved and applied every time you log in.</p>
        <ThemeSelector value={formData.theme} onChange={handleThemeChange} />
      </div>
      <SubmitButton isSaving={isSaving} label="Save Preferences" savingLabel="Saving..." />
    </form>
  );
}