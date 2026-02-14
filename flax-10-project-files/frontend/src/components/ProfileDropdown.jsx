import { useState, useRef, useEffect } from "react";
import styles from "./ProfileDropdown.module.css";
import { getInitials } from "../utils/userUtils";
import { getUserProfile } from "../api/userService";

// Check if click is outside element
function isClickOutside(element, event) {
  if (!element) return false;
  return !element.contains(event.target);
}

// Custom hook for click outside detection
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

// Dropdown header with user info
function DropdownHeader({ user, profilePhotoUrl }) {
  const initials = getInitials(user?.name) || "?";
  const year = user?.year || "Year 2";
  const major = user?.major || "CS";

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
        <div className={styles.userName}>{user?.name || "Guest"}</div>
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

// Divider line
function Divider() {
  return <div className={styles.divider} />;
}

// Dropdown menu content
function DropdownMenu({ isOpen, onClose, onSettingsClick, onLogoutClick, user, profilePhotoUrl }) {
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <DropdownHeader user={user} profilePhotoUrl={profilePhotoUrl} />
      <Divider />
      <MenuItem icon="⚙️" label="Settings" onClick={onSettingsClick} />
      <Divider />
      <MenuItem icon="🚪" label="Log out" onClick={onLogoutClick} isDanger />
    </div>
  );
}

// Avatar button
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

// Main profile dropdown
// Main profile dropdown
export default function ProfileDropdown({ user, onSettingsClick, onLogoutClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const initials = getInitials(user?.name) || "?";

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfileData(data);
        
        // Update localStorage with fresh profile photo URL
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (data.profile_photo_url) {
          currentUser.profile_photo_url = data.profile_photo_url;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSettingsClick = () => {
    setIsOpen(false);
    onSettingsClick?.();
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogoutClick?.();
  };

  const displayUser = {
    ...user,
    year: profileData?.year || user?.year,
    major: profileData?.major || user?.major,
  };

  const profilePhotoUrl = profileData?.profile_photo_url;
  
  console.log('ProfileDropdown render:', { profilePhotoUrl, initials });

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
        user={displayUser}
        profilePhotoUrl={profilePhotoUrl}
      />
    </div>
  );
}
