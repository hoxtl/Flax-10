/**
 * Destination selection section.
 */

import baseStyles from "../../pages/CampusMap/CampusMap.module.css";
import sidebarStyles from "../../pages/CampusMap/sidebar.module.css";
import { KCL_CAMPUSES } from "../../lib/kclCampuses";
import { LocationChip } from "./LocationChip";

const styles = { ...baseStyles, ...sidebarStyles };

function CampusList({ onSelectCampus, selectedCampus }) {
  return (
    <div className={styles.campusList}>
      {KCL_CAMPUSES.map((campus) => (
        <button key={campus.id} className={`${styles.campusBtn} ${selectedCampus?.id === campus.id ? styles.campusBtnActive : ""}`} onClick={() => onSelectCampus(campus)}>
          <span className={styles.campusDot} style={{ background: campus.color }} />
          <span>{campus.shortName}</span>
        </button>
      ))}
    </div>
  );
}

function DestinationChip({ customDestination, onClearCampus, onClearCustomDest, selectedCampus }) {
  if (customDestination) return <LocationChip dotColor="var(--color-destination-red)" title={customDestination.name} subtitle={customDestination.address} onClear={onClearCustomDest} />;
  if (selectedCampus) return <LocationChip dotColor={selectedCampus.color} title={selectedCampus.name} subtitle={selectedCampus.address} onClear={onClearCampus} />;
  return <p className={styles.hintText}>Select a campus or event as destination</p>;
}

export function DestinationSection(props) {
  return (
    <section className={styles.section}><div className={styles.sectionLabel}><span className={styles.stepBadge}>2</span>Destination</div><DestinationChip {...props} /><CampusList selectedCampus={props.selectedCampus} onSelectCampus={props.onSelectCampus} /></section>
  );
}
