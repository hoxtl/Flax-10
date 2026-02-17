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

function ProfileAvatar({ user, profilePhotoUrl }) {
  const initials = user?.name ? getInitials(user.name) : (user?.first_name && user?.last_name ? `${user.first_name[0]}${user.last_name[0]}` : "?");
  return (
    <div className={styles.avatar}>
      {profilePhotoUrl ? <img src={profilePhotoUrl} alt="Profile" className={styles.avatarImage} /> : initials}
    </div>
  );
}

function ProfileStats({ profileData, upcomingEventCount, onModulesClick, onTasksClick, onEventsClick }) {
  return (
    <div className={styles.stats}>
      <StatItem value={profileData?.module_count || 0} label="modules" onClick={onModulesClick} />
      <StatItem value={profileData?.task_count || 0} label="tasks" onClick={onTasksClick} />
      <StatItem value={upcomingEventCount || 0} label="events" onClick={onEventsClick} />
    </div>
  );
}

function ProfileBio({ user, profileData }) {
  const fullName = user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || "Guest";
  const year = profileData?.year || user?.year || "Year 2";
  const major = profileData?.major || user?.major || "Computer Science";
  return (
    <div className={styles.bio}>
      <div className={styles.fullName}>{fullName}</div>
      <div className={styles.description}>{year} · {major}</div>
      {profileData?.bio && <div className={styles.reminder}>{profileData.bio}</div>}
    </div>
  );
}

function ProfileHeader({ user, profileData, onModulesClick, onTasksClick, onEventsClick, onEditProfile, upcomingEventCount }) {
  const fullName = user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || "Guest";
  const username = user?.username || "guest";
  const year = profileData?.year || user?.year || "Year 2";
  const major = profileData?.major || user?.major || "Computer Science";

  const moduleCount = profileData?.module_count || 0;
  const taskCount = profileData?.task_count || 0;
  const eventCount = profileData?.event_count || 0;

  return (
    <div className={styles.header}>
      <ProfileAvatar user={user} profilePhotoUrl={profileData?.profile_photo_url} />
      <div className={styles.headerInfo}>
        <div className={styles.headerTop}>
          <h1 className={styles.username}>{user?.username || "guest"}</h1>
          <button className={styles.btnEdit} onClick={onEditProfile}>Edit profile</button>
        </div>
        <ProfileStats profileData={profileData} upcomingEventCount={upcomingEventCount} onModulesClick={onModulesClick} onTasksClick={onTasksClick} onEventsClick={onEventsClick} />
        <ProfileBio user={user} profileData={profileData} />
      </div>
    </div>
  );
}

function StatItem({ value, label, onClick }) {
  return (
    <button className={styles.statButton} onClick={onClick}>
      <span className={styles.statValue}>{value}</span> {label}
    </button>
  );
}

function ModuleItem({ code }) {
  return (
    <div className={styles.listItem}>
      <div className={styles.listAvatar}>📚</div>
      <div className={styles.listInfo}>
        <div className={styles.listName}>{code}</div>
        <div className={styles.listMeta}>Module</div>
      </div>
    </div>
  );
}

function EventItem({ title, startTime, location }) {
  const date = new Date(startTime);
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={styles.listItem}>
      <div className={styles.listAvatar}>📅</div>
      <div className={styles.listInfo}>
        <div className={styles.listName}>{title}</div>
        <div className={styles.listMeta}>{dateStr} at {timeStr} {location ? `• ${location}` : ''}</div>
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

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <ModalInner onClose={onClose} title={title}>{children}</ModalInner>
    </div>
  );
}

function RangeButtons({ range, onRangeChange }) {
  const ranges = [['today', 'Today'], ['week', 'This Week'], ['month', 'This Month']];
  return (
    <div className={styles.rangeSelector}>
      {ranges.map(([key, label]) => (
        <button key={key} className={range === key ? styles.rangeActive : ''} onClick={() => onRangeChange(key)}>{label}</button>
      ))}
    </div>
  );
}

function EventsModal({ isOpen, onClose, events, range, onRangeChange }) {
<<<<<<< HEAD
  const rangeLabels = {
    'today': 'Today',
    'week': 'This Week',
    'month': 'This Month'
  };

  const title = `Events - ${rangeLabels[range]} (${events.length})`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.rangeSelector}>
        <button
          className={range === 'today' ? styles.rangeActive : ''}
          onClick={() => onRangeChange('today')}
        >
          Today
        </button>
        <button
          className={range === 'week' ? styles.rangeActive : ''}
          onClick={() => onRangeChange('week')}
        >
          This Week
        </button>
        <button
          className={range === 'month' ? styles.rangeActive : ''}
          onClick={() => onRangeChange('month')}
        >
          This Month
        </button>
      </div>
      {events.length > 0 ? (
        events.map((event, i) => (
          <EventItem
            key={i}
            title={event.title}
            startTime={event.start_time}
            location={event.location}
          />
        ))
      ) : (
        <p className={styles.emptyMessage}>No events found for this period</p>
      )}
