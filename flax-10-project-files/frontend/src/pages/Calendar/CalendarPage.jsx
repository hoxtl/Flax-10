/*
 * CalendarPage.jsx
 * Main entry point for the calendar page.
 */

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppPage from "../../components/common/app_page/AppPage";
import { Calendar } from "../../components/calendar/Calendar";
import { useCalendar, useCalendarDispatch } from "../../context/CalendarContext";
import SkeletonBlock from "../../components/common/loading_state/SkeletonBlock";
import BackButton from "../../components/common/back_button/BackButton";
import { BackToTop } from "../../components/pagination/Pagination";
import styles from "./CalendarPage.module.css";
import { CalendarHeader } from "../../components/calendar/CalendarHeader";
import { EventPopups } from "../../components/calendar/EventPopups";
import { useEventPopupListener } from "../../components/calendar/hooks/useEventPopupListener";
import useBreakpoint from "../../hooks/useBreakpoint";
import { getAnotherUserProfile } from "../../api/userApi";
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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
<<<<<<< HEAD
    Keep your <em>lectures</em>, <em>societies</em>, and <em>life events</em>{" "}
    organised across your week.
  </>
);

function formatPossessive(name) {
  if (!name) return "this person's";
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

function getSharedCalendarParams(search) {
  const params = new URLSearchParams(search);
  return {
    userId: params.get("user_id"),
    userName: params.get("shared_name") || "",
  };
}

function useSharedCalendarProfile(userId, fallbackName) {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!userId) return undefined;
    let isMounted = true;
    loadSharedProfile(userId, fallbackName, setProfile, () => isMounted);
    return () => {
      isMounted = false;
    };
  }, [fallbackName, userId]);
  return profile;
}

function loadSharedProfile(userId, fallbackName, setProfile, isMounted) {
  getAnotherUserProfile(userId)
    .then((data) => isMounted() && setProfile(data || null))
    .catch(() => isMounted() && setProfile((current) => current || fallbackProfile(fallbackName)));
}

function fallbackProfile(name) {
  return { name, email: "" };
}

function useSharedCalendarDispatch(dispatch, userId, userName) {
  useEffect(() => {
    dispatch({ type: "SET_SHARED_CALENDAR_VIEW", payload: { userId, userName } });
    dispatch({ type: "SET_READ_ONLY", payload: Boolean(userId) });
    return () => resetSharedCalendarDispatch(dispatch);
  }, [dispatch, userId, userName]);
}

function resetSharedCalendarDispatch(dispatch) {
  dispatch({ type: "SET_SHARED_CALENDAR_VIEW", payload: { userId: null, userName: "" } });
  dispatch({ type: "SET_READ_ONLY", payload: false });
}

function useSharedCalendarState(dispatch) {
  const { search } = useLocation();
  const { userId, userName } = getSharedCalendarParams(search);
  const sharedProfile = useSharedCalendarProfile(userId, userName);
  useSharedCalendarDispatch(dispatch, userId, userName);
  return {
    isSharedCalendar: Boolean(userId),
    sharedCalendarUserId: userId,
    sharedCalendarName: sharedProfile?.name || userName,
    sharedCalendarEmail: sharedProfile?.email || "",
  };
}

function SharedCalendarDescription({ sharedCalendarName }) {
  const tipName = sharedCalendarName || "your classmate";
  return (
    <p className={styles.sharedCalendarDescription}>
      Browse <em className={styles.sharedCalendarEmphasis}>busy and free blocks</em>,{" "}
      <em className={styles.sharedCalendarEmphasis}>compare timings</em>, and use
      this view to plan around {tipName}&apos;s availability.
    </p>
  );
}

function SharedCalendarContact({ sharedCalendarEmail }) {
  if (!sharedCalendarEmail) return null;
  return (
    <a className={styles.sharedCalendarEmail} href={`mailto:${sharedCalendarEmail}`}>
      Contact: {sharedCalendarEmail}
    </a>
  );
}

