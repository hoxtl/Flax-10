import { useEffect, useState, useCallback } from "react";
import styles from "./Sidebar.module.css";
import { getInitials } from "../Authentication/utils/userUtils";
import { APP_ROUTES } from "../../lib/routes";
import { getPreferredFirstName } from "../Authentication/utils/userDisplay";
import { getUserProfile } from "../../api/userService";

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

function SidebarFooter({ active, onChange, collapsed, user }) {
  const [profileData, setProfileData] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getUserProfile();
      setProfileData(data);
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    const onAuthChanged = () => loadProfile();
    window.addEventListener("auth-changed", onAuthChanged);

    const onProfileUpdated = () => loadProfile();
    window.addEventListener("profile-updated", onProfileUpdated);

    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("profile-updated", onProfileUpdated);
    };
  }, [loadProfile]);

  const displayName =
    profileData?.username ||
    user?.username ||
    getPreferredFirstName(user) ||
    "User";

  const initials = getInitials(displayName) || "?";

  const yearRaw = profileData?.year ?? user?.year;
  const year = yearRaw
    ? String(yearRaw).startsWith("Year")
      ? String(yearRaw)
      : `Year ${yearRaw}`
    : "Year 2";

  const major = profileData?.major || user?.major || "CS";

  const profilePhotoUrl = profileData?.profile_photo_url || user?.profile_photo_url;

  return (
    <div className={styles.sidebarFooter}>
      <NavItem
        item={{ id: "profile", icon: "👤", label: "Profile" }}
        isActive={active === "profile"}
        collapsed={collapsed}
        onClick={() => onChange?.("profile")}
      />

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
            <div className={styles.userName}>{displayName}</div>
            <div className={styles.userMeta}>
              {year} · {major}
            </div>
          </div>
        )}
      </div>
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
