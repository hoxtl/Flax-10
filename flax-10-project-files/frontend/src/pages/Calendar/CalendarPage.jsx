/**
 * CalendarPage - Main calendar page with header, filters, and calendar views.
 * Handles view mode switching and filter state management.
 */
import { useMemo, useEffect } from "react";
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

function SkeletonGrid() {
  return (
    <div className={styles.skeletonCalendarGrid}>
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className={styles.skeletonCalendarRow}>
          <SkeletonBlock className={styles.skeletonTimeCol} />
          <SkeletonBlock className={styles.skeletonEventLane} />
        </div>
      ))}
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
    if (isMobile && viewMode === "week") {
      dispatch({ type: "SET_VIEW_MODE", payload: "day" });
    }
  }, [isMobile, viewMode, dispatch]);
}

function useCalendarPageState() {
  const { allEvents, isLoading, displayMode, viewMode } = useCalendar();
  const dispatch = useCalendarDispatch();
  const isMobile = useBreakpoint();

  useEventPopupListener();
  useMobileViewRedirect(isMobile, viewMode, dispatch);

  return { allEvents, isLoading, displayMode, dispatch };
}

function CalendarPageContent({ state }) {
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
  if (state.isLoading && state.allEvents.length === 0) return <CalendarPageSkeleton />;
  return <CalendarPageContent state={state} />;
}

