import styles from "./Profile.module.css";
import { buildInitials, buildFullName } from "./utils/profileHelpers";
import { useProfileState, useProfileBodyData, useProfileContent } from "./hooks/useProfile";
import ProfileModals from "./ProfileModals";
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

import FollowButton from "../../components/Social/FollowButton";

function ProfileHeaderTop({ user, onEditProfile, isSelf }) {
  return (
    <div className={styles.headerTop}>
      <h1 className={styles.username}>{user?.username || "guest"}</h1>
      {isSelf ? (
        <button className={styles.btnEdit} onClick={onEditProfile}>Edit profile</button>
      ) : (
        <div className={styles.followAction}>
          <FollowButton
            userId={user?.id}
            initialIsFollowing={user?.is_following}
            onToggle={(newState) => {
              user?.setOptimisticFollow?.(newState);
              user?.reload?.();
            }}
          />
        </div>
      )}
    </div>
  );
}

function ProfileHeaderInfo({ user, profileData, upcomingEventCount, handlers, isMutualOrSelf, isSelf }) {
  return (
    <div className={styles.headerInfo}>
      <ProfileHeaderTop user={user} onEditProfile={isSelf ? handlers.onEditProfile : undefined} isSelf={isSelf} />
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

function ProfileHeader({ user, profileData, upcomingEventCount, handlers, isMutualOrSelf, isSelf }) {
  return (
    <div className={styles.header}>
      <ProfileAvatar user={user} profilePhotoUrl={profileData?.profile_photo_url} />
      <ProfileHeaderInfo
        user={{ ...user, reload: handlers.reload, setOptimisticFollow: handlers.setOptimisticFollow }}
        profileData={profileData}
        upcomingEventCount={upcomingEventCount}
        handlers={handlers}
        isMutualOrSelf={isMutualOrSelf}
        isSelf={isSelf}
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

function ProfileContent({ user, state, isMutualOrSelf, isSelf }) {
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
        isSelf={isSelf}
      />
      <ModulesGrid modules={modules} />

      {!isMutualOrSelf && (
        <div className={styles.privateMessage}>
          🔒 Become mutuals to see each other's calendar and plan meetings smoothly
        </div>
      )}
    </div>
  );
}

function ProfileBody({ user, state }) {
  const { filteredEvents, modules } = useProfileBodyData(state);
  const currentUser = user;
  const profileData = state.profileData;
  const isSelf = profileData?.username === currentUser?.username || !profileData;
  const isMutualOrSelf = isSelf || profileData?.is_mutual_following;

  return (
    <div className={styles.container}>
      <ProfileContent user={currentUser} state={state} isMutualOrSelf={isMutualOrSelf} isSelf={isSelf} />
      <ProfileModals
        user={user}
        state={state}
        modules={modules}
        filteredEvents={filteredEvents}
        isMutualOrSelf={isMutualOrSelf}
        onNavChange={state.onNavChange}
      />
    </div>
  );
}

export default function Profile({ user, viewedUserId, onBack, onNavChange }) {
  const state = useProfileState(viewedUserId);
  state.onNavChange = onNavChange;

  if (state.loading) return <div className={styles.container}>Loading...</div>;
  if (!state.profileData) return <div className={styles.container}>User not found.</div>;
  return <ProfileBody user={user} state={state} />;
}