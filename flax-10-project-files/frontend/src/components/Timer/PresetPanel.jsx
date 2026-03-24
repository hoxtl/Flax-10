/*
 * Timer presets and configuration panels.
 */

import styles from '../../pages/Timer/TimerPage.module.css';
import { TimerSettings } from './TimerComponents';
import { AutoStartToggle } from './presets/AutoStartToggle';
import { PresetCard } from './presets/PresetCard';
import {
  BUILT_IN_PRESETS,
  applyPreset,
} from './utils/presetUtils';

function PresetGrid({ presets, t, onApply }) {
  return (
    <div className={styles.presetPanelGrid}>
      {presets.map((preset) => <PresetCard key={preset.id} preset={preset} t={t} onApply={onApply} />)}
    </div>
  );
}

function wrapEmbedded(content, embedded) {
  if (embedded) return content;
  return <div className={styles.presetPanelCard}>{content}</div>;
}

export function PresetPanel({ t, embedded = false }) {
  const content = <PresetPanelContent t={t} />;

  return wrapEmbedded(content, embedded);
}

function PresetPanelContent({ t }) {
  return <PresetGrid presets={BUILT_IN_PRESETS} t={t} onApply={(preset) => applyPreset(preset, t)} />;
}

function applyMinutes(minutes, t) {
  t.updateTime('work', minutes);
  t.setTimeLeft(minutes * 60);
}

function adjustMinutes(delta, t) {
  applyMinutes(Math.max(5, Number(t.workTime || 25) + delta), t);
}

function QuickAdjustButtons({ disabled, t }) {
  return (
    <div className={styles.quickAdjustRow}>
      <button type="button" className={styles.quickAdjustBtn} onClick={() => adjustMinutes(-5, t)} disabled={disabled}>-5m</button>
      <button type="button" className={styles.quickAdjustBtn} onClick={() => applyMinutes(25, t)} disabled={disabled}>25m</button>
      <button type="button" className={styles.quickAdjustBtn} onClick={() => applyMinutes(50, t)} disabled={disabled}>50m</button>
      <button type="button" className={styles.quickAdjustBtn} onClick={() => applyMinutes(90, t)} disabled={disabled}>90m</button>
      <button type="button" className={styles.quickAdjustBtn} onClick={() => adjustMinutes(5, t)} disabled={disabled}>+5m</button>
    </div>
  );
}

export function TimerConfigPanel({ t, embedded = false }) {
  const disabled = t.isActive && !t.isPaused;
  const content = (
    <div className={styles.configInsetPanel}>
      <TimerSettings work={t.workTime} breakTime={t.breakTime} sessions={t.targetSessions} onUpdate={t.updateTime} disabled={disabled} />
      <QuickAdjustButtons disabled={disabled} t={t} />
      <AutoStartToggle />
    </div>
  );

  return wrapEmbedded(content, embedded);
}
