/*
 * Appearance settings section for theme and mode selection.
 */

<<<<<<< HEAD
import styles from "../../../pages/settings/styles/Settings.module.css";
import SettingsContextCard from "../components/SettingsContextCard";
import { SectionHeader, SubmitButton, ThemeGridSelector, ThemeSelector } from "../components/SettingsUI";
=======
import styles from "../../../pages/settings/Settings.module.css";
import SettingsContextCard from "../SettingsContextCard";
import { SectionHeader, SubmitButton, ThemeGridSelector, ThemeSelector } from "../SettingsUI";
>>>>>>> main

function AppearanceForm({ theme, onChange, isSaving, hasUnsaved, saveSignal }) {
  return (
    <div className={styles.settingsTile}>
      <SectionHeader title="Appearance" />
      <div className={styles.formGroup}>
        <label>Interface Mode</label>
        <ThemeSelector value={theme.mode} onChange={(mode) => onChange({ ...theme, mode })} />
      </div>
      <div className={styles.formGroup} style={{ marginTop: "16px" }}>
        <ThemeGridSelector value={theme.theme} onChange={(nextTheme) => onChange({ ...theme, theme: nextTheme })} />
      </div>
      <SubmitButton isSaving={isSaving} label="Save Appearance" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
    </div>
  );
}

export default function AppearanceSection({ theme, onChange, isSaving, hasUnsaved, saveSignal }) {
  return (
    <div className={styles.twoColLayout}>
      <div><AppearanceForm theme={theme} onChange={onChange} isSaving={isSaving} hasUnsaved={hasUnsaved} saveSignal={saveSignal} /></div>
      <SettingsContextCard
        emoji="🎨"
        title="Picking a theme"
        items={[
          "🔥 Warm — cosy, earthy tones for long sessions",
          "❄️ Cool — clean blues and greens for focus",
          "🌸 Soft — gentle pastels, easy at night",
        ]}
      />
    </div>
  );
}
