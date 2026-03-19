import baseStyles from '../../pages/CampusMap/CampusMap.module.css';
import routeStyles from '../../pages/CampusMap/routes.module.css';
const styles = { ...baseStyles, ...routeStyles };
import { WalkingRouteCard } from './WalkingRouteCard';
import { TflRouteCard } from './TflRouteCard';

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>🚶</span>
      <p>Set a starting location and destination to see your journey options!</p>
    </div>
  );
}

function RouteCards({ routeInfo, tflRouteInfo, tflRouteError, loadingTflRoute, walkingInstructions, tflInstructions, onToggleWalking, onToggleTfl }) {
  return (
    <>
      <WalkingRouteCard
        routeInfo={routeInfo}
        instructionMode={walkingInstructions}
        onToggleInstructions={onToggleWalking}
      />
      <TflRouteCard
        tflRouteInfo={tflRouteInfo}
        error={tflRouteError}
        loading={loadingTflRoute}
        instructionMode={tflInstructions}
        onToggleInstructions={onToggleTfl}
      />
    </>
  );
}

export function TransportModesSection({ startLocation, selectedCampus, customDestination, routeInfo, routeError, loadingRoute, tflRouteInfo, tflRouteError, loadingTflRoute, walkingInstructions, tflInstructions, onToggleWalking, onToggleTfl }) {
  const hasDestination = selectedCampus || customDestination;
  const showEmpty = !startLocation || !hasDestination;
  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>
        <span className={styles.stepBadge}>3</span>
        Transport Modes
      </div>
      {showEmpty ? <EmptyState /> : loadingRoute ? (
        <div className={styles.loadingRoute}>
          <span className={styles.spinner} />
          <span>Calculating route…</span>
        </div>
      ) : routeError ? (
        <div className={styles.routeError}>{routeError}</div>
      ) : routeInfo ? (
        <RouteCards
          routeInfo={routeInfo}
          tflRouteInfo={tflRouteInfo}
          tflRouteError={tflRouteError}
          loadingTflRoute={loadingTflRoute}
          walkingInstructions={walkingInstructions}
          tflInstructions={tflInstructions}
          onToggleWalking={onToggleWalking}
          onToggleTfl={onToggleTfl}
        />
      ) : null}
    </section>
  );
}
