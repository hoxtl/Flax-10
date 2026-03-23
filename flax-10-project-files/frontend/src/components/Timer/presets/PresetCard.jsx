/*
 * Preset button.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import { getPresetDurationTag, getPresetIcon, isPresetActive } from '../utils/presetUtils';

function getTooltipText(preset) {
  return `${preset.work}m work · ${preset.brk}m break · ${preset.sessions} sessions`;
}

export function PresetCard({ preset, t, onApply }) {
  const active = isPresetActive(preset, t);
  const disabled = t.isActive;
  return <PresetCardView preset={preset} active={active} disabled={disabled} onApply={onApply} />;
}

function PresetCardView({ preset, active, disabled, onApply }) {
  const className = `${styles.presetListItem} ${active ? styles.presetListItemActive : ''} ${disabled ? styles.presetListItemDisabled : ''}`;

  return (
    <div className={styles.presetListItemWrap} data-tooltip={getTooltipText(preset)}>
      <button className={className} onClick={() => !disabled && onApply?.(preset)} disabled={disabled}>
        <span className={styles.presetListItemTop}>
          <span className={styles.presetListIcon} aria-hidden="true">{getPresetIcon(preset)}</span>
          <span className={styles.presetListItemName}>{preset.label}</span>
          <span className={styles.presetDurationTag}>{getPresetDurationTag(preset)}</span>
        </span>
        <span className={styles.presetListItemMeta}>{preset.sessions} sessions</span>
      </button>
    </div>
  );
}
