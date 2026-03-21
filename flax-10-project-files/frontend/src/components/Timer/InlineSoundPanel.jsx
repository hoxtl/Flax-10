/*
 * Inline sound panel for the timer rail.
 */

import { useState } from 'react';
<<<<<<< HEAD
import styles from '../../pages/timer/TimerPage.module.css';
import { MusicStations } from './sound_panel/MusicStations';
=======
import styles from '../../pages/Timer/TimerPage.module.css';
import { useAmbientSound } from './TimerComponents';
import { AmbientSoundControls } from './soundPanel/AmbientSoundControls';
import { MusicStations } from './soundPanel/MusicStations';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

function toggleStationState(station, setActiveStation) {
  setActiveStation((previous) => previous?.id === station.id ? null : station);
}

export default function InlineSoundPanel() {
<<<<<<< HEAD
=======
  const { noiseType, toggle, volume, setVolume } = useAmbientSound();
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  const [activeStation, setActiveStation] = useState(null);

  return (
    <div className={`${styles.timerSoundCard} ${styles.timerSoundCardInline}`}>
<<<<<<< HEAD
      <MusicStations activeStation={activeStation} toggleStation={(station) => toggleStationState(station, setActiveStation)} closeStation={() => setActiveStation(null)} />
=======
      <div className={styles.soundSplitGrid}>
        <MusicStations activeStation={activeStation} toggleStation={(station) => toggleStationState(station, setActiveStation)} closeStation={() => setActiveStation(null)} />
        <AmbientSoundControls noiseType={noiseType} toggle={toggle} volume={volume} setVolume={setVolume} />
      </div>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </div>
  );
}
