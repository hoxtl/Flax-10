/**
 * CalendarPage - Main calendar page with header, filters, and calendar views.
 * Handles view mode switching and filter state management.
 */
import { useMemo, useEffect } from "react";
import { Calendar } from "../../components/Calendar/Calendar";
import PillFilters from "../../components/Tags/PillFilters";
import { useCalendar, useCalendarDispatch } from "../../context/CalendarContext";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import { getVisibleEventsInView } from "../../components/Calendar/utils/eventUtils";
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

function SkeletonFilters() {
  return (
    <div className={styles.filters}>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonBlock key={i} className={styles.skeletonFilterPill} />
      ))}
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

function CalendarPageSkeleton({ showSearch = true }) {
  return (
    <div className={styles.page} data-testid="calendar-skeleton" aria-busy="true">
      <div className={styles.skeletonStickyHeader}>
        <SkeletonHeader />
        {showSearch && <SkeletonFilters />}
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
  const { filter, allEvents, selectedDate, viewMode, isLoading, displayMode } = useCalendar();
  const dispatch = useCalendarDispatch();
  const isMobile = useBreakpoint();

  useEventPopupListener();
  useMobileViewRedirect(isMobile, viewMode, dispatch);

  const visibleItems = useMemo(
    () => getVisibleEventsInView(allEvents, selectedDate, viewMode),
    [allEvents, selectedDate, viewMode],
  );

  return { filter, allEvents, isLoading, displayMode, visibleItems, dispatch };
}

function CalendarPageContent({ state }) {
  return (
    <div className={styles.page}>
      <div className={styles.stickyHeader}>
        <CalendarHeader />
        <div className={styles.filters}>
          <PillFilters active={state.filter} onChange={(key) => state.dispatch({ type: "SET_FILTER", payload: key })} items={state.visibleItems} />
        </div>
      </div>
      <main className={styles.mainContent}><Calendar /></main>
      <EventPopups />
    </div>
  );
}

export default function CalendarPage() {
  const state = useCalendarPageState();
  const isListOrTable = state.displayMode === "list" || state.displayMode === "table";
  if (state.isLoading && state.allEvents.length === 0) return <CalendarPageSkeleton showSearch={!isListOrTable} />;
  return <CalendarPageContent state={state} />;
}
