/*
 * Saving custom timer presets.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';

function SaveButtons({ onSave, setSaving }) {
  return (
    <>
      <button className={styles.presetSaveConfirm} onClick={onSave}>Save</button>
      <button className={styles.presetSaveCancel} onClick={() => setSaving(false)}>Cancel</button>
    </>
  );
}

function SaveForm({ saveName, setSaveName, setSaving, onSave }) {
  return (
    <div className={styles.presetSaveForm}>
      <input className={styles.presetNameInput} placeholder="Preset name…" value={saveName} onChange={(event) => setSaveName(event.target.value)} onKeyDown={(event) => handleSaveKeyDown(event, onSave, setSaving)} autoFocus maxLength={24} />
      <SaveButtons onSave={onSave} setSaving={setSaving} />
    </div>
  );
}

function handleSaveKeyDown(event, onSave, setSaving) {
  if (event.key === 'Enter') return onSave();
  if (event.key === 'Escape') setSaving(false);
}

export function PresetSaveArea({ saving, saveName, setSaveName, setSaving, disabled, onSave }) {
  if (saving) return <SaveForm saveName={saveName} setSaveName={setSaveName} setSaving={setSaving} onSave={onSave} />;

  return (
    <button className={styles.presetSaveBtn} onClick={() => setSaving(true)} disabled={disabled}>
      + Save current
    </button>
  );
}
