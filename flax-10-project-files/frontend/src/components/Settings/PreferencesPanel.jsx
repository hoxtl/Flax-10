/*
 * Preferences panel for appearance and sleep settings.
 */
import { useTheme } from "../../context/ThemeContext";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";
import styles from "../../pages/Settings/Settings.module.css";
import AppearanceSection from "./preferences/AppearanceSection";
import SleepSection from "./preferences/SleepSection";
import useSleepScheduleSettings from "./preferences/useSleepScheduleSettings";

function AppearanceForm({ mode, setMode, theme, setTheme, onSave, isSaving }) {
  const handleChange = (nextData) => {
    if (nextData.mode) setMode(nextData.mode);
    if (nextData.theme) setTheme(nextData.theme);
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave({ mode, theme }); }}>
      <AppearanceSection theme={{ mode, theme }} onChange={handleChange} isSaving={isSaving} />
    </form>
  );
}

function AppearanceSection({ theme, onChange, isSaving, saveSignal }) {
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
            saveSignal={saveSignal}
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
function SleepSettingsPanel({ settings, onSleepSave, isSaving }) {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await onSleepSave({ sleep_time: settings.sleepTime, wake_time: settings.wakeTime });
    if (ok) settings.markSaved();
  };

  return (
    <SleepSection
      sleepTime={settings.sleepTime}
      wakeTime={settings.wakeTime}
      onSleepChange={settings.setSleepTime}
      onWakeChange={settings.setWakeTime}
      onSubmit={handleSubmit}
      isSaving={isSaving}
      hasUnsaved={settings.hasUnsavedSleep}
      saveSignal={settings.saveSignal}
    />
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
  const [appearanceSaveSignal, setAppearanceSaveSignal] = useState(0);

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

  const handlePreferencesSubmit = async (newData) => {
    if (newData.mode) setMode(newData.mode);
    if (newData.theme) setTheme(newData.theme);
    await onSave(newData);
    setAppearanceSaveSignal((s) => s + 1);
  };

  const hasUnsavedSleep = sleepTime !== initialSleepTime || wakeTime !== initialWakeTime;

  if (loadingSleep) return <SectionSkeleton label="Loading preferences" rows={6} />;
  const sleepSettings = useSleepScheduleSettings();

  if (sleepSettings.loading) return <SectionSkeleton label="Loading preferences" rows={6} />;

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
              saveSignal={appearanceSaveSignal}
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
        {activeSubTab === "themes" ? (
          <AppearanceForm mode={mode} setMode={setMode} theme={theme} setTheme={setTheme} onSave={onSave} isSaving={isSaving} />
        ) : null}
        {activeSubTab === "sleep" ? (
          <SleepSettingsPanel settings={sleepSettings} onSleepSave={onSleepSave} isSaving={isSaving} />
        ) : null}
      </div>
    </div>
  );
}
