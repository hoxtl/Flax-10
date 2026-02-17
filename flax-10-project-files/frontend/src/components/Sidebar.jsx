import { useEffect, useState, useCallback, memo } from "react";
import styles from "./Sidebar.module.css";
import { getInitials } from "../utils/userUtils";
import { APP_ROUTES } from "../lib/routes";
import { getPreferredFirstName } from "../utils/userDisplay";
import { getUserProfile } from "../api/userService";

const getDisplayName = (profileData, user) =>
  profileData?.username || user?.username || getPreferredFirstName(user) || "User";

const getYearLabel = (profileData, user) => {
  const yearRaw = profileData?.year ?? user?.year;
  if (!yearRaw) return "Year 2";
  const s = String(yearRaw);
  return s.startsWith("Year") ? s : `Year ${s}`;
};

const getMajor = (profileData, user) => profileData?.major || user?.major || "CS";

const getProfilePhotoUrl = (profileData, user) =>
  profileData?.profile_photo_url || user?.profile_photo_url || null;

function useProfileListeners(refresh) {
  useEffect(() => {
    const onAuth = () => refresh();
    const onProfile = () => refresh();
    refresh();
    window.addEventListener("auth-changed", onAuth);
    window.addEventListener("profile-updated", onProfile);
    return () => {
      window.removeEventListener("auth-changed", onAuth);
      window.removeEventListener("profile-updated", onProfile);
    };
  }, [refresh]);
}

function useLoadProfile(setProfileData) {
  return useCallback(async () => {
    try {
      setProfileData(await getUserProfile());
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  }, [setProfileData]);
}

function useProfileData() {
  const [profileData, setProfileData] = useState(null);
  const loadProfile = useLoadProfile(setProfileData);
  useProfileListeners(loadProfile);
  return profileData;
}

function SidebarHeader({ collapsed }) {
  return (
    <div className={`${styles.header} ${collapsed ? styles.headerCollapsed : ""}`}>
      {!collapsed && <span className={styles.brand}>StudyFlax</span>}
    </div>
  );
}

function NavItem({ item, isActive, collapsed, onClick }) {
  const cls = [
    styles.navItem,
    collapsed ? styles.navItemCollapsed : styles.navItemExpanded,
    isActive ? styles.navItemActive : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button onClick={onClick} className={cls}>
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

const ProfileNavButton = memo(function ProfileNavButton({ active, onChange, collapsed }) {
  return (
    <NavItem
      item={{ id: "profile", icon: "👤", label: "Profile" }}
      isActive={active === "profile"}
      collapsed={collapsed}
      onClick={() => onChange?.("profile")}
    />
  );
});

function Avatar({ photoUrl, initials }) {
  return (
    <div className={styles.avatar}>
      {photoUrl ? (
        <img src={photoUrl} alt="Profile" className={styles.avatarImage} />
      ) : (
        initials
      )}
    </div>
  );
}

function UserText({ collapsed, displayName, year, major }) {
  if (collapsed) return null;
  return (
    <div className={styles.userText}>
      <div className={styles.userName}>{displayName}</div>
      <div className={styles.userMeta}>
        {year} · {major}
      </div>
    </div>
  );
}

function UserRow({ collapsed, displayName, year, major, photoUrl }) {
  const initials = getInitials(displayName) || "?";
  return (
    <div className={`${styles.user} ${collapsed ? styles.userCollapsed : styles.userExpanded}`}>
      <Avatar photoUrl={photoUrl} initials={initials} />
      <UserText collapsed={collapsed} displayName={displayName} year={year} major={major} />
    </div>
  );
}

function useSidebarProfile(user) {
  const profileData = useProfileData();

  return {
    displayName: getDisplayName(profileData, user),
    year: getYearLabel(profileData, user),
    major: getMajor(profileData, user),
    photoUrl: getProfilePhotoUrl(profileData, user),
  };
}

function SidebarFooter({ active, onChange, collapsed, user }) {
  const profile = useSidebarProfile(user);

  return (
    <div className={styles.sidebarFooter}>
      <ProfileNavButton active={active} onChange={onChange} collapsed={collapsed} />
      <UserRow collapsed={collapsed} {...profile} />
    </div>
  );
}

export default function Sidebar({ active, onChange, collapsed, user }) {
  const W = collapsed ? 72 : 224;
  return (
    <aside className={styles.sidebar} style={{ width: W, minWidth: W }}>
      <SidebarHeader collapsed={collapsed} />
      <SidebarNav active={active} onChange={onChange} collapsed={collapsed} />
      <SidebarFooter active={active} onChange={onChange} collapsed={collapsed} user={user} />
    </aside>
  );
}
