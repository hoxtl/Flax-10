import styles from "./Topbar.module.css";
import { DAYS, MONTHS } from "../lib/uiConstants";
import { getGreeting } from "../utils/dateUtils";
import ProfileDropdown from "./ProfileDropdown";
import { getDisplayName } from "../utils/userDisplay";
import { ExpandableTabs } from "./ExpandableTabs";
import ThemeToggle from "./ThemeToggle";
import { Bell, Plus } from "lucide-react";

function getFirstName(user) {
  const displayName = (getDisplayName(user) || "").trim();
  return displayName ? displayName.split(" ")[0] : "";
}

function getCurrentDateString() {
  const now = new Date();
  return `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

function TopBarGreeting({ user }) {
  const firstName = getFirstName(user);
  return (
    <div className={styles.greeting}>
      <span className={styles.subGreeting}>{getGreeting()}!</span>
      <div className={styles.nameRow}>
        {!!firstName && <h1 className={styles.name}>{firstName}</h1>}
        <span className={styles.date}>{getCurrentDateString()}</span>
      </div>
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

function QuickTabs({ onAddClick }) {
  const tabs = [
    { title: "Add", icon: Plus, autoCollapse: true },
    { type: "separator" },
    { title: "Notifications", icon: Bell },
  ];
  const handleChange = (index) => {
    if (index === 0) onAddClick?.();
  };
  return <ExpandableTabs tabs={tabs} onChange={handleChange} />;
}

function ActionPill({ onAddClick }) {
  return (
    <div className={styles.actionPill}>
      <ThemeToggle />
      <div className={styles.pillDivider} />
      <QuickTabs onAddClick={onAddClick} />
    </div>
  );
}

function TopBarActions({ onAddClick, user, onSettingsClick, onLogoutClick, onProfileClick }) {
  return (
    <div className={styles.actions}>
      <SearchInput />
      <ActionPill onAddClick={onAddClick} />
      <ProfileDropdown
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}

export default function TopBar({ onAddClick, user, onSettingsClick, onLogoutClick, onProfileClick }) {
  return (
    <header className={styles.container}>
      <TopBarGreeting user={user} />
      <TopBarActions
        onAddClick={onAddClick}
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </header>
  );
}