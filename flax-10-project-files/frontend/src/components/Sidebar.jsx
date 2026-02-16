import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";
import { getInitials } from "../utils/userUtils";
import { APP_ROUTES } from "../lib/routes";
import { getPreferredFirstName } from "../utils/userDisplay";
import { getUserProfile } from "../api/userService";

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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfileData(data);
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    };
    loadProfile();
  }, []);

  const firstName = getPreferredFirstName(user);
  const initials = getInitials(firstName) || "?";

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
      {/* ✅ Profile button at bottom (same big button styling) */}
      <NavItem
        item={{ id: "profile", icon: "👤", label: "Profile" }}
        isActive={active === "profile"}
        collapsed={collapsed}
        onClick={() => onChange?.("profile")}
      />

      {/* ✅ User block (with profile photo) */}
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
            <div className={styles.userName}>{firstName}</div>
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