function SharedCalendarBanner({ sharedCalendarName, sharedCalendarEmail }) {
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
        <SharedCalendarDescription sharedCalendarName={sharedCalendarName} />
        <SharedCalendarContact sharedCalendarEmail={sharedCalendarEmail} />
      </div>
    </div>
  );
}

function CalendarPageSkeleton() {
  return (
    <div
      className={styles.page}
      data-testid="calendar-skeleton"
      aria-busy="true"
    >
=======
    Keep your <em>lectures</em>, <em>societies</em>, and <em>life events</em> organised across your week.
  </>
);

function CalendarPageSkeleton() {
  return (
    <div className={styles.page} data-testid="calendar-skeleton" aria-busy="true">
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD
  const sharedCalendar = useSharedCalendarState(dispatch);
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

  useEventPopupListener();
  useMobileViewRedirect(isMobile, viewMode, dispatch);

<<<<<<< HEAD
  return { allEvents, isLoading, ...sharedCalendar };
}

function SharedCalendarBackButton({ sharedCalendarUserId, sharedCalendarName }) {
  const navigate = useNavigate();
  if (!sharedCalendarUserId) return null;
  const label = getSharedBackLabel(sharedCalendarName);
  return (
    <div className={styles.sharedCalendarBackRow}>
      <BackButton
        label={label}
        onClick={() => navigate(`/profile/${sharedCalendarUserId}`)}
      />
    </div>
  );
}

function getSharedBackLabel(sharedCalendarName) {
  return sharedCalendarName
    ? `Back to ${formatPossessive(sharedCalendarName)} profile`
    : "Back to profile";
}

function getCalendarShellClass(isSharedCalendar) {
  return isSharedCalendar ? styles.sharedCalendarFrame : styles.calendarFrame;
}

function SharedCalendarSection({ isSharedCalendar, sharedCalendarEmail, sharedCalendarName }) {
  if (!isSharedCalendar) return null;
  return (
    <SharedCalendarBanner
      sharedCalendarName={sharedCalendarName}
      sharedCalendarEmail={sharedCalendarEmail}
    />
  );
}

function CalendarFrame(props) {
  return (
    <div className={getCalendarShellClass(props.isSharedCalendar)}>
      <SharedCalendarSection {...props} />
=======
  return { allEvents, isLoading };
}

function CalendarPageContent() {
  return (
    <AppPage title="Calendar" subtitle={calendarSubtitle} width="full" className={styles.page}>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      <div className={styles.calendarContainer}>
        <div className={styles.stickyHeader}>
          <CalendarHeader />
        </div>
<<<<<<< HEAD
        <main className={styles.mainContent}>
          <Calendar />
        </main>
      </div>
    </div>
  );
}

function CalendarPageFooter({ isSharedCalendar }) {
  return (
    <>
      <EventPopups allowModuleLeave={false} />
      {isSharedCalendar && <BackToTop alwaysVisible />}
    </>
  );
}

function CalendarPageContent(props) {
  const { isSharedCalendar } = props;
  const title = isSharedCalendar ? null : "Calendar";
  const subtitle = isSharedCalendar ? null : calendarSubtitle;
  return (
    <AppPage title={title} subtitle={subtitle} width="full" className={styles.page}>
      <SharedCalendarBackButton
        sharedCalendarUserId={props.sharedCalendarUserId}
        sharedCalendarName={props.sharedCalendarName}
      />
      <CalendarFrame {...props} />
      <CalendarPageFooter isSharedCalendar={isSharedCalendar} />
=======
        <main className={styles.mainContent}><Calendar /></main>
      </div>
      <EventPopups allowModuleLeave={false} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </AppPage>
  );
}

export default function CalendarPage() {
<<<<<<< HEAD
  const { allEvents, isLoading, ...sharedCalendar } = useCalendarPageState();
  if (isLoading && allEvents.length === 0) return <CalendarPageSkeleton />;
  return <CalendarPageContent {...sharedCalendar} />;
}
=======
  const state = useCalendarPageState();
  const showSkeleton = state.isLoading && state.allEvents.length === 0;
  if (showSkeleton) return <CalendarPageSkeleton />;
  return <CalendarPageContent />;
}

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
