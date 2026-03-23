/**
 * Campus map sidebar content.
 */

import styles from "../../pages/CampusMap/CampusMap.module.css";
import { DestinationSection } from "./DestinationSection";
import { LocationSection } from "./LocationSection";
import { SidebarHeader } from "./SidebarHeader";
import { TflStatusSection } from "./TflStatusSection";
import { TransportModesSection } from "./TransportModesSection";
import { UserJourneySection } from "./UserJourneySection";

export function CampusMapSidebarContent(props) {
  return (
    <><SidebarHeader /><TflStatusSection disruptions={props.disruptions} loading={props.loadingDisruptions} /><UserJourneySection manualStart={props.form.manualStart} setManualStart={props.setManualStart} manualDestination={props.form.manualDestination} setManualDestination={props.setManualDestination} onCalculate={props.handleUserJourneyCalculate} onClearAll={props.clearAllSelections} /><LocationSection startLocation={props.selection.startLocation} locating={props.ui.locating} onGeolocate={props.handleGeolocate} onClear={props.handleClearStart} manualStart={props.form.manualStart} /><DestinationSection selectedCampus={props.selection.selectedCampus} customDestination={props.selection.customDestination} onClearCampus={props.handleClearCampus} onClearCustomDest={props.clearCustomDestination} onSelectCampus={props.handleSelectCampus} /><TransportModesSection startLocation={props.selection.startLocation} selectedCampus={props.selection.selectedCampus} customDestination={props.selection.customDestination} routeInfo={props.routes.routeInfo} routeError={props.routes.routeError} loadingRoute={props.routes.loadingRoute} tflRouteInfo={props.routes.tflRouteInfo} tflRouteError={props.routes.tflRouteError} loadingTflRoute={props.routes.loadingTflRoute} walkingInstructions={props.ui.walkingInstructions} tflInstructions={props.ui.tflInstructions} onToggleWalking={props.toggleWalkingInstructions} onToggleTfl={props.toggleTflInstructions} /><div className={styles.sidebarFooter}><p>💡 Right-click + drag to rotate</p></div></>
  );
}
