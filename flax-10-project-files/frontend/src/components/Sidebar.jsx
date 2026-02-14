import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { APP_ROUTES } from '../lib/routes';
import { getInitials } from '../utils/userUtils';
import { getUserProfile } from '../api/userService';

function SidebarHeader({ collapsed }) {
  return (
    <div className={`${styles.header} ${collapsed ? styles.headerCollapsed : ''}`}>
      {!collapsed && <div className={styles.brand}>StudyFlax</div>}
      {collapsed && <div className={styles.brand}>SF</div>}
    </div>
  );
}

function NavItem({ item, isActive, collapsed, onClick }) {
  const itemClass = `${styles.navItem} ${
    collapsed ? styles.navItemCollapsed : styles.navItemExpanded
  } ${isActive ? styles.navItemActive : ''}`;

  return (
    <button className={itemClass} onClick={onClick}>
      <span className={styles.icon}>{item.icon}</span>
      {!collapsed && <span className={styles.label}>{item.label}</span>}
    </button>
  );
}

function SidebarNav({ active, onChange, collapsed }) {
  return (
    <nav className={styles.nav}>
      {APP_ROUTES.map((n) => (
        <NavItem
          key={n.id}
          item={n}
          isActive={active === n.id}
          collapsed={collapsed}
          onClick={() => onChange?.(n.id)}
        />
      ))}
    </nav>
  );
}

function ProfileButton({ onClick, collapsed }) {
  return (
    <button
      className={`${styles.navItem} ${collapsed ? styles.navItemCollapsed : styles.navItemExpanded}`}
      onClick={onClick}
    >
      <span className={styles.icon}>👤</span>
      {!collapsed && <span className={styles.label}>Profile</span>}
    </button>
  );
}

function SidebarUserProfile({ user, collapsed }) {
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfileData(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, []);

  const userName = user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';
  const year = profileData?.year || user?.year || 'Year 2';
  const major = profileData?.major || user?.major || 'Computer Science';
  const initials = getInitials(userName);
  const profilePhotoUrl = profileData?.profile_photo_url;

  return (
    <div className={`${styles.user} ${collapsed ? styles.userCollapsed : styles.userExpanded}`}>
      <div className={styles.avatar}>
        {profilePhotoUrl ? (
          <img src={profilePhotoUrl} alt="Profile" className={styles.avatarImage} />
        ) : (
          initials
        )}
      </div>
      {!collapsed && (
        <div className={styles.userText}>
          <div className={styles.userName}>{userName}</div>
          <div className={styles.userMeta}>{year} · {major}</div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ user, active, onChange, collapsed }) {
  const handleProfileClick = () => {
    onChange?.("profile");
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <SidebarHeader collapsed={collapsed} />
      <SidebarNav active={active} onChange={onChange} collapsed={collapsed} />
      <div className={styles.sidebarFooter}>
        <ProfileButton onClick={handleProfileClick} collapsed={collapsed} />
        <SidebarUserProfile user={user} collapsed={collapsed} />
      </div>
    </aside>
  );
}
