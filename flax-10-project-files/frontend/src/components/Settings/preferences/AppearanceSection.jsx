/*
 * Appearance settings section for theme and mode selection.
 */
import styles from "../../../pages/Settings/Settings.module.css";
import SettingsContextCard from "../SettingsContextCard";
import { SectionHeader, SubmitButton, ThemeGridSelector, ThemeSelector } from "../SettingsUI";

function AppearanceForm({ theme, onChange, isSaving }) {
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
      <SubmitButton isSaving={isSaving} label="Save Appearance" savingLabel="Saving..." />
    </div>
  );
}

export default function AppearanceSection({ theme, onChange, isSaving }) {
  return (
    <div className={styles.twoColLayout}>
      <div><AppearanceForm theme={theme} onChange={onChange} isSaving={isSaving} /></div>
      <SettingsContextCard
        emoji="🎨"
        title="Picking a theme"
        body="Choose a palette that suits your study style:"
        items={[
          "🔥 Warm — cosy, earthy tones for long sessions",
          "❄️ Cool — clean blues and greens for focus",
          "🌸 Soft — gentle pastels, easy at night",
        ]}
      />
    </div>
  );
}
