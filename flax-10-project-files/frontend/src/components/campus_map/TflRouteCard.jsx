/**
 * Public transport route card.
 */

import baseStyles from "../../pages/campus_map/styles/CampusMap.module.css";
import routeStyles from "../../pages/campus_map/styles/routes.module.css";
import { getLegIcon, getLegLabel } from "./mapUtils";
import ExpandablePillButton from "../common/expandable_pill_button/ExpandablePillButton";

const styles = { ...baseStyles, ...routeStyles };

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

function getLinesSummary(legs) {
  const lines = legs
    .map((leg) => leg.routeName || leg.lineName || "")
    .filter(Boolean);
  const unique = [...new Set(lines)];
  if (!unique.length) return "Public Transport";
  if (unique.length === 1) return `via ${unique[0]}`;
  if (unique.length === 2) return `via ${unique[0]} & ${unique[1]}`;
  return `via ${unique[0]}, ${unique[1]} +${unique.length - 2} more`;
}

function TflRouteDetails({ instructionMode, onToggleInstructions, tflRouteInfo }) {
  const linesSummary = getLinesSummary(tflRouteInfo.legs || []);
  return (
    <div className={styles.modeCard}><div className={styles.modeCardHeader}><span className={styles.modeIcon}>🚇</span><div className={styles.modeInfo}><span className={styles.modeName}>Public Transport</span><span className={styles.modeBadge}>{linesSummary}</span></div></div><div className={styles.modeStats}><div className={styles.modeStat}><span className={styles.modeStatValue}>{tflRouteInfo.duration} min</span><span className={styles.modeStatLabel}>Duration</span></div><div className={styles.modeStatDivider} /><div className={styles.modeStat}><span className={styles.modeStatValue}>{tflRouteInfo.legs.length}</span><span className={styles.modeStatLabel}>Stops</span></div></div><ExpandablePillButton expanded={instructionMode} onToggle={onToggleInstructions} collapsedLabel="Show step-by-step directions" expandedLabel="Hide step-by-step directions" />{instructionMode && <div className={styles.tflJourneySteps}>{tflRouteInfo.legs.map((leg, index) => <TflLegItem key={index} leg={leg} />)}</div>}</div>
  );
}

export function TflRouteCard({ tflRouteInfo, error, loading, instructionMode, onToggleInstructions }) {
  if (loading) return <TflLoadingCard />;
  if (error) return <TflErrorCard error={error} />;
  if (!tflRouteInfo) return null;
  return <TflRouteDetails instructionMode={instructionMode} onToggleInstructions={onToggleInstructions} tflRouteInfo={tflRouteInfo} />;
}
