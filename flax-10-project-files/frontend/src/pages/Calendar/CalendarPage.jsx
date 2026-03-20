/*
 * CalendarPage.jsx
 * Main entry point for the calendar page.
 */

import { useEffect } from "react";
import AppPage from "../../components/common/AppPage/AppPage";
import { Calendar } from "../../components/Calendar/Calendar";
import { useCalendar, useCalendarDispatch } from "../../context/CalendarContext";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import styles from "./CalendarPage.module.css";
import { CalendarHeader } from "../../components/Calendar/CalendarHeader";
import { EventPopups } from "../../components/Calendar/EventPopups";
import { useEventPopupListener } from "../../components/Calendar/hooks/useEventPopupListener";
import useBreakpoint from "../../hooks/useBreakpoint";

function SkeletonHeader() {
  return (
    <div className={styles.skeletonCalendarHeader}>
      <SkeletonBlock className={styles.skeletonNav} />
      <SkeletonBlock className={styles.skeletonTitle} />
      <SkeletonBlock className={styles.skeletonNav} />
    </div>
  );
}

function SkeletonRow({ row }) {
  return (
    <div key={row} className={styles.skeletonCalendarRow}>
      <SkeletonBlock className={styles.skeletonTimeCol} />
      <SkeletonBlock className={styles.skeletonEventLane} />
    </div>
  );
}

function SkeletonGrid() {
  const rows = Array.from({ length: 5 });
  return (
    <div className={styles.skeletonCalendarGrid}>
      {rows.map((_, row) => <SkeletonRow key={row} row={row} />)}
    </div>
  );
}

const calendarSubtitle = (
  <>
    Keep your <em>lectures</em>, <em>societies</em>, and <em>life events</em> organised across your week.
  </>
);

function CalendarPageSkeleton() {
  return (
    <div className={styles.page} data-testid="calendar-skeleton" aria-busy="true">
      <div className={styles.skeletonStickyHeader}>
        <SkeletonHeader />
      </div>
      <main className={styles.mainContent}>
        <SkeletonGrid />
      </main>
    </div>
  );
}

function useMobileViewRedirect(isMobile, viewMode, dispatch) {
  useEffect(() => {
    const isWeekOnMobile = isMobile && viewMode === "week";
    if (isWeekOnMobile) dispatch({ type: "SET_VIEW_MODE", payload: "day" });
  }, [isMobile, viewMode, dispatch]);
}

function useCalendarPageState() {
  const { allEvents, isLoading, viewMode } = useCalendar();
  const dispatch = useCalendarDispatch();
  const isMobile = useBreakpoint();

  useEventPopupListener();
  useMobileViewRedirect(isMobile, viewMode, dispatch);

  return { allEvents, isLoading };
}

function CalendarPageContent() {
  return (
    <AppPage title="Calendar" subtitle={calendarSubtitle} width="full" className={styles.page}>
      <div className={styles.calendarContainer}>
        <div className={styles.stickyHeader}>
          <CalendarHeader />
        </div>
        <main className={styles.mainContent}><Calendar /></main>
      </div>
      <EventPopups allowModuleLeave={false} />
    </AppPage>
  );
}

export default function CalendarPage() {
  const state = useCalendarPageState();
  const showSkeleton = state.isLoading && state.allEvents.length === 0;
  if (showSkeleton) return <CalendarPageSkeleton />;
  return <CalendarPageContent />;
}

