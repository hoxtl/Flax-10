import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { SectionHeader, SubmitButton, ThemeSelector, ColorThemeSelector } from "./SettingsUI";
import styles from "../../pages/Settings/Settings.module.css";

function ThemeFormGroup({ theme, onChange }) {
  return (
    <div className={styles.formGroup}>
      <label>Mode</label>
      <p className={styles.formDescription}>Choose between light or dark mode.</p>
      <ThemeSelector value={theme} onChange={onChange} />
    </div>
  );
}

function ColorThemeFormGroup({ colorTheme, onChange }) {
  return (
    <div className={styles.formGroup} style={{ marginTop: '32px' }}>
      <label>Color Theme</label>
      <p className={styles.formDescription}>Personalize your StudyFlax interface with a custom color palette.</p>
      <ColorThemeSelector value={colorTheme} onChange={onChange} />
    </div>
  );
}

function usePreferencesForm() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
  const [formData, setFormData] = useState({ theme, colorTheme });

  const handleThemeChange = (newTheme) => {
    setFormData(prev => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  };

  const handleColorThemeChange = (newColorTheme) => {
    setFormData(prev => ({ ...prev, colorTheme: newColorTheme }));
    setColorTheme(newColorTheme);
  };

  return { formData, handleThemeChange, handleColorThemeChange };
}

export default function PreferencesPanel({ onSave, isSaving }) {
  const { formData, handleThemeChange, handleColorThemeChange } = usePreferencesForm();
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Appearance" description="Customize how StudyFlax looks" />
      <ThemeFormGroup theme={formData.theme} onChange={handleThemeChange} />
      <ColorThemeFormGroup colorTheme={formData.colorTheme} onChange={handleColorThemeChange} />
      <SubmitButton isSaving={isSaving} label="Save Preferences" savingLabel="Saving..." />
    </form>
  );
}