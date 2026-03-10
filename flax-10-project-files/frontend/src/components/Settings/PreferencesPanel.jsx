import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { SectionHeader, SubmitButton, ThemeSelector, ThemeGridSelector } from "./SettingsUI";
import styles from "../../pages/Settings/Settings.module.css";

function ModeFormGroup({ mode, onChange }) {
  return (
    <div className={styles.formGroup}>
      <label>Interface Mode</label>
      <p className={styles.formDescription}>Choose between light or dark mode.</p>
      <ThemeSelector value={mode} onChange={onChange} />
    </div>
  );
}

function ThemeGridFormGroup({ theme, onChange }) {
  return (
    <div className={styles.formGroup} style={{ marginTop: '32px' }}>
      <label>Color Theme</label>
      <p className={styles.formDescription}>Personalize your StudyFlax interface with a custom color palette.</p>
      <ThemeGridSelector value={theme} onChange={onChange} />
    </div>
  );
}

function usePreferencesForm() {
  const { mode, setMode, theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({ mode, theme });

  const handleModeChange = (newMode) => {
    setFormData(prev => ({ ...prev, mode: newMode }));
    setMode(newMode);
  };

  const handleThemeChange = (newTheme) => {
    setFormData(prev => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  };

  return { formData, handleModeChange, handleThemeChange };
}

export default function PreferencesPanel({ onSave, isSaving }) {
  const { formData, handleModeChange, handleThemeChange } = usePreferencesForm();
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Appearance" description="Customize how StudyFlax looks" />
      <ModeFormGroup mode={formData.mode} onChange={handleModeChange} />
      <ThemeGridFormGroup theme={formData.theme} onChange={handleThemeChange} />
      <SubmitButton isSaving={isSaving} label="Save Preferences" savingLabel="Saving..." />
    </form>
  );
}