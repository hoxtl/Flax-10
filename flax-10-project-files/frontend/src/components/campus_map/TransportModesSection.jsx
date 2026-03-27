/**
 * Transport mode results section.
 */

import baseStyles from "../../pages/campus_map/styles/CampusMap.module.css";
import routeStyles from "../../pages/campus_map/styles/routes.module.css";
import { TflRouteCard } from "./TflRouteCard";
import { WalkingRouteCard } from "./WalkingRouteCard";

const styles = { ...baseStyles, ...routeStyles };

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>🚶</span>
      <p>Set a starting location and destination to see your journey options!</p>
    </div>
  );
}

function RouteCards(props) {
  return (
    <>
      <WalkingRouteCard routeInfo={props.routeInfo} instructionMode={props.walkingInstructions} onToggleInstructions={props.onToggleWalking} />
      <TflRouteCard tflRouteInfo={props.tflRouteInfo} error={props.tflRouteError} loading={props.loadingTflRoute} instructionMode={props.tflInstructions} onToggleInstructions={props.onToggleTfl} />
    </>
  );
}

function TransportContent(props) {
  const hasDest = props.selectedCampus || props.customDestination;
  if (!props.startLocation || !hasDest) {
    return <EmptyState />;
  }

  if (props.loadingRoute) {
    return <div className={styles.loadingRoute}><span className={styles.spinner} /><span>Calculating route...</span></div>;
  }

  if (props.routeError) {
    return <div className={styles.routeError}>{props.routeError}</div>;
  }

  if (!props.routeInfo) {
    return null;
  }

  return <RouteCards {...props} />;
}

export function TransportModesSection(props) {
  return (
    <section className={styles.section}><div className={styles.sectionLabel}><span className={styles.stepBadge}>3</span>Transport Modes</div><TransportContent {...props} /></section>
  );
}
