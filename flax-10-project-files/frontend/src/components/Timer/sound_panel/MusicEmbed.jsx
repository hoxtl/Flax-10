/*
 * Embedded music player card.
 */

import styles from '../../../pages/timer/TimerPage.module.css';
import { ProviderIcon } from './SoundIcons';

export function MusicEmbed({ station, onClose }) {
  return (
    <div className={styles.musicEmbedWrap}>
      <div className={styles.musicEmbedHeader}>
        <span className={styles.musicEmbedTitle}><ProviderIcon provider={station.provider} />{station.label}</span>
        <div className={styles.musicEmbedActions}>
          <a href={station.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.musicEmbedExternal} title="Open in app">↗</a>
          <button type="button" className={styles.musicEmbedClose} onClick={onClose} title="Close player">✕</button>
        </div>
      </div>
      <iframe className={styles.musicEmbedIframe} src={station.embedUrl} width="100%" height={station.provider === 'spotify' ? 152 : 168} frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title={station.label} />
    </div>
  );
}
