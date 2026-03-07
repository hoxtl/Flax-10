import { useMemo, useState, useEffect } from "react";
import { Calendar } from "../../components/Calendar/Calendar";
import PillFilters from "../../components/Tags/PillFilters";
import {
  useCalendar,
  useCalendarDispatch,
} from "../../context/CalendarContext";
import { getVisibleEventsInView } from "../../components/Calendar/utils/eventUtils";
import styles from "./CalendarPage.module.css";
import { CalendarHeader } from "../../components/Calendar/CalendarHeader";
import { EventPopups } from "../../components/Calendar/EventPopups";
import { useEventPopupListener } from "../../components/Calendar/hooks/useEventPopupListener";

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

export default function CalendarPage() {
  const { filter, allEvents, selectedDate, viewMode } = useCalendar();
  const dispatch = useCalendarDispatch();
  const isMobile = useIsMobile();
  useEventPopupListener();

  // Redirect week view to day view on mobile
  useEffect(() => {
    if (isMobile && viewMode === "week") {
      dispatch({ type: "SET_VIEW_MODE", payload: "day" });
    }
  }, [isMobile, viewMode, dispatch]);

  const visibleItems = useMemo(
    () => getVisibleEventsInView(allEvents, selectedDate, viewMode),
    [allEvents, selectedDate, viewMode],
  );

  const handleFilterChange = (key) => {
    dispatch({ type: "SET_FILTER", payload: key });
  };

  return (
    <div className={styles.page}>
      <CalendarHeader />

      <div className={styles.filters}>
        <PillFilters
          active={filter}
          onChange={handleFilterChange}
          items={visibleItems}
        />
      </div>

      <main className={styles.mainContent}>
        <Calendar />
      </main>

      <EventPopups />
    </div>
  );
}
