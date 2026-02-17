import { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Sidebar.module.css";
import { getInitials } from "../utils/userUtils";
import { APP_ROUTES } from "../lib/routes";
import { getPreferredFirstName } from "../utils/userDisplay";
import { getUserProfile } from "../api/userService";

const EXPANDED_W = 224;
const COLLAPSED_W = 72;
const NAV_SPRING = { type: "spring", stiffness: 400, damping: 25 };
const SIDEBAR_SPRING = { type: "spring", stiffness: 280, damping: 30 };
const LOGO_SPRING = { type: "spring", stiffness: 400, damping: 20 };

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

function useSidebarProfile(user) {
  const profileData = useProfileData();
  return {
    displayName: getDisplayName(profileData, user),
    year: getYearLabel(profileData, user),
    major: getMajor(profileData, user),
    photoUrl: getProfilePhotoUrl(profileData, user),
  };
}

function LogoMark() {
  return (
    <motion.div
      className={styles.logoMark}
      whileHover={{ rotate: 8, scale: 1.08 }}
      transition={LOGO_SPRING}
    />
  );
}

function BrandName() {
  return (
    <motion.span
      className={styles.brand}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.18 }}
    >
      StudyFlax
    </motion.span>
  );
}

function SidebarHeader({ open }) {
  return (
    <div className={styles.header}>
      <LogoMark />
      <AnimatePresence>{open && <BrandName />}</AnimatePresence>
    </div>
  );
}

function NavLabel({ label }) {
  return (
    <motion.span
      className={styles.label}
      initial={{ opacity: 0, x: -4, width: 0 }}
      animate={{ opacity: 1, x: 0, width: "auto" }}
      exit={{ opacity: 0, x: -4, width: 0 }}
      transition={{ duration: 0.16 }}
    >
      {label}
    </motion.span>
  );
}

function ActivePill() {
  return (
    <motion.span
      className={styles.activePill}
      layoutId="activePill"
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    />
  );
}

function NavItem({ item, isActive, open, onClick }) {
  const cls = `${styles.navItem} ${isActive ? styles.navItemActive : ""}`;
  return (
    <motion.button
      onClick={onClick}
      className={cls}
      style={{ justifyContent: open ? "flex-start" : "center" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={NAV_SPRING}
    >
      <span className={styles.icon}>{item.icon}</span>
      <AnimatePresence>{open && <NavLabel label={item.label} />}</AnimatePresence>
      {isActive && <ActivePill />}
    </motion.button>);}

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

function Avatar({ photoUrl, initials }) {
  return (
    <div className={styles.avatar}>
      {photoUrl
        ? <img src={photoUrl} alt="Profile" className={styles.avatarImage} />
        : initials}
    </div>
  );
}

function AnimatedUserText({ displayName, year, major }) {
  return (
    <motion.div
      className={styles.userText}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.16 }}
    >
      <div className={styles.userName}>{displayName}</div>
      <div className={styles.userMeta}>{year} · {major}</div>
    </motion.div>
  );
}

function UserRow({ open, displayName, year, major, photoUrl }) {
  const initials = getInitials(displayName) || "?";
  const cls = `${styles.user} ${open ? styles.userExpanded : styles.userCollapsed}`;
  return (
    <div className={cls}>
      <Avatar photoUrl={photoUrl} initials={initials} />
      <AnimatePresence>
        {open && <AnimatedUserText displayName={displayName} year={year} major={major} />}
      </AnimatePresence>
    </div>
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

function SidebarFooter({ active, onChange, open, user }) {
  const profile = useSidebarProfile(user);
  return (
    <div className={styles.sidebarFooter}>
      <ProfileNavButton active={active} onChange={onChange} open={open} />
      <UserRow open={open} {...profile} />
    </div>
  );
}

export default function Sidebar({ active, onChange, user }) {
  const [open, setOpen] = useState(false);
  const w = open ? EXPANDED_W : COLLAPSED_W;
  return (
    <motion.aside
      className={styles.sidebar}
      animate={{ width: w, minWidth: w }}
      transition={SIDEBAR_SPRING}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader open={open} />
      <SidebarNav active={active} onChange={onChange} open={open} />
      <SidebarFooter active={active} onChange={onChange} open={open} user={user} />
    </motion.aside>);}