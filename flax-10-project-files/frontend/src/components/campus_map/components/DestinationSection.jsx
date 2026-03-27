/**
 * Destination selection section.
 */

import baseStyles from "../../../pages/campus_map/styles/CampusMap.module.css";
import sidebarStyles from "../../../pages/campus_map/styles/sidebar.module.css";
import { KCL_CAMPUSES } from "../../../lib/kclCampuses";
import { LocationChip } from "./LocationChip";
import AnimatedDropdown from "../../common/animated_dropdown/AnimatedDropdown";

const styles = { ...baseStyles, ...sidebarStyles };

function CampusDot({ color }) {
  return <span className={styles.campusDot} style={{ background: color }} />;
}

function buildCampusOption(campus) {
  return { value: campus.id, label: campus.shortName, icon: <CampusDot color={campus.color} /> };
}

function selectCampus(onSelectCampus, campusId) {
  const campus = KCL_CAMPUSES.find((candidate) => candidate.id === campusId);
  if (campus) onSelectCampus(campus);
}

function CampusTrigger({ selectedCampus, className, ...triggerProps }) {
  return (
    <button type="button" className={`${styles.campusDropdownTrigger} ${className ?? ""}`.trim()} {...triggerProps}>
      {selectedCampus ? <><CampusDot color={selectedCampus.color} /> {selectedCampus.shortName}</> : "Select campus…"}
      <span className={styles.campusDropdownChevron}>▾</span>
    </button>
  );
}

const CAMPUS_OPTIONS = KCL_CAMPUSES.map(buildCampusOption);

function CampusList({ onSelectCampus, selectedCampus }) {
  return (
    <AnimatedDropdown
      value={selectedCampus?.id ?? ""}
      options={CAMPUS_OPTIONS}
      onChange={(campusId) => selectCampus(onSelectCampus, campusId)}
      customTrigger={<CampusTrigger selectedCampus={selectedCampus} />}
      hideCheckmark={false}
      menuMaxHeight={220}
      usePortal
    />
  );
}

function DestinationChip({ customDestination, onClearCampus, onClearCustomDest, selectedCampus }) {
  if (customDestination) {
    return <LocationChip dotColor="var(--color-destination-red)" title={customDestination.name} subtitle={customDestination.address} onClear={onClearCustomDest} />;
  }

  if (selectedCampus) {
    return <LocationChip dotColor={selectedCampus.color} title={selectedCampus.name} subtitle={selectedCampus.address} onClear={onClearCampus} />;
  }

  return <p className={styles.hintText}>Select a campus or event as destination</p>;
}

function formatUpcomingTime(startTime) {
  if (!startTime) return "";
  return new Date(startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function UpcomingEventsList({ upcomingEvents, onSelectEvent }) {
  if (!Array.isArray(upcomingEvents) || upcomingEvents.length === 0) return null;
  return (
    <div className={styles.upcomingSection}>
      <div className={styles.subsectionLabel}>Upcoming events</div>
      <div className={styles.upcomingList}>
        {upcomingEvents.map((event) => (
          <UpcomingEventButton key={event.id || `${event.title}-${event.start_time}`} event={event} onSelectEvent={onSelectEvent} />
        ))}
      </div>
    </div>
  );
}

function UpcomingEventButton({ event, onSelectEvent }) {
  return (
    <button className={styles.upcomingBtn} onClick={() => onSelectEvent?.(event)}>
      <div className={styles.upcomingTitleRow}>
        <span className={styles.upcomingTitle}>{event.title || "Upcoming event"}</span>
        <span className={styles.upcomingTime}>{formatUpcomingTime(event.start_time)}</span>
      </div>
      <div className={styles.upcomingMeta}>{event.location}</div>
    </button>
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
