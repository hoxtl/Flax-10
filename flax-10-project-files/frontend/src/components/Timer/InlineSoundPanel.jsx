/*
 * Inline sound panel for the timer rail.
 */

import { useState } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import { useAmbientSound } from './TimerComponents';
import { AmbientSoundControls } from './soundPanel/AmbientSoundControls';
import { MusicStations } from './soundPanel/MusicStations';

function toggleStationState(station, setActiveStation) {
  setActiveStation((previous) => previous?.id === station.id ? null : station);
}

export default function InlineSoundPanel() {
  const { noiseType, toggle, volume, setVolume } = useAmbientSound();
  const [activeStation, setActiveStation] = useState(null);

  return (
    <div className={`${styles.timerSoundCard} ${styles.timerSoundCardInline}`}>
      <div className={styles.soundSplitGrid}>
        <MusicStations activeStation={activeStation} toggleStation={(station) => toggleStationState(station, setActiveStation)} closeStation={() => setActiveStation(null)} />
        <AmbientSoundControls noiseType={noiseType} toggle={toggle} volume={volume} setVolume={setVolume} />
      </div>
    </div>
  );
}
