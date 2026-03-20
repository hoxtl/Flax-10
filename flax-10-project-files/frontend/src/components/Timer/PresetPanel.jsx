/*
 * Timer presets and configuration panels.
 */

import { useState } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import { TimerSettings } from './TimerComponents';
import { AutoStartToggle } from './presets/AutoStartToggle';
import { DailyGoalWidget } from './presets/DailyGoalWidget';
import { PresetCard } from './presets/PresetCard';
import { PresetSaveArea } from './presets/PresetSaveArea';
import {
  BUILT_IN_PRESETS,
  applyPreset,
  loadCustomPresets,
  loadPresetUsage,
  saveCustomPresets,
  savePresetUsage,
} from './utils/presetUtils';

function listPresets(customPresets) {
  return [...BUILT_IN_PRESETS, ...customPresets];
}

function saveCurrentPreset(saveName, setSaving, setSaveName, setCustomPresets, customPresets, t) {
  const name = saveName.trim();
  if (!name) return setSaving(false);
  const updated = [...customPresets, createPreset(name, t)];
  setCustomPresets(updated);
  saveCustomPresets(updated);
  setSaving(false);
  setSaveName('');
}

function createPreset(name, t) {
  return { id: `custom_${Date.now()}`, label: name, work: t.workTime, brk: t.breakTime, sessions: t.targetSessions };
}

function usePresetState() {
  const [customPresets, setCustomPresets] = useState(loadCustomPresets);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');

  return { customPresets, setCustomPresets, saving, setSaving, saveName, setSaveName };
}

function usePresetActions(state, t) {
  const sortedPresets = listPresets(state.customPresets);
  const applyPresetAndTrack = (preset) => trackPresetUsage(preset, state, t);
  const handleDelete = (id) => deletePreset(id, state.customPresets, state.setCustomPresets);
  const handleSave = () => saveCurrentPreset(state.saveName, state.setSaving, state.setSaveName, state.setCustomPresets, state.customPresets, t);

  return { sortedPresets, applyPresetAndTrack, handleDelete, handleSave };
}

function trackPresetUsage(preset, state, t) {
  applyPreset(preset, t);
  const usage = loadPresetUsage();
  savePresetUsage({ ...usage, [preset.id]: Number(usage[preset.id] || 0) + 1 });
}

function deletePreset(id, customPresets, setCustomPresets) {
  const updated = customPresets.filter((preset) => preset.id !== id);
  setCustomPresets(updated);
  saveCustomPresets(updated);
}

function PresetGrid({ presets, customPresets, t, onApply, onDelete }) {
  return (
    <div className={styles.presetPanelGrid}>
      {presets.map((preset) => <PresetCard key={preset.id} preset={preset} t={t} onApply={onApply} onDelete={findDeleteHandler(preset.id, customPresets, onDelete)} />)}
    </div>
  );
}

function findDeleteHandler(presetId, customPresets, onDelete) {
  if (!customPresets.some((preset) => preset.id === presetId)) return null;
  return () => onDelete(presetId);
}

function wrapEmbedded(content, embedded) {
  if (embedded) return content;
  return <div className={styles.presetPanelCard}>{content}</div>;
}

export function PresetPanel({ t, embedded = false }) {
  const state = usePresetState();
  const actions = usePresetActions(state, t);
  const content = <PresetPanelContent t={t} state={state} actions={actions} />;

  return wrapEmbedded(content, embedded);
}

function PresetPanelContent({ t, state, actions }) {
  return (
    <>
      <PresetGrid presets={actions.sortedPresets} customPresets={state.customPresets} t={t} onApply={actions.applyPresetAndTrack} onDelete={actions.handleDelete} />
      <div className={styles.presetSaveArea}>
        <PresetSaveArea saving={state.saving} saveName={state.saveName} setSaveName={state.setSaveName} setSaving={state.setSaving} disabled={t.isActive} onSave={actions.handleSave} />
      </div>
      <DailyGoalWidget />
    </>
  );
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
  const disabled = t.isActive || t.isPaused;
  const content = (
    <div className={styles.configInsetPanel}>
      <TimerSettings work={t.workTime} breakTime={t.breakTime} sessions={t.targetSessions} onUpdate={t.updateTime} />
      <QuickAdjustButtons disabled={disabled} t={t} />
      <AutoStartToggle />
    </div>
  );

  return wrapEmbedded(content, embedded);
}
