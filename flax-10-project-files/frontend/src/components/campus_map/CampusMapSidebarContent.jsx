/*
 * Campus map sidebar content.
 */

import styles from "../../pages/campus_map/CampusMap.module.css";
import { DestinationSection } from "./DestinationSection";
import { SidebarHeader } from "./SidebarHeader";
import { TflStatusSection } from "./TflStatusSection";
import { TransportModesSection } from "./TransportModesSection";
import { UserJourneySection } from "./UserJourneySection";

function JourneySection({ props }) {
  return <UserJourneySection manualStart={props.form.manualStart} setManualStart={props.setManualStart} manualDestination={props.form.manualDestination} setManualDestination={props.setManualDestination} onCalculate={props.handleUserJourneyCalculate} onClearAll={props.clearAllSelections} onGeolocateStart={props.handleGeolocateStart} onGeolocateDestination={props.handleGeolocateDestination} locating={props.ui.locating} />;
}

function DestinationSectionWrapper({ props }) {
  return (
    <DestinationSection
      selectedCampus={props.selection.selectedCampus}
      customDestination={props.selection.customDestination}
      onClearCampus={props.handleClearCampus}
      onClearCustomDest={props.clearCustomDestination}
      onSelectCampus={props.handleSelectCampus}
      upcomingEvents={props.upcomingEvents}
      onSelectEvent={props.handleSelectUpcomingEvent}
    />
  );
}

function TransportSection({ props }) {
  return <TransportModesSection startLocation={props.selection.startLocation} selectedCampus={props.selection.selectedCampus} customDestination={props.selection.customDestination} routeInfo={props.routes.routeInfo} routeError={props.routes.routeError} loadingRoute={props.routes.loadingRoute} tflRouteInfo={props.routes.tflRouteInfo} tflRouteError={props.routes.tflRouteError} loadingTflRoute={props.routes.loadingTflRoute} walkingInstructions={props.ui.walkingInstructions} tflInstructions={props.ui.tflInstructions} onToggleWalking={props.toggleWalkingInstructions} onToggleTfl={props.toggleTflInstructions} />;
}

export function CampusMapSidebarContent(props) {
  return (
    <>
      <SidebarHeader />
      <TflStatusSection disruptions={props.disruptions} loading={props.loadingDisruptions} />
      <JourneySection props={props} />
      <DestinationSectionWrapper props={props} />
      <TransportSection props={props} />
      <div className={styles.sidebarFooter}><p>💡 Right-click + drag to rotate</p></div>
    </>
  );
}
