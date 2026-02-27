import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { ChevronUp } from "lucide-react";

import { authService } from "../api/authService";
import { useEventModal, useCalendar } from "../context/CalendarContext";
import { clearUserData } from "../components/Authentication/utils/authHelpers";

import Sidebar from "../components/Dashboard/Sidebar";
import TopBar from "../components/Dashboard/TopBar";
import WeekBar from "../components/Dashboard/WeekBar";
import { EventModal } from "../components/Calendar/EventModal/EventModal";

import styles from "./DashboardLayout.module.css";

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

function parseStoredUser(user) {
  const name = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}` : user.username;
  return {
    name, year: user.year ? `Year ${user.year}` : "Year: ",
    major: user.major || "Major: ", email: user.email,
    username: user.username, isAdmin: !!user.is_superuser
  };
}

function getUser() {
  const s = localStorage.getItem("user");
  if (!s) return undefined;
  try { return parseStoredUser(JSON.parse(s)); }
  catch (err) { console.error("Error parsing user data:", err); }
}

async function handleLogoutClick() {
  try { await authService.logout(); } catch (_) { }
  finally { clearUserData(); }
}

function DesktopSidebar({ isMobile, user, activeNav, onNavChange }) {
  if (isMobile) return null;
  return <Sidebar user={user} active={activeNav} onChange={onNavChange} />;
}

function MobileSidebar({ isMobile, open, user, activeNav, onPick, onClose }) {
  if (!isMobile || !open) return null;
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}><Sidebar user={user} active={activeNav} onChange={onPick} /></div>
    </>
  );
}

function PageContent({ activeNav, children }) {
  const isMapPage = activeNav === "map";
  const mapStyle = { padding: 0, overflow: "hidden", height: "100%" };
  return (
    <div className={styles.content} style={isMapPage ? mapStyle : undefined}>{children}</div>
  );
}

function MainArea({ user, onSettingsClick, onLogoutClick, onProfileClick, selectedDate, showWeekBar, activeNav, children }) {
  return (
    <div className={styles.main} data-dashboard-main>
      <div className={styles.mainContent} data-dashboard-main-content>
        <TopBar user={user} onSettingsClick={onSettingsClick}
          onLogoutClick={onLogoutClick} onProfileClick={onProfileClick} />
        {showWeekBar && <WeekBar date={selectedDate} />}
        <PageContent activeNav={activeNav}>{children}</PageContent>
      </div>
    </div>
  );
}

function EventModalGate({ modal }) {
  if (!modal.isModalOpen) return null;
  return <EventModal event={modal.modalEvent} initialType={modal.modalType}
    initialDate={modal.modalInitialDate} onClose={modal.closeModal} />;
}

function useDashboardState(activeNav, onNavChange) {
  const location = useLocation();
  const isMobile = useIsMobile(900);
  const user = useMemo(() => getUser(), []);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const calendarState = useCalendar();
  const selectedDate = calendarState?.selectedDate || new Date();
  const showWeekBar = activeNav === "calendar" || location.pathname.startsWith("/calendar");
  const modal = useEventModal();
  const onPickNav = (id) => { onNavChange?.(id); setMobileSidebarOpen(false); };
  return { isMobile, user, mobileSidebarOpen, setMobileSidebarOpen, selectedDate, showWeekBar, modal, onPickNav };
}

function DashboardSidebars({ isMobile, mobileSidebarOpen, user, activeNav, onNavChange, onPickNav, setMobileSidebarOpen }) {
  return (
    <>
      <DesktopSidebar isMobile={isMobile} user={user} activeNav={activeNav} onNavChange={onNavChange} />
      <MobileSidebar isMobile={isMobile} open={mobileSidebarOpen} user={user}
        activeNav={activeNav} onPick={onPickNav} onClose={() => setMobileSidebarOpen(false)} />
    </>
  );
}

function ScrollToTopFab({ activeNav, onScrollToTop }) {
  const isHome = activeNav === "home";
  if (!isHome) return null;
  return createPortal(
    <button
      type="button"
      className={styles.scrollToTop}
      onClick={onScrollToTop}
      aria-label="Scroll to top"
    >
      <ChevronUp size={24} strokeWidth={2.5} />
    </button>,
    document.body
  );
}

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const state = useDashboardState(activeNav, onNavChange);
  const { isMobile, user, mobileSidebarOpen, setMobileSidebarOpen, selectedDate, showWeekBar, modal, onPickNav } = state;
  const scrollToTop = useCallback(() => {
    const el = document.querySelector("[data-dashboard-main]");
    if (el) el.scrollTop = 0;
  }, []);

  return (
    <div className={styles.root}>
      <DashboardSidebars isMobile={isMobile} mobileSidebarOpen={mobileSidebarOpen}
        user={user} activeNav={activeNav} onNavChange={onNavChange}
        onPickNav={onPickNav} setMobileSidebarOpen={setMobileSidebarOpen} />
      <MainArea user={user}
        onSettingsClick={() => onNavChange?.("settings")}
        onLogoutClick={handleLogoutClick}
        onProfileClick={() => onNavChange?.("profile")}
        selectedDate={selectedDate}
        showWeekBar={showWeekBar}
        activeNav={activeNav}>
        {children}
      </MainArea>
      <EventModalGate modal={modal} />
      <ScrollToTopFab activeNav={activeNav} onScrollToTop={scrollToTop} />
    </div>
  );
}