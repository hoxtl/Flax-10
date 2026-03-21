/*
 * Topbar profile dropdown menu.
 */

import { useState, useRef, useEffect } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";
import styles from "./ProfileDropdown.module.css";
import { getInitials } from "../Authentication/utils/userUtils";
import { useAuth } from "../../context/AuthContext";
import { getResolvedUserPhoto } from "../../utils/tutorPhotoFallback";

function useClickOutside(ref, onClose, isActive) {
  useEffect(() => {
    if (!isActive) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose, isActive]);
}

function AvatarImage({ src }) {
  return <img src={src} alt="Profile" className={styles.avatarImage} />;
}

function HeaderAvatar({ profilePhotoUrl, initials }) {
  return (
    <div className={styles.avatarLarge}>
      {profilePhotoUrl ? <AvatarImage src={profilePhotoUrl} /> : initials}
    </div>
  );
}

function HeaderUserInfo({ displayName, major }) {
  return (
    <div className={styles.userInfo}>
      <div className={styles.userName}>{displayName}</div>
      <div className={styles.userMeta}>{major}</div>
    </div>
  );
}

function resolveDisplayName(user) {
  return user?.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User";
}

function DropdownHeader({ user, profilePhotoUrl }) {
  const initials = getInitials(user?.name) || "?";
  const displayName = resolveDisplayName(user);
  const major = user?.major || "Computer Science";
  return (
    <div className={styles.dropdownHeader}>
      <HeaderAvatar profilePhotoUrl={profilePhotoUrl} initials={initials} />
      <HeaderUserInfo displayName={displayName} major={major} />
    </div>
  );
}

function MenuItem({ icon, label, onClick, isDanger }) {
  const cls = isDanger ? `${styles.menuItem} ${styles.menuItemDanger}` : styles.menuItem;
  return (
    <button className={cls} onClick={onClick}>
      <span className={styles.menuIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Divider() { return <div className={styles.divider} />; }

function DropdownMenu({ isOpen, onClose, onSettingsClick, onLogoutClick, onProfileClick, user, profilePhotoUrl }) {
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, onClose, isOpen);
  if (!isOpen) return null;
  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <DropdownHeader user={user} profilePhotoUrl={profilePhotoUrl} />
      <Divider />
      <MenuItem icon={<UserRound size={16} />} label="Profile" onClick={onProfileClick} />
      <MenuItem icon={<Settings size={16} />} label="Settings" onClick={onSettingsClick} />
      <Divider />
      <MenuItem icon={<LogOut size={16} />} label="Log out" onClick={onLogoutClick} isDanger />
    </div>
  );
}

function AvatarButton({ initials, profilePhotoUrl, onClick }) {
  return (
    <button className={styles.avatar} onClick={onClick} aria-label="User menu">
      {profilePhotoUrl ? <AvatarImage src={profilePhotoUrl} /> : initials}
    </button>
  );
}

function closeAndRun(setIsOpen, callback) {
  setIsOpen(false);
  callback?.();
}

function useDropdownHandlers(setIsOpen, onSettingsClick, onLogoutClick, onProfileClick) {
  return {
    handleSettingsClick: () => closeAndRun(setIsOpen, onSettingsClick),
    handleLogoutClick: () => closeAndRun(setIsOpen, onLogoutClick),
    handleProfileClick: () => closeAndRun(setIsOpen, onProfileClick),
  };
}

function clearCloseTimer(closeTimerRef) {
  if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
}

function openDropdown(setIsOpen, closeTimerRef) {
  clearCloseTimer(closeTimerRef);
  setIsOpen(true);
}

function queueClose(setIsOpen, closeTimerRef) {
  clearCloseTimer(closeTimerRef);
  closeTimerRef.current = setTimeout(() => setIsOpen(false), 180);
}

function useHoverHandlers(setIsOpen, closeTimerRef) {
  return {
    onHoverEnter: () => openDropdown(setIsOpen, closeTimerRef),
    onHoverLeave: () => queueClose(setIsOpen, closeTimerRef),
  };
}

function useProfileDropdown(onSettingsClick, onLogoutClick, onProfileClick) {
  const { profile: profileData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef(null);
  const handlers = useDropdownHandlers(setIsOpen, onSettingsClick, onLogoutClick, onProfileClick);
  const hoverHandlers = useHoverHandlers(setIsOpen, closeTimerRef);
  useEffect(() => () => clearCloseTimer(closeTimerRef), []);
  return {
    isOpen,
    setIsOpen,
    profileData,
    ...handlers,
    ...hoverHandlers,
  };
}

function buildDisplayUser(user, profileData) {
  const merged = { ...user, ...profileData };
  return {
    ...merged,
    major: merged.major || "Computer Science",
  };
}

function getProfilePhotoUrl(profileData, displayUser) {
  return profileData?.profile_photo_url || getResolvedUserPhoto(displayUser, { allowGeneric: true });
}

function buildDropdownUser(displayUser) {
  return { ...displayUser, major: displayUser.major || "Computer Science" };
}

export default function ProfileDropdown({ user, onSettingsClick, onLogoutClick, onProfileClick }) {
  const dropdown = useProfileDropdown(onSettingsClick, onLogoutClick, onProfileClick);
  const initials = getInitials(user?.name) || "?";
  const displayUser = buildDisplayUser(user, dropdown.profileData);
  const profilePhotoUrl = getProfilePhotoUrl(dropdown.profileData, displayUser);
  return (
    <div className={styles.container} onMouseEnter={dropdown.onHoverEnter} onMouseLeave={dropdown.onHoverLeave}>
      <AvatarButton initials={initials} profilePhotoUrl={profilePhotoUrl} onClick={() => dropdown.setIsOpen(!dropdown.isOpen)} />
      <DropdownMenu
        isOpen={dropdown.isOpen}
        onClose={() => dropdown.setIsOpen(false)}
        onSettingsClick={dropdown.handleSettingsClick}
        onLogoutClick={dropdown.handleLogoutClick}
        onProfileClick={dropdown.handleProfileClick}
        user={buildDropdownUser(displayUser)}
        profilePhotoUrl={profilePhotoUrl}
      />
    </div>
  );
}
