/**
 * Walking route card.
 */

import styles from "../../pages/campus_map/routes.module.css";
import { travelDistance, travelTime } from "./mapUtils";

function StepsList({ steps }) {
  return (
    <ol className={styles.stepsList}>
      {steps.map((step, i) => (
        <li key={i} className={styles.stepItem}>
          <span className={styles.stepIndex}>{i + 1}</span>
          <div className={styles.stepContent}>
            <span className={styles.stepInstruction}>{step.instruction}</span>
            <span className={styles.stepMeta}>{travelDistance(step.distance)} · {travelTime(step.duration)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function WalkingRouteDetails({ instructionMode, onToggleInstructions, routeInfo }) {
  return (
    <div className={styles.modeCard}><div className={styles.modeCardHeader}><span className={styles.modeIcon}>🚶</span><div className={styles.modeInfo}><span className={styles.modeName}>Walking</span><span className={styles.modeBadge}>Available now</span></div></div><div className={styles.modeStats}><div className={styles.modeStat}><span className={styles.modeStatValue}>{travelTime(routeInfo.duration)}</span><span className={styles.modeStatLabel}>Duration</span></div><div className={styles.modeStatDivider} /><div className={styles.modeStat}><span className={styles.modeStatValue}>{travelDistance(routeInfo.distance)}</span><span className={styles.modeStatLabel}>Distance</span></div></div><button className={styles.stepsToggle} onClick={onToggleInstructions}>{instructionMode ? "Hide" : "Show"} directions <span>{instructionMode ? "▲" : "▼"}</span></button>{instructionMode && <StepsList steps={routeInfo.steps} />}</div>
  );
}

export function WalkingRouteCard(props) {
  return <WalkingRouteDetails {...props} />;
}
