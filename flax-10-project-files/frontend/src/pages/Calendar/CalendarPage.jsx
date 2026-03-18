import { useMemo, useEffect } from "react";
import AppPage from "../../components/common/AppPage/AppPage";
import { Calendar } from "../../components/Calendar/Calendar";
import {
  useCalendar,
  useCalendarDispatch,
} from "../../context/CalendarContext";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import styles from "./CalendarPage.module.css";
import { CalendarHeader } from "../../components/Calendar/CalendarHeader";
import { EventPopups } from "../../components/Calendar/EventPopups";
import { useEventPopupListener } from "../../components/Calendar/hooks/useEventPopupListener";
import useBreakpoint from "../../hooks/useBreakpoint";

function CalendarPageSkeleton() {
  return (
    <div className={styles.page} data-testid="calendar-skeleton" aria-busy="true">
      <div className={styles.skeletonStickyHeader}>
        <div className={styles.skeletonCalendarHeader}>
          <SkeletonBlock className={styles.skeletonNav} />
          <SkeletonBlock className={styles.skeletonTitle} />
          <SkeletonBlock className={styles.skeletonNav} />
        </div>
      </div>
      <main className={styles.mainContent}>
        <div className={styles.skeletonCalendarGrid}>
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className={styles.skeletonCalendarRow}>
              <SkeletonBlock className={styles.skeletonTimeCol} />
              <SkeletonBlock className={styles.skeletonEventLane} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function CalendarPage() {
  const { allEvents, selectedDate, viewMode, isLoading } = useCalendar();
  const dispatch = useCalendarDispatch();
  const isMobile = useBreakpoint();
  useEventPopupListener();

  // Redirect week view to day view on mobile
  useEffect(() => {
    if (isMobile && viewMode === "week") {
      dispatch({ type: "SET_VIEW_MODE", payload: "day" });
    }
  }, [isMobile, viewMode, dispatch]);

  if (isLoading && allEvents.length === 0) {
    return (
      <AppPage title="Calendar" subtitle="Schedule & events" width="full">
        <CalendarPageSkeleton />
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Calendar"
      subtitle="Your scheduled events and study sessions"
      width="full"
      className={styles.page}
    >
      <div className={styles.calendarContainer}>
        <div className={styles.stickyHeader}>
          <CalendarHeader />
        </div>

        <main className={styles.mainContent}>
          <Calendar />
        </main>
      </div>

      <EventPopups allowModuleLeave={false} />
    </AppPage>
  );
}
