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


function useProfileDropdown(onSettingsClick, onLogoutClick, onProfileClick) {
  const { profile: profileData, refreshProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef(null);

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
    major: merged.major || "Computer Science",
  };
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
  const displayUser = buildDisplayUser(user, profileData);
  const profilePhotoUrl = profileData?.profile_photo_url || getResolvedUserPhoto(displayUser, { allowGeneric: true });
  const displayMajor = displayUser.major || "Computer Science";
  return (
    <div className={styles.container} onMouseEnter={onHoverEnter} onMouseLeave={onHoverLeave}>
      <AvatarButton initials={initials} profilePhotoUrl={profilePhotoUrl} onClick={() => setIsOpen(!isOpen)} />
      <DropdownMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSettingsClick={handleSettingsClick}
        onLogoutClick={handleLogoutClick}
        onProfileClick={handleProfileClick}
        user={{ ...displayUser, major: displayMajor }}
        profilePhotoUrl={profilePhotoUrl}
      />
    </div>
  );
}
