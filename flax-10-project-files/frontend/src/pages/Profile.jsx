import { useState, useEffect } from "react";
import styles from "./Profile.module.css";
import { getInitials } from "../components/Authentication/utils/userUtils";
import EditProfileModal from "../components/Dashboard/EditProfileModal";
import { getUserProfile } from "../api/userService";
import { getEvents } from "../api/event_api";

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dateOffset(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function isInRange(eventStart, today, range) {
  if (range === 'today') return eventStart >= today && eventStart < dateOffset(today, 1);
  if (range === 'week') return eventStart >= today && eventStart < dateOffset(today, 7);
  return eventStart >= today && eventStart < dateOffset(today, 30);
}

function getFilteredEvents(allEvents, eventRange) {
  const today = getToday();
  return allEvents
    .filter(e => isInRange(new Date(e.start_time), today, eventRange))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

function getUpcomingCount(allEvents) {
  const today = getToday();
  return allEvents.filter(e => isInRange(new Date(e.start_time), today, 'month')).length;
}

async function tryLoadProfile(setProfileData, setLoading) {
  try { const data = await getUserProfile(); setProfileData(data); }
  catch (e) { console.error('Failed to load profile:', e); }
  finally { setLoading(false); }
}

async function tryLoadEvents(setAllEvents) {
  try { const data = await getEvents(); setAllEvents(data || []); }
  catch (e) { console.error('Failed to load events:', e); }
}

function useProfileState() {
  const [showModules, setShowModules] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [eventRange, setEventRange] = useState('month');
  const [loading, setLoading] = useState(true);
  useEffect(() => { tryLoadProfile(setProfileData, setLoading); tryLoadEvents(setAllEvents); }, []);
  const handleSaveProfile = async () => { await tryLoadProfile(setProfileData, setLoading); setShowEditProfile(false); };
  return { showModules, setShowModules, showTasks, setShowTasks, showEvents, setShowEvents, showEditProfile, setShowEditProfile, profileData, allEvents, eventRange, setEventRange, loading, handleSaveProfile };
}


function ProfileHeader({ user, profileData, onNavChange, onModulesClick, onTasksClick, onEventsClick, onEditProfile, upcomingEventCount }) {
  const initials = user?.name ? getInitials(user.name) : "JD";

  return (
    <div className={styles.headerWrapper}>

      <div className={styles.mobileOnly}>
        <div className={styles.mobileHero}>
          <div className={styles.avatarWrapper}>
            <div className={styles.mainAvatar}>
              {profileData?.profile_photo_url ? (
                <img src={profileData.profile_photo_url} alt="Profile" />
              ) : initials}
            </div>
          </div>
          <h1 className={styles.mobileName}>{user?.name || "John Doe"}</h1>
          <p className={styles.mobileSubtext}>
            {profileData?.year || "Year 1"} · {profileData?.major || "Computer Science"}
          </p>
        </div>

        <div className={styles.mobileStatsGrid}>
          <div className={styles.mobileStatCard}>
            <span className={styles.statNumber}>{profileData?.modules?.length || 0}</span>
            <span className={styles.statLabel}>Modules</span>
          </div>
          <div className={styles.mobileStatCard}>
            <span className={styles.statNumber}>0</span>
            <span className={styles.statLabel}>Tasks</span>
          </div>
          <div className={styles.mobileStatCard}>
            <span className={styles.statNumber}>{upcomingEventCount || 0}</span>
            <span className={styles.statLabel}>Events</span>
          </div>
        </div>

        <div className={styles.actionArea}>
          <button className={styles.mobileEditBtn} onClick={onEditProfile}>Edit profile</button>
        </div>

        <div className={styles.mobileSummaryCard}>
          <h3 className={styles.cardHeader}>My Profile Summary</h3>
          <div className={styles.summaryLine}><span>Level:</span> <strong>{profileData?.year || "Year 1"}</strong></div>
          <div className={styles.summaryLine}><span>Major:</span> <strong>{profileData?.major || "Computer Science"}</strong></div>
          <div className={styles.summaryLine}><span>Account:</span> <strong>{user?.username}</strong></div>
        </div>

        <div className={styles.mobileSummaryCard}>
          <h3 className={styles.cardHeader}>Quick Actions</h3>
          <div className={styles.quickActionsGrid}>
            <button onClick={() => onNavChange('modules')} className={styles.quickActionBtn}>
              <div className={styles.actionIcon}>📚</div>
              <span>Start a Module</span>
            </button>
            <button onClick={() => onNavChange('tasks')} className={styles.quickActionBtn}>
              <div className={styles.actionIcon}>📅</div>
              <span>View My Tasks</span>
            </button>
            <button onClick={() => onNavChange('calendar')} className={styles.quickActionBtn}>
              <div className={styles.actionIcon}>✅</div>
              <span>Check for Events</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.desktopOnly}>
        <header className={styles.header}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.headerInfo}>
            <div className={styles.headerTop}>
              <h1 className={styles.username}>{user?.username}</h1>
              <button className={styles.btnEdit} onClick={onEditProfile}>Edit Profile</button>
            </div>
            <div className={styles.stats}>
              <div className={styles.statItem} onClick={onModulesClick}>
                <strong>{profileData?.modules?.length || 0}</strong> modules
              </div>
              <div className={styles.statItem} onClick={onTasksClick}>
                <strong>0</strong> tasks
              </div>
              <div className={styles.statItem} onClick={onEventsClick}>
                <strong>{upcomingEventCount}</strong> events this month
              </div>
            </div>
            <div className={styles.bio}>
              <div className={styles.name}>{user?.name}</div>
              <div className={styles.major}>{profileData?.year} · {profileData?.major}</div>
            </div>
          </div>
        </header>
      </div>

    </div>
  );
}


function ModalInner({ onClose, title, children }) {
  return (
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>{title}</h2>
        <button className={styles.modalClose} onClick={onClose}>✕</button>
      </div>
      <div className={styles.modalContent}>{children}</div>
    </div>
  );
}


function ModulesGrid({ modules }) {
  return (
    <div className={styles.modulesGrid}>
      {modules.slice(0, 6).map((code, i) => (
        <div key={i} className={styles.moduleCard}>
          <div className={styles.moduleIcon}>📚</div>
          <div className={styles.moduleCode}>{code}</div>
        </div>
      ))}
    </div>
  );
}

function ProfileModals({ state, user, profileData}) {
  const { showEditProfile, setShowEditProfile, handleSaveProfile } = state;
  return (
    <>
      <EditProfileModal user={profileData || user} isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} onSave={handleSaveProfile} />
    </>
  );
}

export default function Profile({ user, onNavChange }) {
  const state = useProfileState();
  const { showModules: _sm, profileData, allEvents, eventRange, loading, setShowEditProfile } = state;
  if (loading) return <div className={styles.container}>Loading...</div>;
  const modules = profileData?.modules || [];
  const filteredEvents = getFilteredEvents(allEvents, eventRange);
  const upcomingEventCount = getUpcomingCount(allEvents);
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <ProfileHeader 
          user={profileData || user} 
          onNavChange={onNavChange} 
          profileData={profileData} 
          onEditProfile={() => setShowEditProfile(true)} 
          upcomingEventCount={upcomingEventCount} 
        />
      </div>
      <ProfileModals state={state} user={user} profileData={profileData} modules={modules} filteredEvents={filteredEvents} />
    </div>);
}