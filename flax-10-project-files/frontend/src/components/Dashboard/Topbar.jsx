import { useState, useEffect } from "react";
import styles from "./Topbar.module.css";
import ProfileDropdown from "./ProfileDropdown";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationPanel } from "../Notifications/NotificationPanel";
import { ExpandableTabs } from "./ExpandableTabs";
import ThemeToggle from "./ThemeToggle";
import { Bell } from "lucide-react";

function useCurrentTime() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
  );
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }));
    }, 60000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function useCurrentDate() {
  const [dateStr, setDateStr] = useState(() =>
    new Date().toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" })
  );
  useEffect(() => {
    const t = setInterval(() => {
      setDateStr(new Date().toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" }));
    }, 60000);
    return () => clearInterval(t);
  }, []);
  return dateStr;
}

function TopBarGreeting() {
  const time = useCurrentTime();
  const dateStr = useCurrentDate();
  return (
    <div className={styles.greeting}>
      <span className={styles.bigTime}>{time}</span>
      <span className={styles.dateSub}>{dateStr}</span>
    </div>
  );
}

function SearchInput() {
  return (
    <div className={styles.search}>
      <span className={styles.searchIcon}>🔍</span>
      <input className={styles.searchInput} placeholder="Search…" />
    </div>
  );
}

function QuickTabs() {
  const { togglePanel, notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const tabs = [
    { title: "Notifications", icon: Bell, badge: unreadCount },
  ];
  const handleChange = (index) => {
    if (index === 0) togglePanel();
  };
  return <ExpandableTabs tabs={tabs} onChange={handleChange} />;
}

function ActionPill() {
  return (
    <div className={styles.actionPill}>
      <ThemeToggle />
      <div className={styles.pillDivider} />
      <QuickTabs />
      <NotificationPanel />
    </div>
  );
}

function TopBarActions({ user, onSettingsClick, onLogoutClick, onProfileClick }) {
  return (
    <div className={styles.actions}>
      <SearchInput />
      <ActionPill />
      <ProfileDropdown
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}

export default function TopBar({ user, onSettingsClick, onLogoutClick, onProfileClick, onNavChange, activeNav }) {
  return (
    <header className={styles.container}>
      <TopBarGreeting />
      <TopBarActions
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </header>
  );
}
