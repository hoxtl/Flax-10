import { useState } from 'react';
import baseStyles from '../../pages/CampusMap/CampusMap.module.css';
import statusStyles from '../../pages/CampusMap/status.module.css';
const styles = { ...baseStyles, ...statusStyles };
import { getPriorityColor } from './mapUtils';

function EventCard({ event, onClick }) {
  const color = getPriorityColor(event.priority);
  const timeStr = new Date(event.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={styles.eventCard} onClick={onClick}>
      <div className={styles.eventPriorityBar} style={{ backgroundColor: color }} />
      <div className={styles.eventCardContent}>
        <div className={styles.eventCardHeader}>
          <span className={styles.eventTime}>{timeStr}</span>
          <span className={styles.eventPriority} style={{ color }}>{event.priority}</span>
        </div>
        <div className={styles.eventTitle}>{event.title}</div>
        <div className={styles.eventLocation}>📍 {event.location}</div>
      </div>
    </div>
  );
}

function EmptyEvents() {
  return (
    <div className={styles.noEvents}>
      <span className={styles.noEventsIcon}>✨</span>
      <p>No events to show on UniMap...</p>
    </div>
  );
}

export function CalendarEventsSection({ events, onEventClick }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? events : events.slice(0, 3);
  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>
        <span className={styles.calendarIcon}>📅</span>
        Events Today
      </div>
      {events.length === 0 ? <EmptyEvents /> : (
        <>
          <div className={styles.eventsList}>
            {visible.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
            ))}
          </div>
          {events.length > 3 && (
            <button className={styles.showMoreBtn} onClick={() => setShowAll(!showAll)}>
              {showAll
                ? <>Show Less <span>▲</span></>
                : <>Show {events.length - 3} More <span>▼</span></>}
            </button>
          )}
        </>
      )}
    </section>
  );
}
