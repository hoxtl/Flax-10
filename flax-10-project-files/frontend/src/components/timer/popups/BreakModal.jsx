/*
 * Break selection modal.
 */

import { useMemo, useState } from 'react';
<<<<<<< HEAD
import styles from '../../../pages/timer/TimerPage.module.css';
import PrimaryButton from '../../common/primary_button/PrimaryButton';
import StandardModal from '../../common/standard_modal/StandardModal';
=======
import styles from '../../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import StandardModal from '../../common/StandardModal/StandardModal';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const BREAK_SUGGESTIONS = [
  'Stand up and stretch for 2 minutes',
  'Look at something 20 feet away for 20 seconds',
  'Drink a glass of water',
  'Take 5 deep breaths',
  'Walk to another room and back',
  'Roll your shoulders and neck',
  'Close your eyes and rest for a moment',
  'Do a quick breathing exercise',
];

<<<<<<< HEAD
export const ACTIVE_BREAK_OPTIONS = [
=======
const ACTIVE_BREAK_OPTIONS = [
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  { id: 'stretch', label: '5m Stretch', hint: 'Do a quick mobility reset.' },
  { id: 'hydrate', label: 'Hydrate', hint: 'Refill water before next focus block.' },
  { id: 'walk', label: 'Campus Walk', hint: 'Walk briefly and come back refreshed.' },
];

<<<<<<< HEAD
export function getSelectedBreakLabel(selected) {
  return ACTIVE_BREAK_OPTIONS.find((option) => option.id === selected)?.label || 'Break';
}

export function BreakOption({ option, selected, setSelected }) {
=======
function BreakOption({ option, selected, setSelected }) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  const className = `${styles.activeBreakBtn} ${selected === option.id ? styles.activeBreakBtnSelected : ''}`;

  return (
    <button type="button" className={className} onClick={() => setSelected(option.id)}>
      <span className={styles.activeBreakLabel}>{option.label}</span>
      <span className={styles.activeBreakHint}>{option.hint}</span>
    </button>
  );
}

export function BreakModal({ onAction }) {
  const tip = useMemo(() => BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)], []);
  const [selected, setSelected] = useState(ACTIVE_BREAK_OPTIONS[0].id);
<<<<<<< HEAD
  const selectedLabel = getSelectedBreakLabel(selected);
=======
  const selectedLabel = ACTIVE_BREAK_OPTIONS.find((option) => option.id === selected)?.label || 'Break';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

  return (
    <StandardModal title="Focus session complete" onClose={onAction} size="sm" modalClassName={styles.modalContent}>
      <div className={styles.modalContent}>
        <div className={styles.modalMessage}>Great job! Time to take a well-deserved break.</div>
        <div className={styles.breakSuggestion}>💡 {tip}</div>
        <div className={styles.activeBreakGrid}>{ACTIVE_BREAK_OPTIONS.map((option) => <BreakOption key={option.id} option={option} selected={selected} setSelected={setSelected} />)}</div>
        <PrimaryButton className={`${styles.button} ${styles.primary}`} onClick={onAction} pill>Start {selectedLabel}</PrimaryButton>
      </div>
    </StandardModal>
  );
}
