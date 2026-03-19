import React, { useMemo } from "react";
import { Clock, Calendar, MapPin } from "lucide-react";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import baseStyles from "../styles/WidgetBase.module.css";
import styles from "./TinyTimelineWidget.module.css";
import { formatTime } from "../utils/dateFormatUtils";
import { isNow } from "../utils/eventUtils";

export function TinyTimelineWidget({
  now = new Date(),
  sortedEvents = [],
  navigatorContext = {}
}) {
  const safeNow = (now instanceof Date && !isNaN(now)) ? now : new Date();
  
  const currentBlock = useMemo(() => {
    return sortedEvents.find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time)) || null;
  }, [sortedEvents]);

  const upcomingEvents = useMemo(() => {
    const nowMs = safeNow.getTime();
    return sortedEvents
      .filter((e) => e.start_time && new Date(e.start_time).getTime() > nowMs)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 3);
  }, [sortedEvents, safeNow]);

  const hasEvents = currentBlock || upcomingEvents.length > 0;

  return (
    <div className={styles.root}>
      <div className={baseStyles.widgetHeader}>
        <div className={baseStyles.headerIconWrap}>
          <Clock size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
        </div>
        <span className={baseStyles.headerTitle}>Timeline</span>
      </div>

      {!hasEvents ? (
        <div className={styles.emptyState}>
          <Calendar size={24} strokeWidth={1} />
          <p>No events remaining today</p>
        </div>
      ) : (
        <div className={styles.timeline}>
          <div className={styles.spine} />
          {[...(currentBlock ? [currentBlock] : []), ...upcomingEvents].map((event, idx) => {
            const isCurrent = currentBlock && event.id === currentBlock.id;
            const typeLabel = event.type || (event.source === "task" ? "Task" : "Event");
            
            return (
              <motion.div
                key={event.id || idx}
                className={styles.eventRow}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className={`${styles.marker} ${isCurrent ? styles.markerNow : ""}`}>
                  <div className={styles.dot} />
                </div>
                
                <div className={`${styles.eventCard} ${isCurrent ? styles.cardNow : ""}`}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTime}>
                      {formatTime(event.start_time)}
                    </span>
                    <span className={`${styles.cardBadge} ${isCurrent ? styles.badgeNow : ""}`}>
                      {typeLabel}
                    </span>
                  </div>
                  <h4 className={styles.cardTitle}>{event.title}</h4>
                  {event.location && (
                    <div className={styles.cardLocation}>
                      <MapPin size={12} className={styles.locationIcon} />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}


      <Link to="#timeline-section" className={styles.viewAll}>
        View full plan →
      </Link>
    </div>
  );
}

export default TinyTimelineWidget;
