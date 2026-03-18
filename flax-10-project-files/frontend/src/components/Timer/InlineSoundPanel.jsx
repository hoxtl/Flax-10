import { useState } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import { useAmbientSound } from './TimerComponents';

const AMBIENT_SOUNDS = [
    { id: 'pink',  label: '🌧️ Maughan Library Rain', noiseKey: 'pink' },
    { id: 'brown', label: '☕ Strand Coffee Shop',    noiseKey: 'brown' },
    { id: 'white', label: '🌬️ Waterloo Wind',         noiseKey: 'white' },
];

const MUSIC_STATIONS = [
    { id: 'yt-lofi',        label: 'Lo-fi Beats',     provider: 'youtube', embedUrl: 'https://www.youtube.com/embed/_4kHxtiuML0?autoplay=1',      externalUrl: 'https://www.youtube.com/watch?v=_4kHxtiuML0' },
    { id: 'yt-morning',     label: 'Morning Focus',   provider: 'youtube', embedUrl: 'https://www.youtube.com/embed/1fueZCTYkpA?autoplay=1',      externalUrl: 'https://www.youtube.com/watch?v=1fueZCTYkpA' },
    { id: 'yt-deadline',    label: 'Deadline Mode',   provider: 'youtube', embedUrl: 'https://www.youtube.com/embed/VTjmPTCbdqc?autoplay=1',      externalUrl: 'https://www.youtube.com/watch?v=VTjmPTCbdqc' },
    { id: 'yt-latenight',   label: 'Late Night',      provider: 'youtube', embedUrl: 'https://www.youtube.com/embed/f_FSWEg9Wgk?autoplay=1',      externalUrl: 'https://www.youtube.com/watch?v=f_FSWEg9Wgk' },
    { id: 'spotify-lofi',       label: 'Lo-fi Café',      provider: 'spotify', embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0', externalUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS' },
    { id: 'spotify-studyflax',  label: 'StudyFlax Mix',   provider: 'spotify', embedUrl: 'https://open.spotify.com/embed/artist/1B95N9f9HtEL9D21OCaTkt?utm_source=generator&theme=0',  externalUrl: 'https://open.spotify.com/artist/1B95N9f9HtEL9D21OCaTkt' },
];

const SpotifyIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
);

const YouTubeIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
);

function MusicEmbed({ station, onClose }) {
    const ProviderIcon = station.provider === 'spotify' ? SpotifyIcon : YouTubeIcon;
    return (
        <div className={styles.musicEmbedWrap}>
            <div className={styles.musicEmbedHeader}>
                <span className={styles.musicEmbedTitle}><ProviderIcon />{station.label}</span>
                <div className={styles.musicEmbedActions}>
                    <a href={station.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.musicEmbedExternal} title="Open in app">↗</a>
                    <button type="button" className={styles.musicEmbedClose} onClick={onClose} title="Close player">✕</button>
                </div>
            </div>
            <iframe
                className={styles.musicEmbedIframe}
                src={station.embedUrl}
                width="100%"
                height={station.provider === 'spotify' ? 152 : 168}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={station.label}
            />
        </div>
    );
}

export default function InlineSoundPanel() {
    const { noiseType, toggle, volume, setVolume } = useAmbientSound();
    const [activeStation, setActiveStation] = useState(null);
    const toggleStation = (station) => setActiveStation((prev) => prev?.id === station.id ? null : station);

    return (
        <div className={`${styles.timerSoundCard} ${styles.timerSoundCardInline}`}>
            <div className={styles.soundSplitGrid}>
                <section className={styles.soundPaneStreams}>
                    <div className={styles.musicStationsWrap}>
                        <span className={styles.musicStationsLabel}>Music & Streams</span>
                        <div className={styles.musicStationsGrid}>
                            {MUSIC_STATIONS.map((station) => {
                                const isActive = activeStation?.id === station.id;
                                const ProviderIcon = station.provider === 'spotify' ? SpotifyIcon : YouTubeIcon;
                                return (
                                    <button
                                        key={station.id}
                                        type="button"
                                        className={`${styles.musicStationBtn} ${isActive ? styles.musicStationBtnActive : ''} ${styles[`musicStation_${station.provider}`]}`}
                                        onClick={() => toggleStation(station)}
                                        title={isActive ? `Close ${station.label}` : `Play ${station.label}`}
                                    >
                                        <span className={styles.musicStationLabel}>{station.label}</span>
                                        <ProviderIcon />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {activeStation && <MusicEmbed station={activeStation} onClose={() => setActiveStation(null)} />}
                </section>
                <section className={styles.soundPaneAmbient}>
                    <div className={styles.soundSelectorContainer}>
                        <span className={styles.soundPillsLabel}>Ambient Sounds</span>
                        <div className={styles.soundPillsRow}>
                            {AMBIENT_SOUNDS.map((sound) => (
                                <button
                                    key={sound.id}
                                    type="button"
                                    className={`${styles.soundPill} ${noiseType === sound.noiseKey ? styles.soundPillActive : ''}`}
                                    onClick={() => toggle(sound.noiseKey)}
                                    title={`Toggle ${sound.label}`}
                                >
                                    <span className={styles.soundPillLabel}>{sound.label}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                className={`${styles.soundPill} ${noiseType === 'none' ? styles.soundPillActive : ''}`}
                                onClick={() => toggle('none')}
                                title="Turn ambient sound off"
                            >
                                <span className={styles.soundPillEmoji}>🔇</span>
                                <span className={styles.soundPillLabel}>None</span>
                            </button>
                        </div>
                        <div className={styles.soundVolumeRow}>
                            <input
                                className={styles.volumeSlider}
                                type="range" min={0} max={1} step={0.05}
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                aria-label="Ambient sound volume"
                            />
                            <span className={styles.soundVolumeIcon}>🔊</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
