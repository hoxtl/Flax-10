import { useState, useRef, useEffect } from "react";
import styles from "./ProfileDropdown.module.css";
import { getInitials } from "../Authentication/utils/userUtils";
import { getPreferredFirstName, getDisplayName } from "../Authentication/utils/userDisplay";
import { getUserProfile } from "../../api/userService";

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

function DropdownHeader({ user, profilePhotoUrl }) {
  const initials = getInitials(user?.name) || "?";
  const year = user?.year || "Year 2";
  const major = user?.major || "CS";
  const displayName =
    user?.name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    "User";
  return (
    <div className={styles.dropdownHeader}>
      <div className={styles.avatarLarge}>
        {profilePhotoUrl ? (
          <img src={profilePhotoUrl} alt="Profile" className={styles.avatarImage} />
        ) : (
          initials
        )}
      </div>
      <div className={styles.userInfo}>
        <div className={styles.userName}>{displayName}</div>
        <div className={styles.userMeta}>{year} · {major}</div>
      </div>
    </div>
  );
}

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

function DropdownMenu({ isOpen, onClose, onSettingsClick, onLogoutClick, onProfileClick, user, profilePhotoUrl }) {
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, onClose, isOpen);
  if (!isOpen) return null;
  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <DropdownHeader user={user} profilePhotoUrl={profilePhotoUrl} />
      <Divider />
      <MenuItem icon="👤" label="Profile" onClick={onProfileClick} />
      <MenuItem icon="⚙️" label="Settings" onClick={onSettingsClick} />
      <Divider />
      <MenuItem icon="🚪" label="Log out" onClick={onLogoutClick} isDanger />
    </div>
  );
}

function AvatarButton({ initials, profilePhotoUrl, onClick }) {
  return (
    <button className={styles.avatar} onClick={onClick} aria-label="User menu">
      {profilePhotoUrl ? (
        <img src={profilePhotoUrl} alt="Profile" className={styles.avatarImage} />
      ) : (
        initials
      )}
    </button>
  );
}

async function loadProfileData(setProfileData) {
  try {
    const data = await getUserProfile();
    setProfileData(data);
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (data.profile_photo_url) {
      currentUser.profile_photo_url = data.profile_photo_url;
      localStorage.setItem("user", JSON.stringify(currentUser));
    }
  } catch (error) {
    console.error("Failed to load profile:", error);
  }
}

export default function ProfileDropdown({ user, onSettingsClick, onLogoutClick, onProfileClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const initials = getInitials(user?.name) || "?";

  useEffect(() => { loadProfileData(setProfileData); }, []);

  const handleSettingsClick = () => { setIsOpen(false); onSettingsClick?.(); };
  const handleLogoutClick = () => { setIsOpen(false); onLogoutClick?.(); };
  const handleProfileClick = () => { setIsOpen(false); onProfileClick?.(); };

  const displayUser = {
    ...user,
    year: profileData?.year || user?.year,
    major: profileData?.major || user?.major,
  };

  const profilePhotoUrl = profileData?.profile_photo_url;

  return (
    <div className={styles.container}>
      <AvatarButton
        initials={initials}
        profilePhotoUrl={profilePhotoUrl}
        onClick={() => setIsOpen(!isOpen)}
      />
      <DropdownMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSettingsClick={handleSettingsClick}
        onLogoutClick={handleLogoutClick}
        onProfileClick={handleProfileClick}
        user={displayUser}
        profilePhotoUrl={profilePhotoUrl}
      />
    </div>
  );
}