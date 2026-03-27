/*
 * Inline sound panel for the timer rail.
 */

import { useState } from 'react';
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/timer/components/InlineSoundPanel.jsx
import styles from '../../../pages/timer/TimerPage.module.css';
import { MusicStations } from '../sound_panel/MusicStations';
=======
import styles from '../../pages/timer/TimerPage.module.css';
import { MusicStations } from './sound_panel/MusicStations';
>>>>>>> main:flax-10-project-files/frontend/src/components/timer/InlineSoundPanel.jsx

function toggleStationState(station, setActiveStation) {
  setActiveStation((previous) => previous?.id === station.id ? null : station);
}

export default function InlineSoundPanel() {
  const [activeStation, setActiveStation] = useState(null);

  return (
    <div className={`${styles.timerSoundCard} ${styles.timerSoundCardInline}`}>
      <MusicStations activeStation={activeStation} toggleStation={(station) => toggleStationState(station, setActiveStation)} closeStation={() => setActiveStation(null)} />
    </div>
  );
}
