/*
 * Ambient sound toggles and volume slider.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import { AMBIENT_SOUNDS } from './soundPanelData';

function AmbientButton({ sound, noiseType, toggle }) {
  const className = `${styles.soundPill} ${noiseType === sound.noiseKey ? styles.soundPillActive : ''}`;

  return (
    <button type="button" className={className} onClick={() => toggle(sound.noiseKey)} title={`Toggle ${sound.label}`}>
      <span className={styles.soundPillLabel}>{sound.label}</span>
    </button>
  );
}

function NoneButton({ noiseType, toggle }) {
  const className = `${styles.soundPill} ${noiseType === 'none' ? styles.soundPillActive : ''}`;

  return (
    <button type="button" className={className} onClick={() => toggle('none')} title="Turn ambient sound off">
      <span className={styles.soundPillEmoji}>🔇</span>
      <span className={styles.soundPillLabel}>None</span>
    </button>
  );
}

export function AmbientSoundControls({ noiseType, toggle, volume, setVolume }) {
  return (
    <section className={styles.soundPaneAmbient}>
      <div className={styles.soundSelectorContainer}>
        <span className={styles.soundPillsLabel}>Ambient Sounds</span>
        <div className={styles.soundPillsRow}>
          {AMBIENT_SOUNDS.map((sound) => <AmbientButton key={sound.id} sound={sound} noiseType={noiseType} toggle={toggle} />)}
          <NoneButton noiseType={noiseType} toggle={toggle} />
        </div>
        <div className={styles.soundVolumeRow}>
          <input className={styles.volumeSlider} type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Ambient sound volume" />
          <span className={styles.soundVolumeIcon}>🔊</span>
        </div>
      </div>
    </section>
  );
}
