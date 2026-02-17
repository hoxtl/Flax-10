import { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    refresh();
    window.addEventListener("auth-changed", refresh);
    window.addEventListener("profile-updated", refresh);
    return () => {
      window.removeEventListener("auth-changed", refresh);
      window.removeEventListener("profile-updated", refresh);
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

const EXPANDED_W = 224;
const COLLAPSED_W = 72;

function SidebarHeader({ open }) {
  return (
    <div className={styles.header}>
      <motion.div
        className={styles.logoMark}
        whileHover={{ rotate: 8, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      />
      <AnimatePresence>
        {open && (
          <motion.span
            className={styles.brand}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18 }}
          >
            StudyFlax
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ item, isActive, open, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
      style={{ justifyContent: open ? "flex-start" : "center" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <span className={styles.icon}>{item.icon}</span>
      <AnimatePresence>
        {open && (
          <motion.span
            className={styles.label}
            initial={{ opacity: 0, x: -4, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: -4, width: 0 }}
            transition={{ duration: 0.16 }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {isActive && (
        <motion.span
          className={styles.activePill}
          layoutId="activePill"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

function SidebarNav({ active, onChange, open }) {
  return (
    <nav className={styles.nav}>
      {APP_ROUTES.map((n) => (
        <NavItem
          key={n.id}
          item={n}
          isActive={active === n.id}
          open={open}
          onClick={() => onChange?.(n.id)}
        />
      ))}
    </nav>
  );
}

const ProfileNavButton = memo(function ProfileNavButton({ active, onChange, open }) {
  return (
    <NavItem
      item={{ id: "profile", icon: "👤", label: "Profile" }}
      isActive={active === "profile"}
      open={open}
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

function UserRow({ open, displayName, year, major, photoUrl }) {
  const initials = getInitials(displayName) || "?";
  return (
    <div className={`${styles.user} ${open ? styles.userExpanded : styles.userCollapsed}`}>
      <Avatar photoUrl={photoUrl} initials={initials} />
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.userText}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.16 }}
          >
            <div className={styles.userName}>{displayName}</div>
            <div className={styles.userMeta}>
              {year} · {major}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

function SidebarFooter({ active, onChange, open, user }) {
  const profile = useSidebarProfile(user);
  return (
    <div className={styles.sidebarFooter}>
      <ProfileNavButton active={active} onChange={onChange} open={open} />
      <UserRow open={open} {...profile} />
    </div>
  );
}

// ─── Main Sidebar — purely hover driven, no hamburger ─────────────────────────

export default function Sidebar({ active, onChange, user }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.aside
      className={styles.sidebar}
      animate={{
        width: open ? EXPANDED_W : COLLAPSED_W,
        minWidth: open ? EXPANDED_W : COLLAPSED_W,
      }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader open={open} />
      <SidebarNav active={active} onChange={onChange} open={open} />
      <SidebarFooter active={active} onChange={onChange} open={open} user={user} />
    </motion.aside>
  );
}