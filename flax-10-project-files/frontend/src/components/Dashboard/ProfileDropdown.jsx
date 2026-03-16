import { useState, useRef, useEffect } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";
import styles from "./ProfileDropdown.module.css";
import { getInitials } from "../Authentication/utils/userUtils";
import { getUserProfile } from "../../api/userService";

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

function HeaderUserInfo({ displayName, year, major }) {
  return (
    <div className={styles.userInfo}>
      <div className={styles.userName}>{displayName}</div>
      <div className={styles.userMeta}>{year} · {major}</div>
    </div>
  );
}

function resolveDisplayName(user) {
  return user?.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User";
}

function DropdownHeader({ user, profilePhotoUrl }) {
  const initials = getInitials(user?.name) || "?";
  const displayName = resolveDisplayName(user);
  const year = user?.year || "Year 2";
  const major = user?.major || "CS";
  return (
    <div className={styles.dropdownHeader}>
      <HeaderAvatar profilePhotoUrl={profilePhotoUrl} initials={initials} />
      <HeaderUserInfo displayName={displayName} year={year} major={major} />
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

async function fetchProfileData() {
  try { return await getUserProfile(); }
  catch (error) { console.error("Failed to load profile:", error); return null; }
}

function updateLocalStoragePhoto(url) {
  const current = JSON.parse(localStorage.getItem("user") || "{}");
  current.profile_photo_url = url;
  localStorage.setItem("user", JSON.stringify(current));
}

async function loadProfileData(setProfileData) {
  const data = await fetchProfileData();
  if (!data) return;
  setProfileData(data);
  if (data.profile_photo_url) updateLocalStoragePhoto(data.profile_photo_url);
}

function useProfileDropdown(onSettingsClick, onLogoutClick, onProfileClick) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const closeTimerRef = useRef(null);
  useEffect(() => { loadProfileData(setProfileData); }, []);
  useEffect(() => {
    const syncProfile = () => { loadProfileData(setProfileData); };
    window.addEventListener("auth-changed", syncProfile);
    return () => window.removeEventListener("auth-changed", syncProfile);
  }, []);
  const handleSettingsClick = () => { setIsOpen(false); onSettingsClick?.(); };
  const handleLogoutClick = () => { setIsOpen(false); onLogoutClick?.(); };
  const handleProfileClick = () => { setIsOpen(false); onProfileClick?.(); };
  const onHoverEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsOpen(true);
  };
  const onHoverLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 180);
  };
  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);
  return {
    isOpen,
    setIsOpen,
    profileData,
    handleSettingsClick,
    handleLogoutClick,
    handleProfileClick,
    onHoverEnter,
    onHoverLeave,
  };
}

function buildDisplayUser(user, profileData) {
  const merged = { ...user, ...profileData };
  return {
    ...merged,
    year: merged.year || "Year 2",
    major: merged.major || "CS",
  };
}

function resolveYearDisplay(year) {
  if (!year) return "Year 2";
  if (typeof year === "string" && /^year\s+/i.test(year)) return year;
  if (!Number.isNaN(Number(year))) return `Year ${year}`;
  return year;
}

export default function ProfileDropdown({ user, onSettingsClick, onLogoutClick, onProfileClick }) {
  const {
    isOpen,
    setIsOpen,
    profileData,
    handleSettingsClick,
    handleLogoutClick,
    handleProfileClick,
    onHoverEnter,
    onHoverLeave,
  } =
    useProfileDropdown(onSettingsClick, onLogoutClick, onProfileClick);
  const initials = getInitials(user?.name) || "?";
  const profilePhotoUrl = profileData?.profile_photo_url;
  const displayUser = buildDisplayUser(user, profileData);
  const displayYear = resolveYearDisplay(displayUser.year);
  const displayMajor = displayUser.major || "CS";
  return (
    <div className={styles.container} onMouseEnter={onHoverEnter} onMouseLeave={onHoverLeave}>
      <AvatarButton initials={initials} profilePhotoUrl={profilePhotoUrl} onClick={() => setIsOpen(!isOpen)} />
      <DropdownMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSettingsClick={handleSettingsClick}
        onLogoutClick={handleLogoutClick}
        onProfileClick={handleProfileClick}
        user={{ ...displayUser, year: displayYear, major: displayMajor }}
        profilePhotoUrl={profilePhotoUrl}
      />
    </div>
  );
}
