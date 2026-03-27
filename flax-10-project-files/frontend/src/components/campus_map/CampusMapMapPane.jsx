/**
 * Campus map map pane.
 */

import styles from "../../pages/campus_map/styles/CampusMap.module.css";
import { CampusQuickNav } from "./CampusQuickNav";

function hiddenStyle(showInitialSkeleton) {
  return showInitialSkeleton ? { visibility: "hidden" } : undefined;
}

export function CampusMapMapPane({ flyToCampus, mapContainer, showInitialSkeleton }) {
  return (
    <div className={styles.mapWrapper} style={hiddenStyle(showInitialSkeleton)}><div ref={mapContainer} className={styles.mapContainer} /><CampusQuickNav onFly={flyToCampus} /></div>
  );
}