=======
  const rangeLabels = {today: 'Today', week: 'This Week', month: 'This Month' };
      return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Events - ${rangeLabels[range]} (${events.length})`}>
        <RangeButtons range={range} onRangeChange={onRangeChange} />
        {events.length > 0
          ? events.map((e, i) => <EventItem key={i} title={e.title} startTime={e.start_time} location={e.location} />)
          : <p className={styles.emptyMessage}>No events found for this period</p>}
>>>>>>> main
      </Modal>
  );
}

<<<<<<< HEAD
  export default function Profile({ user }) {
    const [showModules, setShowModules] = useState(false);
    const [showTasks, setShowTasks] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [allEvents, setAllEvents] = useState([]);
    const [eventRange, setEventRange] = useState('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadProfileData();
      loadEvents();
    }, []);

    const loadProfileData = async () => {
      try {
        const data = await getUserProfile();
        setProfileData(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadEvents = async () => {
      try {
        const eventsData = await getEvents();
        setAllEvents(eventsData || []);
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };

    const handleEditProfile = () => {
      setShowEditProfile(true);
    };

    const handleSaveProfile = async () => {
      await loadProfileData();
      setShowEditProfile(false);
    };

    const getFilteredEvents = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      return allEvents.filter(event => {
        const eventStart = new Date(event.start_time);

        if (eventRange === 'today') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return eventStart >= today && eventStart < tomorrow;
        } else if (eventRange === 'week') {
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return eventStart >= today && eventStart < weekEnd;
        } else { // month
          const monthEnd = new Date(today);
          monthEnd.setDate(monthEnd.getDate() + 30);
          return eventStart >= today && eventStart < monthEnd;
        }
      }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    };

    if (loading) {
      return <div className={styles.container}>Loading...</div>;
    }

    const modules = profileData?.modules || [];
    const filteredEvents = getFilteredEvents();

    // Count all upcoming events (from today onwards, next 30 days)
    const upcomingEventCount = allEvents.filter(event => {
      const eventStart = new Date(event.start_time);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthEnd = new Date(today);
      monthEnd.setDate(monthEnd.getDate() + 30);
      return eventStart >= today && eventStart < monthEnd;
    }).length;

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <ProfileHeader
            user={profileData || user}
            profileData={profileData}
            onModulesClick={() => setShowModules(true)}
            onTasksClick={() => setShowTasks(true)}
            onEventsClick={() => setShowEvents(true)}
            onEditProfile={handleEditProfile}
            upcomingEventCount={upcomingEventCount}
          />

          <div className={styles.modulesGrid}>
            {modules.slice(0, 6).map((code, i) => (
              <div key={i} className={styles.moduleCard}>
                <div className={styles.moduleIcon}>📚</div>
                <div className={styles.moduleCode}>{code}</div>
              </div>
            ))}
=======
function ModulesGrid({modules}) {
  return (
            <div className={styles.modulesGrid}>
              {modules.slice(0, 6).map((code, i) => (
                <div key={i} className={styles.moduleCard}>
                  <div className={styles.moduleIcon}>📚</div>
                  <div className={styles.moduleCode}>{code}</div>
>>>>>>> main
                </div>
              ))}
            </div>
            );
}

            function ProfileModals({state, user, profileData, modules, filteredEvents}) {
  const {showModules, setShowModules, showTasks, setShowTasks, showEvents, setShowEvents, showEditProfile, setShowEditProfile, eventRange, setEventRange, handleSaveProfile} = state;
            return (
            <>
              <EditProfileModal user={profileData || user} isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} onSave={handleSaveProfile} />
              <Modal isOpen={showModules} onClose={() => setShowModules(false)} title="Modules">
                {modules.length > 0 ? modules.map((code, i) => <ModuleItem key={i} code={code} />) : <p className={styles.emptyMessage}>No modules found</p>}
              </Modal>
              <Modal isOpen={showTasks} onClose={() => setShowTasks(false)} title="Tasks">
                <p className={styles.emptyMessage}>Tasks feature coming soon...</p>
              </Modal>
              <EventsModal isOpen={showEvents} onClose={() => setShowEvents(false)} events={filteredEvents} range={eventRange} onRangeChange={setEventRange} />
            </>
            );
}

            export default function Profile({user}) {
  const state = useProfileState();
            const {showModules: _sm, profileData, allEvents, eventRange, loading, setShowModules, setShowTasks, setShowEvents, setShowEditProfile } = state;
            if (loading) return <div className={styles.container}>Loading...</div>;
            const modules = profileData?.modules || [];
            const filteredEvents = getFilteredEvents(allEvents, eventRange);
            const upcomingEventCount = getUpcomingCount(allEvents);
            return (
            <div className={styles.container}>
              <div className={styles.content}>
                <ProfileHeader user={profileData || user} profileData={profileData} onModulesClick={() => setShowModules(true)} onTasksClick={() => setShowTasks(true)} onEventsClick={() => setShowEvents(true)} onEditProfile={() => setShowEditProfile(true)} upcomingEventCount={upcomingEventCount} />
                <ModulesGrid modules={modules} />
              </div>
              <ProfileModals state={state} user={user} profileData={profileData} modules={modules} filteredEvents={filteredEvents} />
            </div>);}