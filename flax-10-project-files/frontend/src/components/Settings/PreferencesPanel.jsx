/**
 * Combined Preferences panel covering Appearance (theme) and Sleep Schedule.
 * Each section saves independently via its own submit handler.
 */
import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { getUserSettings } from "../../api/userService";
import DateTimePicker from "../../pages/Tasks/components/DateTimePicker";
import { SectionHeader, SubmitButton, ThemeSelector, ThemeGridSelector } from "./SettingsUI";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";
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

export default function PreferencesPanel({ onSave, onSleepSave, isSaving, activeSubTab = "themes" }) {
  const { formData, handleModeChange, handleThemeChange: handleLocalThemeChange } = usePreferencesForm();

  const [sleepTime, setSleepTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [loadingSleep, setLoadingSleep] = useState(true);

  useEffect(() => {
    getUserSettings()
      .then((data) => {
        if (data?.sleep_time) setSleepTime(data.sleep_time.slice(0, 5));
        if (data?.wake_time) setWakeTime(data.wake_time.slice(0, 5));
      })
      .finally(() => setLoadingSleep(false));
  }, []);

  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleSleepSubmit = (e) => {
    e.preventDefault();
    onSleepSave({ sleep_time: sleepTime, wake_time: wakeTime });
  };

  const getSleepStats = () => {
    const [sh, sm] = sleepTime.split(":").map(Number);
    const [wh, wm] = wakeTime.split(":").map(Number);
    let mins = wh * 60 + wm - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const totalHours = h + m / 60;
    
    // Map 4h-12h to 0-100% for the gradient track
    const minH = 4;
    const maxH = 12;
    const pct = Math.min(100, Math.max(0, ((totalHours - minH) / (maxH - minH)) * 100));
    
    return {
      label: m > 0 ? `${h}h ${m}m` : `${h}h`,
      percentage: pct
    };
  };

  if (loadingSleep) return <SectionSkeleton label="Loading preferences" rows={6} />;

  const stats = getSleepStats();

  return (
    <div className={styles.preferencesContainer}>
      <div className={styles.preferencesContent}>
        {activeSubTab === 'themes' && (
          <form onSubmit={handlePreferencesSubmit} className={styles.form}>
            <SectionHeader title="Appearance" description="Customize how StudyFlax looks" />
            <ModeFormGroup mode={formData.mode} onChange={handleModeChange} />
            <ThemeGridFormGroup theme={formData.theme} onChange={handleLocalThemeChange} />
            <SubmitButton isSaving={isSaving} label="Save Appearance" savingLabel="Saving..." />
          </form>
        )}

        {activeSubTab === 'sleep' && (
          <form onSubmit={handleSleepSubmit} className={styles.form}>
            <SectionHeader
              title="Sleep Schedule"
              description="We'll warn you if you try to add tasks during your sleep window."
            />

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Bedtime</label>
                <DateTimePicker
                  value={sleepTime}
                  onChange={(v) => setSleepTime(v || "23:00")}
                  placeholder="Pick bedtime"
                  timeOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label>Wake up</label>
                <DateTimePicker
                  value={wakeTime}
                  onChange={(v) => setWakeTime(v || "07:00")}
                  placeholder="Pick wake time"
                  timeOnly
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Sleep duration</label>
              <div className={styles.sleepDurationCard}>
                <div className={styles.sleepMoonWatermark}>🌙</div>
                <div className={stats.percentage > 40 && stats.percentage < 70 ? styles.sleepDurationMainIdeal : styles.sleepDurationMain}>
                  {stats.label}
                </div>
                <div className={styles.sleepDurationMeta}>
                  {stats.percentage > 40 && stats.percentage < 70 ? "Ideal performance" : "Outside recommended range"}
                </div>
                <div className={styles.sleepGradientTrack}>
                  <div 
                    className={styles.sleepGradientIndicator} 
                    style={{ left: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            <SubmitButton isSaving={isSaving} label="Save Sleep Schedule" savingLabel="Saving..." />
          </form>
        )}
      </div>
    </div>
  );
}
