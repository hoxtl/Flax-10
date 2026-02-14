import styles from "./Topbar.module.css";
import { DAYS, MONTHS } from "../lib/uiConstants";
import { getGreeting } from "../utils/dateUtils";
import { getInitials } from "../utils/userUtils";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationCenter } from "./Notifications";
import ThemeToggle from "./ThemeToggle";

// Get current date parts
function getCurrentDateParts() {
  const now = new Date();
  return {
    day: DAYS[now.getDay()],
    date: now.getDate(),
    month: MONTHS[now.getMonth()],
  };
}

// Component that displays a greeting message based on the time of day, along with the user's first name and the current date
function TopBarGreeting({ user }) {
  const now = new Date();

  return (
    <div className={styles.greeting}>
      <span className={styles.subGreeting}>{getGreeting()}!</span>
      <div className={styles.nameRow}>
        <h1 className={styles.name}>{user?.name?.split(" ")[0] || "Guest"}</h1>
        <span className={styles.date}>
          {DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}
        </span>
      </div>
    </div>
  );
}

// Search input component with a search icon and placeholder text, allowing users to search for events or tasks
function SearchInput() {
  return (
    <div className={styles.search}>
      <span className={styles.searchIcon}>🔍</span>
      <input className={styles.searchInput} placeholder="Search…" />
    </div>
  );
}

// Button component that displays a plus icon and triggers the onClick callback when pressed, used for adding new events or tasks
function AddButton({ onClick }) {
  return (
    <button className={styles.addBtn} onClick={onClick}>
      <span className={styles.addIcon}>+</span>
    </button>
  );
}

// Component that renders the search input, add button, notifications, and user avatar
function TopBarActions({ onAddClick, user, onSettingsClick, onLogoutClick }) {
  return (
    <div className={styles.actions}>
      <SearchInput />
      <ThemeToggle />
      <AddButton onClick={onAddClick} />
      <NotificationCenter />
      <ProfileDropdown
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
      />
    </div>
  );
}

// Main TopBar component that composes the greeting and actions components
export default function TopBar({ onToggle, onAddClick, user, onSettingsClick, onLogoutClick }) {
  return (
    <header className={styles.container}>
      <div className={styles.left}>
        <button className={styles.toggle} onClick={onToggle}>
          ☰
        </button>
        <TopBarGreeting user={user} />
      </div>
      <TopBarActions
        onAddClick={onAddClick}
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
      />
    </header>
  );
}