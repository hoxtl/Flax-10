import styles from "./Profile.module.css";
import { buildInitials, buildFullName } from "./utils/profileHelpers";
import { useProfileState, useProfileBodyData, useProfileContent } from "./hooks/useProfile";
import ProfileModals from "./ProfileModals";
import { useUser } from "../../context/UserContext";

function ProfileAvatar({ user, profilePhotoUrl }) {
  return (
    <div className={styles.avatar}>
      {profilePhotoUrl
        ? <img src={profilePhotoUrl} alt="Profile" className={styles.avatarImage} />
        : buildInitials(user)}
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

function ProfileStats({ profileData, upcomingEventCount, handlers, isMutualOrSelf }) {
  const { onModulesClick, onTasksClick, onEventsClick, onFollowersClick, onFollowingClick } = handlers;
  return (
    <div className={styles.stats}>
      <StatItem value={profileData?.module_count || 0} label="modules" onClick={onModulesClick} />
      {isMutualOrSelf && (
        <>
          <StatItem value={profileData?.task_count || 0} label="tasks" onClick={onTasksClick} />
          <StatItem value={upcomingEventCount || 0} label="events" onClick={onEventsClick} />
        </>
      )}
      <StatItem value={profileData?.follower_count || 0} label="followers" onClick={onFollowersClick} />
      <StatItem value={profileData?.following_count || 0} label="following" onClick={onFollowingClick} />
    </div>
  );
}

function ProfileBio({ user, profileData }) {
  const year = profileData?.year || user?.year || "";
  const major = profileData?.major || user?.major || "";
  return (
    <div className={styles.bio}>
      <div className={styles.fullName}>{buildFullName(user)}</div>
      <div className={styles.description}>{year} · {major}</div>
      {profileData?.bio && <div className={styles.reminder}>{profileData.bio}</div>}
    </div>
  );
}

function ProfileHeaderTop({ user, onEditProfile }) {
  return (
    <div className={styles.headerTop}>
      <h1 className={styles.username}>{user?.username || "guest"}</h1>
      <button className={styles.btnEdit} onClick={onEditProfile}>Edit profile</button>
    </div>
  );
}

function ProfileHeaderInfo({ user, profileData, upcomingEventCount, handlers, isMutualOrSelf }) {
  const currentUser = useUser();
  const isSelf = profileData?.username === currentUser?.username || user?.username === currentUser?.username;

  return (
    <div className={styles.headerInfo}>
      <ProfileHeaderTop user={user} onEditProfile={isSelf ? handlers.onEditProfile : undefined} />
      <ProfileStats
        profileData={profileData}
        upcomingEventCount={upcomingEventCount}
        handlers={handlers}
        isMutualOrSelf={isMutualOrSelf}
      />
      <ProfileBio user={user} profileData={profileData} />
    </div>
  );
}

function ProfileHeader({ user, profileData, upcomingEventCount, handlers, isMutualOrSelf }) {
  return (
    <div className={styles.header}>
      <ProfileAvatar user={user} profilePhotoUrl={profileData?.profile_photo_url} />
      <ProfileHeaderInfo
        user={user}
        profileData={profileData}
        upcomingEventCount={upcomingEventCount}
        handlers={handlers}
        isMutualOrSelf={isMutualOrSelf}
      />
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

function ProfileContent({ user, state, isMutualOrSelf }) {
  const { profileData, handlers } = useProfileContent(state);
  const { modules, upcomingEventCount } = useProfileBodyData(state);
  return (
    <div className={styles.content}>
      <ProfileHeader
        user={profileData || user}
        profileData={profileData}
        upcomingEventCount={upcomingEventCount}
        handlers={handlers}
        isMutualOrSelf={isMutualOrSelf}
      />
      <ModulesGrid modules={modules} />

      {!isMutualOrSelf && (
        <div className={styles.privateMessage}>
          🔒 Follow back to see their calendar and study stats
        </div>
      )}
    </div>
  );
}

function ProfileBody({ user, state }) {
  const { filteredEvents, modules } = useProfileBodyData(state);
  const currentUser = useUser();
  const profileData = state.profileData;
  const isSelf = profileData?.username === currentUser?.username;
  const isMutualOrSelf = isSelf || profileData?.is_mutual_following;

  return (
    <div className={styles.container}>
      <ProfileContent user={user} state={state} isMutualOrSelf={isMutualOrSelf} />
      <ProfileModals
        user={user}
        state={state}
        modules={modules}
        filteredEvents={filteredEvents}
        isMutualOrSelf={isMutualOrSelf}
      />
    </div>
  );
}

export default function Profile({ user }) {
  const state = useProfileState();
  if (state.loading) return <div className={styles.container}>Loading...</div>;
  return <ProfileBody user={user} state={state} />;
}