import { useState, useRef, useEffect } from "react";
import styles from "./ProfileDropdown.module.css";
import { getInitials } from "../utils/userUtils";
import { getDisplayName } from "../utils/userDisplay";

function isClickOutside(element, event) {
  if (!element) return false;
  return !element.contains(event.target);
}

function useClickOutside(ref, onClose, isActive) {
  useEffect(() => {
    if (!isActive) return;
    
    const handler = (e) => {
      if (isClickOutside(ref.current, e)) onClose();
    };
    
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose, isActive]);
}

function DropdownHeader({ user }) {
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName) || "?";
  const year = user?.year || "Year 2";
  const major = user?.major || "CS";

  return (
    <div className={styles.dropdownHeader}>
      <div className={styles.avatarLarge}>{initials}</div>
      <div className={styles.userInfo}>
        <div className={styles.userName}>{displayName}</div>
        <div className={styles.userMeta}>{year} · {major}</div>
      </div>
    </div>
  );
}

// Single menu item
function MenuItem({ icon, label, onClick, isDanger }) {
  const className = isDanger 
    ? `${styles.menuItem} ${styles.menuItemDanger}`
    : styles.menuItem;

  return (
    <button className={className} onClick={onClick}>
      <span className={styles.menuIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Divider() {
  return <div className={styles.divider} />;
}

function DropdownMenu({ isOpen, onClose, onSettingsClick, onLogoutClick, user }) {
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <DropdownHeader user={user} />
      <Divider />
      <MenuItem icon="⚙️" label="Settings" onClick={onSettingsClick} />
      <Divider />
      <MenuItem icon="🚪" label="Log out" onClick={onLogoutClick} isDanger />
    </div>
  );
}

function AvatarButton({ initials, onClick }) {
  return (
    <button className={styles.avatar} onClick={onClick} aria-label="User menu">
      {initials}
    </button>
  );
}

// Main profile dropdown
export default function ProfileDropdown({ user, onSettingsClick, onLogoutClick }) {
    const [isOpen, setIsOpen] = useState(false);
    const initials = getInitials(getDisplayName(user)) || "?";
    const handleSettingsClick = () => {
      setIsOpen(false);
      onSettingsClick?.();
    };
  
    const handleLogoutClick = () => {
      setIsOpen(false);
      onLogoutClick?.();
    };
  
    return (
      <div className={styles.container}>
        <AvatarButton initials={initials} onClick={() => setIsOpen(!isOpen)} />
        <DropdownMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSettingsClick={handleSettingsClick}
          onLogoutClick={handleLogoutClick}
          user={user}
        />
      </div>
    );
  }