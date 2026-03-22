/**
 * Campus map page entry point.
 */
import "mapbox-gl/dist/mapbox-gl.css";
import { motion } from "framer-motion";
import styles from "./CampusMap.module.css";
import { KCL_CAMPUSES } from "../../lib/kclCampuses";
import { CampusMapSkeleton } from "../../components/CampusMap/CampusMapSkeleton";
import { SidebarHeader } from "../../components/CampusMap/SidebarHeader";
import { TflStatusSection } from "../../components/CampusMap/TflStatusSection";
import { UserJourneySection } from "../../components/CampusMap/UserJourneySection";
import { CalendarEventsSection } from "../../components/CampusMap/CalendarEventsSection";
import { LocationSection } from "../../components/CampusMap/LocationSection";
import { DestinationSection } from "../../components/CampusMap/DestinationSection";
import { TransportModesSection } from "../../components/CampusMap/TransportModesSection";
import { CampusQuickNav } from "../../components/CampusMap/CampusQuickNav";
import { useDisruptions } from "./hooks/useDisruptions";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { useHomeAddress } from "./hooks/useHomeAddress";
import { reverseGeocode } from "../../api/user/userApi";
import { tflService } from "../../api/campus/tflApi";
import {
  initMapInstance,
  handleMapLoad,
  cleanupMap,
  createHomeMarkerEl,
  homePopupHTML,
  wireHomeButton,
  fetchWalkingRoute,
  getEffectiveDestination,
  parseRouteInfo,
  createStartMarkerEl,
  displayRoute,
  clearRouteSource,
} from "./mapHelpers";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function CampusMap() {
  const model = useCampusMapModel();

  return <CampusMapShell {...model} />;
}
