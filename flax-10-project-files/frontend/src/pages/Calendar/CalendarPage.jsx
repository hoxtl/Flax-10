/*
 * CalendarPage.jsx
 * Main entry point for the calendar page.
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppPage from "../../components/common/AppPage/AppPage";
import { Calendar } from "../../components/Calendar/Calendar";
import { useCalendar, useCalendarDispatch } from "../../context/CalendarContext";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import BackButton from "../../components/common/BackButton/BackButton";
import { BackToTop } from "../../components/Pagination/Pagination";
import styles from "./CalendarPage.module.css";
import { CalendarHeader } from "../../components/Calendar/CalendarHeader";
import { EventPopups } from "../../components/Calendar/EventPopups";
import { useEventPopupListener } from "../../components/Calendar/hooks/useEventPopupListener";
import useBreakpoint from "../../hooks/useBreakpoint";
import { getAnotherUserProfile } from "../../api/userApi";

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

function formatPossessive(name) {
  if (!name) return "this person's";
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

function getSharedCalendarParams(search = "") {
  const params = new URLSearchParams(search);
  return {
    userId: params.get("user_id"),
    userName: params.get("shared_name") || "",
  };
}

function useSharedCalendarProfile(userId, fallbackName) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!userId) {
      setProfile(null);
      return undefined;
    }

    getAnotherUserProfile(userId)
      .then((data) => {
        if (!isMounted) return;
        setProfile(data || null);
      })
      .catch(() => {
        if (!isMounted) return;
        setProfile((current) => current || { name: fallbackName, email: "" });
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackName, userId]);

  return profile;
}

function useSharedCalendarState(dispatch) {
  const location = useLocation();
  const { userId, userName } = getSharedCalendarParams(location.search);
  const sharedProfile = useSharedCalendarProfile(userId, userName);

  useEffect(() => {
    dispatch({ type: "SET_SHARED_CALENDAR_VIEW", payload: { userId, userName } });
    dispatch({ type: "SET_READ_ONLY", payload: Boolean(userId) });
    return () => {
      dispatch({ type: "SET_SHARED_CALENDAR_VIEW", payload: { userId: null, userName: "" } });
      dispatch({ type: "SET_READ_ONLY", payload: false });
    };
  }, [dispatch, userId, userName]);

  return {
    isSharedCalendar: Boolean(userId),
    sharedCalendarUserId: userId,
    sharedCalendarName: sharedProfile?.name || userName,
    sharedCalendarEmail: sharedProfile?.email || "",
  };
}

function SharedCalendarBanner({ sharedCalendarName, sharedCalendarEmail }) {
  const tipName = sharedCalendarName || "your classmate";

  return (
    <div className={styles.sharedCalendarBanner}>
      <div className={styles.sharedCalendarMeta}>
        <div className={styles.sharedCalendarEyebrow}>Shared Calendar</div>
        <div className={styles.sharedCalendarTitleRow}>
          <h1 className={styles.sharedCalendarTitle}>
            Viewing {formatPossessive(sharedCalendarName)} shared calendar
          </h1>
          <span className={styles.sharedCalendarModePill}>Read-only mode</span>
        </div>
        <p className={styles.sharedCalendarDescription}>
          Browse <em className={styles.sharedCalendarEmphasis}>busy and free blocks</em>, <em className={styles.sharedCalendarEmphasis}>compare timings</em>, and use this view to plan around {tipName}&apos;s availability.
        </p>
        {sharedCalendarEmail && (
          <a className={styles.sharedCalendarEmail} href={`mailto:${sharedCalendarEmail}`}>
            Contact: {sharedCalendarEmail}
          </a>
        )}
      </div>
    </div>
  );
}

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
  const sharedCalendar = useSharedCalendarState(dispatch);

  useEventPopupListener();
  useMobileViewRedirect(isMobile, viewMode, dispatch);

  return { allEvents, isLoading, ...sharedCalendar };
}

function SharedCalendarBackButton({ sharedCalendarUserId, sharedCalendarName }) {
  const navigate = useNavigate();
  if (!sharedCalendarUserId) return null;
  const label = sharedCalendarName
    ? `Back to ${formatPossessive(sharedCalendarName)} profile`
    : "Back to profile";
  return (
    <div className={styles.sharedCalendarBackRow}>
      <BackButton
        label={label}
        onClick={() => navigate(`/profile/${sharedCalendarUserId}`)}
      />
    </div>
  );
}

function CalendarPageContent({ isSharedCalendar, sharedCalendarUserId, sharedCalendarName, sharedCalendarEmail }) {
  const title = isSharedCalendar ? null : "Calendar";
  const subtitle = isSharedCalendar ? null : calendarSubtitle;
  return (
    <AppPage title={title} subtitle={subtitle} width="full" className={styles.page}>
      {isSharedCalendar && (
        <SharedCalendarBackButton
          sharedCalendarUserId={sharedCalendarUserId}
          sharedCalendarName={sharedCalendarName}
        />
      )}
      <div className={isSharedCalendar ? styles.sharedCalendarFrame : styles.calendarFrame}>
        {isSharedCalendar && (
          <SharedCalendarBanner
            sharedCalendarName={sharedCalendarName}
            sharedCalendarEmail={sharedCalendarEmail}
          />
        )}
        <div className={styles.calendarContainer}>
          <div className={styles.stickyHeader}>
            <CalendarHeader />
          </div>
          <main className={styles.mainContent}><Calendar /></main>
        </div>
      </div>
      <EventPopups allowModuleLeave={false} />
      {isSharedCalendar && <BackToTop alwaysVisible />}
    </AppPage>
  );
}

export default function CalendarPage() {
  const state = useCalendarPageState();
  const showSkeleton = state.isLoading && state.allEvents.length === 0;
  if (showSkeleton) return <CalendarPageSkeleton />;
  return (
    <CalendarPageContent
      isSharedCalendar={state.isSharedCalendar}
      sharedCalendarUserId={state.sharedCalendarUserId}
      sharedCalendarName={state.sharedCalendarName}
      sharedCalendarEmail={state.sharedCalendarEmail}
    />
  );
}
