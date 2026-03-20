/*
 * Music station buttons and embed panel.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import { MUSIC_STATIONS } from './soundPanelData';
import { MusicEmbed } from './MusicEmbed';
import { ProviderIcon } from './SoundIcons';

function MusicStationButton({ station, activeStation, toggleStation }) {
  const isActive = activeStation?.id === station.id;
  const className = `${styles.musicStationBtn} ${isActive ? styles.musicStationBtnActive : ''} ${styles[`musicStation_${station.provider}`]}`;
  const title = isActive ? `Close ${station.label}` : `Play ${station.label}`;

  return (
    <button type="button" className={className} onClick={() => toggleStation(station)} title={title}>
      <span className={styles.musicStationLabel}>{station.label}</span>
      <ProviderIcon provider={station.provider} />
    </button>
  );
}

export function MusicStations({ activeStation, toggleStation, closeStation }) {
  return (
    <section className={styles.soundPaneStreams}>
      <div className={styles.musicStationsWrap}>
        <span className={styles.musicStationsLabel}>Music & Streams</span>
        <div className={styles.musicStationsGrid}>{MUSIC_STATIONS.map((station) => <MusicStationButton key={station.id} station={station} activeStation={activeStation} toggleStation={toggleStation} />)}</div>
      </div>
      {activeStation && <MusicEmbed station={activeStation} onClose={closeStation} />}
    </section>
  );
}
