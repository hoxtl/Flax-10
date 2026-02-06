import { useEffect, useMemo, useState } from "react";
import styles from "./DashboardLayout.module.css";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import WeekBar from "../components/WeekBar";
import QuickAddModal from "../components/QuickAddModal";
import AddEventModal from "../components/AddEventModal";
import { addEvent, loadEvents, deleteEvent } from "../lib/eventsStore";
import { parseDateInput } from "../lib/dateUtils";

// Custom hook to determine if the current device is mobile based on the window width, and update on resize
function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

// Utility function to get today's date with the time set to midnight, used as the initial selected date in the dashboard
function midnightToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Mock function to get user data, change to api call later
function getUser() {
  return { name: "Jane Smith", year: "Year 2", major: "CS" };
}

// Toggles the sidebar open/closed state based on whether the device is mobile or desktop, using the appropriate state setters
function toggleByDevice(isMobile, setMobileOpen, setCollapsed) {
  if (isMobile) return setMobileOpen((v) => !v);
  setCollapsed((c) => !c);
}

// Utility function to render the children prop, which can be either a React node or a function 
function renderChildren(children, selectedDate, setSelectedDate, events, onDelete) {
  if (typeof children !== "function") return children;
  return children({ selectedDate, setSelectedDate, events, onDelete });
}

// Component for the desktop sidebar, which is hidden on mobile devices
function DesktopSidebar({ isMobile, user, activeNav, onNavChange, collapsed }) {
  if (isMobile) return null;
  return <Sidebar user={user} active={activeNav} onChange={onNavChange} collapsed={collapsed} />;
}

// Component for the mobile sidebar, which is rendered as a drawer that overlays the main content when open
function MobileSidebar({ isMobile, open, user, activeNav, onPick, onClose }) {
  if (!isMobile || !open) return null;
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <Sidebar user={user} active={activeNav} onChange={onPick} collapsed={false} />
      </div>
    </>
  );
}

// Main area of the dashboard, containing the top bar, week bar, and the main content area where children are rendered
function MainArea({ user, onToggle, onQuickAdd, selectedDate, children }) {
  return (
    <div className={styles.main}>
      <TopBar user={user} onToggle={onToggle} onAddClick={onQuickAdd} />
      <WeekBar date={selectedDate} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

// Gate component for the quick add modal
function QuickAddGate({ open, onClose, onSelectType }) {
  if (!open) return null;
  return <QuickAddModal onClose={onClose} onSelectType={onSelectType} />;
}

// Gate component for the add event modal
function AddEventGate({ open, type, date, onClose, onSave }) {
  if (!open) return null;
  return <AddEventModal initialType={type} initialDate={date} onClose={onClose} onSave={onSave} />;
}

// Main dashboard layout component that composes the sidebar, main area, and modals together
export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const isMobile = useIsMobile(900), user = useMemo(getUser, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false), [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(midnightToday), [events, setEvents] = useState([]);
  function onDelete(id) {
    deleteEvent(id);
    setEvents((arr) => arr.filter((e) => e.id !== id));
  }
  const [showQuickAdd, setShowQuickAdd] = useState(false), [showForm, setShowForm] = useState(false), [selectedType, setSelectedType] = useState("class");
  useEffect(() => setEvents(loadEvents()), []);
  function onToggle() { toggleByDevice(isMobile, setMobileSidebarOpen, setSidebarCollapsed); }
  function onPickNav(id) { onNavChange?.(id); setMobileSidebarOpen(false); }
  function onSelectType(t) { setSelectedType(t); setShowQuickAdd(false); setShowForm(true); }
  function onSave(form) { const saved = addEvent({ ...form, date: form.date || parseDateInput(form.date) }); setEvents((e) => [...e, saved]); setShowForm(false); }
  const content = renderChildren(children, selectedDate, setSelectedDate, events, onDelete);
  return (
    <div className={styles.root}>
      <DesktopSidebar isMobile={isMobile} user={user} activeNav={activeNav} onNavChange={onNavChange} collapsed={sidebarCollapsed} />
      <MobileSidebar isMobile={isMobile} open={mobileSidebarOpen} user={user} activeNav={activeNav} onPick={onPickNav} onClose={() => setMobileSidebarOpen(false)} />
      <MainArea user={user} onToggle={onToggle} onQuickAdd={() => setShowQuickAdd(true)} selectedDate={selectedDate} children={content} />
      <QuickAddGate open={showQuickAdd} onClose={() => setShowQuickAdd(false)} onSelectType={onSelectType} />
      <AddEventGate open={showForm} type={selectedType} date={selectedDate} onClose={() => setShowForm(false)} onSave={onSave} />
    </div>
  );
}