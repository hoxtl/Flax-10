/*
 * Appearance settings section for theme and mode selection.
 */
<<<<<<< HEAD

import styles from "../../../pages/settings/Settings.module.css";
=======
import styles from "../../../pages/Settings/Settings.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import SettingsContextCard from "../SettingsContextCard";
import { SectionHeader, SubmitButton, ThemeGridSelector, ThemeSelector } from "../SettingsUI";

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
<<<<<<< HEAD
      <SubmitButton isSaving={isSaving} label="Save Appearance" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
=======
      <SubmitButton
        isSaving={isSaving}
        label="Save Appearance"
        savingLabel="Saving..."
        hasUnsaved={hasUnsaved}
        saveSignal={saveSignal}
      />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD
=======
        body="Choose a palette that suits your study style:"
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        items={[
          "🔥 Warm — cosy, earthy tones for long sessions",
          "❄️ Cool — clean blues and greens for focus",
          "🌸 Soft — gentle pastels, easy at night",
        ]}
      />
    </div>
  );
}
