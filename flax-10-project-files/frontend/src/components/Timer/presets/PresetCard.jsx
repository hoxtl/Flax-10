/*
 * Preset button with optional delete menu.
 */

import { useEffect, useRef, useState } from 'react';
import styles from '../../../pages/Timer/TimerPage.module.css';
import { getPresetDurationTag, getPresetIcon, isPresetActive } from '../utils/presetUtils';

function useContextMenu(ctxMenu, setCtxMenu, ctxRef) {
  useEffect(() => {
    if (!ctxMenu) return undefined;
    const handler = (event) => closeContextMenu(event, ctxRef, setCtxMenu);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ctxMenu, ctxRef, setCtxMenu]);
}

function closeContextMenu(event, ctxRef, setCtxMenu) {
  if (ctxRef.current && !ctxRef.current.contains(event.target)) setCtxMenu(null);
}

function getTooltipText(preset) {
  return `${preset.work}m work · ${preset.brk}m break · ${preset.sessions} sessions`;
}

function PresetContextMenu({ ctxMenu, ctxRef, onDelete }) {
  if (!ctxMenu || !onDelete) return null;

  return (
    <div ref={ctxRef} className={styles.presetCtxMenu} style={{ top: ctxMenu.y, left: ctxMenu.x }}>
      <button className={styles.presetCtxDeleteBtn} onClick={onDelete}>🗑 Delete preset</button>
    </div>
  );
}

export function PresetCard({ preset, t, onApply, onDelete }) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const ctxRef = useRef(null);
  const active = isPresetActive(preset, t);
  const disabled = t.isActive;

  useContextMenu(ctxMenu, setCtxMenu, ctxRef);
  return <PresetCardView preset={preset} active={active} disabled={disabled} onApply={onApply} onDelete={onDelete} ctxMenu={ctxMenu} setCtxMenu={setCtxMenu} ctxRef={ctxRef} />;
}

function PresetCardView({ preset, active, disabled, onApply, onDelete, ctxMenu, setCtxMenu, ctxRef }) {
  const className = `${styles.presetListItem} ${active ? styles.presetListItemActive : ''} ${disabled ? styles.presetListItemDisabled : ''}`;

  return (
    <div className={styles.presetListItemWrap} onContextMenu={(event) => openContextMenu(event, onDelete, setCtxMenu)} data-tooltip={getTooltipText(preset)}>
      <button className={className} onClick={() => !disabled && onApply?.(preset)} disabled={disabled}>
        <span className={styles.presetListItemTop}>
          <span className={styles.presetListIcon} aria-hidden="true">{getPresetIcon(preset)}</span>
          <span className={styles.presetListItemName}>{preset.label}</span>
          <span className={styles.presetDurationTag}>{getPresetDurationTag(preset)}</span>
        </span>
        <span className={styles.presetListItemMeta}>{preset.sessions} sessions</span>
      </button>
      {onDelete && <button className={styles.presetDeleteBtn} onClick={() => onDelete()} title="Delete preset" aria-label="Delete preset">✕</button>}
      <PresetContextMenu ctxMenu={ctxMenu} ctxRef={ctxRef} onDelete={() => deletePreset(onDelete, setCtxMenu)} />
    </div>
  );
}

function openContextMenu(event, onDelete, setCtxMenu) {
  if (!onDelete) return;
  event.preventDefault();
  setCtxMenu({ x: event.clientX, y: event.clientY });
}

function deletePreset(onDelete, setCtxMenu) {
  onDelete();
  setCtxMenu(null);
}
