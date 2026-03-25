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

function formatUpcomingTime(startTime) {
  if (!startTime) return "";
  return new Date(startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function UpcomingEventsList({ upcomingEvents, onSelectEvent }) {
  if (!upcomingEvents?.length) return null;
  return (
    <div className={styles.upcomingSection}>
      <div className={styles.subsectionLabel}>Upcoming events</div>
      <div className={styles.upcomingList}>
        {upcomingEvents.map((event) => (
          <button
            key={event.id || `${event.title}-${event.start_time}`}
            className={styles.upcomingBtn}
            onClick={() => onSelectEvent?.(event)}
          >
            <div className={styles.upcomingTitleRow}>
              <span className={styles.upcomingTitle}>{event.title || "Upcoming event"}</span>
              <span className={styles.upcomingTime}>{formatUpcomingTime(event.start_time)}</span>
            </div>
            <div className={styles.upcomingMeta}>{event.location}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DestinationSection(props) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}><span className={styles.stepBadge}>2</span>Destination</div>
      <DestinationChip {...props} />
      <UpcomingEventsList upcomingEvents={props.upcomingEvents} onSelectEvent={props.onSelectEvent} />
      <CampusList selectedCampus={props.selectedCampus} onSelectCampus={props.onSelectCampus} />
    </section>
  );
}
