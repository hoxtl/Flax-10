/*
 * Focus tree animation with selectable visual mode.
 */

<<<<<<< HEAD
import styles from '../../pages/timer/TimerPage.module.css';
import { TreeScene } from './focus_animation/TreeScene';
import { useFocusCanvasAnimation } from './focus_animation/useFocusCanvasAnimation';
=======
import styles from '../../pages/Timer/TimerPage.module.css';
import { TreeScene } from './focusAnimation/TreeScene';
import { useFocusCanvasAnimation } from './focusAnimation/useFocusCanvasAnimation';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const ANIMATION_TYPES = [
  { key: 'tree', title: 'Tree' },
  { key: 'orb', title: 'Orb' },
  { key: 'fire', title: 'Fire' },
  { key: 'ripple', title: 'Ripple' },
  { key: 'galaxy', title: 'Galaxy' },
];

function AnimationPicker({ animationType, setAnimationType }) {
  return (
    <div className={styles.animPicker}>
      {ANIMATION_TYPES.map((type) => <button key={type.key} type="button" title={type.title} className={getPickerClassName(type.key, animationType)} onClick={() => setAnimationType(type.key)} />)}
    </div>
  );
}

function getPickerClassName(key, animationType) {
  return [styles.animPickerBtn, animationType === key ? styles.animPickerBtnActive : ''].filter(Boolean).join(' ');
}

function MaybePicker({ showPicker, animationType, setAnimationType }) {
  if (!showPicker) return null;
  return <AnimationPicker animationType={animationType} setAnimationType={setAnimationType} />;
}

export default function FocusAnimation({ progress, mode, isActive, showPicker = true }) {
  const { canvasRef, animationType, setAnimationType } = useFocusCanvasAnimation(mode, isActive, progress);

  return (
    <div className={styles.focusAnimWrapper}>
      <MaybePicker showPicker={showPicker} animationType={animationType} setAnimationType={setAnimationType} />
      <div className={styles.focusAnimArea}>
        <div className={styles.treeAnimContainer}>
          <TreeScene progress={progress} />
          <canvas ref={canvasRef} width={180} height={180} className={styles.treeCanvasOverlay} />
        </div>
      </div>
    </div>
  );
}
