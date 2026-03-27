/*
 * Inline sound panel for the timer rail.
 */

import { useState } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import { MusicStations } from './sound_panel/MusicStations';

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
