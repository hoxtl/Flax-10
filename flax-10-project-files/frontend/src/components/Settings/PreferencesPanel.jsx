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

function sleepDuration(sleepTime, wakeTime) {
  const [sh, sm] = sleepTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let mins = wh * 60 + wm - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { label: m > 0 ? `${h}h ${m}m` : `${h}h`, meta: `${mins} minutes total` };
}

function SleepCard({ totalMins, duration }) {
  const h = totalMins / 60;
  // Map hours to position on scale: 0h=0%, 10h=100%
  const pct = Math.min(98, Math.max(2, (h / 10) * 100));
  // Colors match the gradient: amber → green → violet
  const color = h > 9 ? "#7c3aed" : h >= 7 ? "#15803d" : h >= 5 ? "#eab308" : "#f59e0b";
  const qualityLabel = h > 9 ? "Too much" : h >= 7 ? "Great" : h >= 5 ? "Fair" : "Low";

  return (
    <div className={styles.sleepDurationCard} role="status" aria-live="polite" style={{ "--sleepLabelColor": color }}>
      <span className={styles.sleepMoonWatermark}>🌙</span>
      <div className={styles.sleepCardTopRow}>
        <div>
          <div className={styles.sleepDurationMain}>{duration.label}</div>
          <div className={styles.sleepDurationMeta}>{duration.meta}</div>
        </div>
        <span className={styles.sleepBatteryLabel}>
          {qualityLabel}
        </span>
      </div>
      <div className={styles.sleepGradientTrack}>
        <div className={styles.sleepGradientIndicator} style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}

function AppearanceSection({ theme, onChange, isSaving }) {
  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <SectionHeader
            title="Appearance"
          />
          <div className={styles.formGroup}>
            <label>Interface Mode</label>
            <ThemeSelector value={theme.mode} onChange={(m) => onChange({ ...theme, mode: m })} />
          </div>
          <div className={styles.formGroup} style={{ marginTop: '16px' }}>
            <ThemeGridSelector value={theme.theme} onChange={(t) => onChange({ ...theme, theme: t })} />
          </div>
          <SubmitButton
            isSaving={isSaving}
            label="Save Appearance"
            savingLabel="Saving..."
          />
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>🎨</span>
        <h3 className={styles.contextCardTitle}>Picking a theme</h3>
        <p className={styles.contextCardBody}>Choose a palette that suits your study style:</p>
        <ul className={styles.contextCardList}>
          <li>🔥 Warm — cosy, earthy tones for long sessions</li>
          <li>❄️ Cool — clean blues and greens for focus</li>
          <li>🌸 Soft — gentle pastels, easy at night</li>
        </ul>
      </div>
    </div>
  );
}

function SleepSection({
  sleepTime,
  wakeTime,
  onSleepChange,
  onWakeChange,
  onSubmit,
  isSaving,
  hasUnsaved,
  saveSignal,
}) {
  const duration = sleepDuration(sleepTime, wakeTime);
  const [sh, sm] = sleepTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let totalMins = wh * 60 + wm - (sh * 60 + sm);
  if (totalMins <= 0) totalMins += 24 * 60;

  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader
              title="Sleep Schedule"
              description="We'll warn you if you try to add tasks during your sleep window."
            />
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Bedtime</label>
                <DateTimePicker
                  value={sleepTime}
                  onChange={(v) => onSleepChange(v || "23:00")}
                  placeholder="Pick bedtime"
                  timeOnly
                />
              </div>
              <div className={styles.formGroup}>
                <label>Wake up</label>
                <DateTimePicker
                  value={wakeTime}
                  onChange={(v) => onWakeChange(v || "07:00")}
                  placeholder="Pick wake time"
                  timeOnly
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Sleep duration</label>
              <SleepCard totalMins={totalMins} duration={duration} />
            </div>
            <SubmitButton
              isSaving={isSaving}
              label="Save Sleep Schedule"
              savingLabel="Saving..."
              hasUnsaved={hasUnsaved}
              saveSignal={saveSignal}
            />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>🌙</span>
        <h3 className={styles.contextCardTitle}>Sleep planning</h3>
        <p className={styles.contextCardBody}>
          StudyFlax uses these hours to reduce late-night prompts and schedule tasks around your rest.
        </p>
        <ul className={styles.contextCardList}>
          <li>Fewer distractions during sleep hours</li>
          <li>Better timing for reminders and sessions</li>
          <li>More realistic daily study plans</li>
        </ul>
      </div>
    </div>
  );
}

export default function PreferencesPanel({ onSave, onSleepSave, isSaving, activeSubTab = "themes" }) {
  const { mode, setMode, theme, setTheme } = useTheme();
  const [sleepTime, setSleepTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [initialSleepTime, setInitialSleepTime] = useState("23:00");
  const [initialWakeTime, setInitialWakeTime] = useState("07:00");
  const [loadingSleep, setLoadingSleep] = useState(true);
  const [sleepSaveSignal, setSleepSaveSignal] = useState(0);

  useEffect(() => {
    getUserSettings()
      .then((data) => {
        if (data?.sleep_time) {
          const nextSleepTime = data.sleep_time.slice(0, 5);
          setSleepTime(nextSleepTime);
          setInitialSleepTime(nextSleepTime);
        }
        if (data?.wake_time) {
          const nextWakeTime = data.wake_time.slice(0, 5);
          setWakeTime(nextWakeTime);
          setInitialWakeTime(nextWakeTime);
        }
      })
      .finally(() => setLoadingSleep(false));
  }, []);

  const handlePreferencesSubmit = (newData) => {
    if (newData.mode) setMode(newData.mode);
    if (newData.theme) setTheme(newData.theme);
    onSave(newData);
  };

  const hasUnsavedSleep = sleepTime !== initialSleepTime || wakeTime !== initialWakeTime;

  if (loadingSleep) return <SectionSkeleton label="Loading preferences" rows={6} />;

  return (
    <div className={styles.preferencesContainer}>
      <div className={styles.preferencesContent}>
        {activeSubTab === 'themes' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePreferencesSubmit({ mode, theme }); }}>
            <AppearanceSection
              theme={{ mode, theme }}
              onChange={(newData) => {
                if (newData.mode) setMode(newData.mode);
                if (newData.theme) setTheme(newData.theme);
              }}
              isSaving={isSaving}
            />
          </form>
        )}

        {activeSubTab === 'sleep' && (
          <SleepSection
            sleepTime={sleepTime}
            wakeTime={wakeTime}
            onSleepChange={setSleepTime}
            onWakeChange={setWakeTime}
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await onSleepSave({ sleep_time: sleepTime, wake_time: wakeTime });
              if (ok) {
                setInitialSleepTime(sleepTime);
                setInitialWakeTime(wakeTime);
                setSleepSaveSignal((s) => s + 1);
              }
            }}
            isSaving={isSaving}
            hasUnsaved={hasUnsavedSleep}
            saveSignal={sleepSaveSignal}
          />
        )}
      </div>
    </div>
  );
}
