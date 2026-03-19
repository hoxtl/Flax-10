import styles from '../../pages/CampusMap/CampusMap.module.css';
import { getLegIcon, getLegLabel } from './mapUtils';

function TflLegItem({ leg }) {
  return (
    <div className={styles.tflLeg}>
      <div className={styles.tflLegIcon}>{getLegIcon(leg.mode)}</div>
      <div className={styles.tflLegContent}>
        <span className={styles.tflLegMode}>{getLegLabel(leg)}</span>
        <span className={styles.tflLegDetail}>{leg.departurePoint} → {leg.arrivalPoint}</span>
        <span className={styles.tflLegTime}>{leg.duration} min</span>
      </div>
    </div>
  );
}

function TflLoadingCard() {
  return (
    <div className={styles.modeCard}>
      <div className={styles.loadingRoute}>
        <span className={styles.spinner} />
        <span>Checking public transport...</span>
      </div>
    </div>
  );
}

function TflErrorCard({ error }) {
  return (
    <div className={styles.modeCard}>
      <div className={styles.modeCardHeader}>
        <span className={styles.modeIcon}>🚇</span>
        <div className={styles.modeInfo}>
          <span className={styles.modeName}>Public Transport</span>
        </div>
      </div>
      <p className={styles.routeError}>{error}</p>
    </div>
  );
}

export function TflRouteCard({ tflRouteInfo, error, loading, instructionMode, onToggleInstructions }) {
  if (loading) return <TflLoadingCard />;
  if (error) return <TflErrorCard error={error} />;
  if (!tflRouteInfo) return null;
  return (
    <div className={styles.modeCard}>
      <div className={styles.modeCardHeader}>
        <span className={styles.modeIcon}>🚇</span>
        <div className={styles.modeInfo}>
          <span className={styles.modeName}>Public Transport</span>
          <span className={styles.modeBadge}>Bus, Tube and Rail</span>
        </div>
      </div>
      <div className={styles.modeStats}>
        <div className={styles.modeStat}>
          <span className={styles.modeStatValue}>{tflRouteInfo.duration} min</span>
          <span className={styles.modeStatLabel}>Duration</span>
        </div>
        <div className={styles.modeStatDivider} />
        <div className={styles.modeStat}>
          <span className={styles.modeStatValue}>{tflRouteInfo.legs.length}</span>
          <span className={styles.modeStatLabel}>Stops</span>
        </div>
      </div>
      <button className={styles.stepsToggle} onClick={onToggleInstructions}>
        {instructionMode ? 'Hide' : 'Show'} step-by-step directions{' '}
        <span>{instructionMode ? '▲' : '▼'}</span>
      </button>
      {instructionMode && (
        <div className={styles.tflJourneySteps}>
          {tflRouteInfo.legs.map((leg, i) => <TflLegItem key={i} leg={leg} />)}
        </div>
      )}
    </div>
  );
}
