/**
 * Destination selection section.
 */

import baseStyles from "../../pages/CampusMap/CampusMap.module.css";
import sidebarStyles from "../../pages/CampusMap/sidebar.module.css";
import { KCL_CAMPUSES } from "../../lib/kclCampuses";
import { LocationChip } from "./LocationChip";
import AnimatedDropdown from "../common/AnimatedDropdown";

const styles = { ...baseStyles, ...sidebarStyles };

const CAMPUS_OPTIONS = KCL_CAMPUSES.map((c) => ({
  value: c.id,
  label: c.shortName,
  icon: <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, display: "inline-block", flexShrink: 0 }} />,
}));

function CampusList({ onSelectCampus, selectedCampus }) {
  const handleChange = (campusId) => {
    const campus = KCL_CAMPUSES.find((c) => c.id === campusId);
    if (campus) onSelectCampus(campus);
  };
  return (
    <AnimatedDropdown
      value={selectedCampus?.id ?? ""}
      options={CAMPUS_OPTIONS}
      onChange={handleChange}
      customTrigger={
        <button type="button" className={styles.campusDropdownTrigger}>
          {selectedCampus
            ? <><span style={{ width: 10, height: 10, borderRadius: "50%", background: selectedCampus.color, display: "inline-block" }} /> {selectedCampus.shortName}</>
            : "Select campus…"
          }
          <span className={styles.campusDropdownChevron}>▾</span>
        </button>
      }
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
  if (!hasUpcomingEvents(upcomingEvents)) return null;
  return (
    <div className={styles.upcomingSection}>
      <div className={styles.subsectionLabel}>Upcoming events</div>
      <div className={styles.upcomingList}>
        {upcomingEvents.map((event) => (
          <UpcomingEventButton key={getUpcomingEventKey(event)} event={event} onSelectEvent={onSelectEvent} />
        ))}
      </div>
    </div>
  );
}

function hasUpcomingEvents(events) {
  return Array.isArray(events) && events.length > 0;
}

function getUpcomingEventKey(event) {
  return event.id || `${event.title}-${event.start_time}`;
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
