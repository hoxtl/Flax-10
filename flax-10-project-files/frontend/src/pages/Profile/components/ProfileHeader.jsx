import styles from "../Profile.module.css";
import { buildInitials, buildFullName } from "../utils/profileHelpers";
import ShareButton from "../../../components/Social/ShareButton";
import { getResolvedUserPhoto } from "../../../utils/tutorPhotoFallback";

function ProfileAvatar({ user, profilePhotoUrl }) {
    return <div className={styles.avatar}>{profilePhotoUrl ? <img src={profilePhotoUrl} alt="Profile" className={styles.avatarImage} /> : buildInitials(user)}</div>;
}

function StatItem({ value, label, onClick }) {
    return <button className={styles.statButton} onClick={onClick}><span className={styles.statValue}>{value}</span> {label}</button>;
}

function ProfileStats({ profileData, taskCount, upcoming, handlers, visibility }) {
    const { onModulesClick: om, onTasksClick: ot, onEventsClick: oe, onSharedWithClick: os } = handlers;
    const resolvedTaskCount = taskCount ?? profileData?.task_count ?? 0;
    return (
        <div className={styles.stats}>
            {visibility.canViewModules && <StatItem value={profileData?.module_count || 0} label="modules" onClick={om} />}
            {visibility.canViewTasks && <StatItem value={resolvedTaskCount} label="tasks" onClick={ot} />}
            {visibility.canViewEvents && <StatItem value={upcoming || 0} label="events" onClick={oe} />}
            {visibility.canViewSharedWith && <StatItem value={profileData?.shared_with_count || 0} label="shared" onClick={os} />}
        </div>
    );
}

function ProfileHeaderInfo({ user, profileData, taskCount, upcoming, handlers, visibility }) {
    return (
        <div className={styles.headerInfo}>
            <div className={styles.headerTop}>
                <h1 className={styles.username}>{user?.username || "guest"}</h1>
                {visibility.canEditProfile ? <button className={styles.btnEdit} onClick={handlers.onEditProfile}>Edit profile</button> : <ShareButton userId={user?.id} initialIsSharing={user?.is_sharing} onToggle={n => { user?.setOptimisticShare?.(n); user?.reload?.(); }} />}
            </div>
            <ProfileStats profileData={profileData} taskCount={taskCount} upcoming={upcoming} handlers={handlers} visibility={visibility} />
            <div className={styles.bio}><div className={styles.fullName}>{buildFullName(user)}</div><div className={styles.description}>{profileData?.year || user?.year || ""} · {profileData?.major || user?.major || ""}</div>{profileData?.bio && <div className={styles.reminder}>{profileData.bio}</div>}</div>
        </div>
    );
}

function MobileStats({ profileData, taskCount, upcoming, handlers, visibility }) {
    const resolvedTaskCount = taskCount ?? profileData?.task_count ?? 0;
    return (
        <div className={styles.mobileStatsGrid}>
            {visibility.canViewModules && <div className={`${styles.mobileStatCard} ${styles.glassCard}`} onClick={handlers.onModulesClick}><span className={styles.mobileStatValue}>{profileData?.module_count || 0}</span><span className={styles.mobileStatLabel}>Modules</span></div>}
            {visibility.canViewTasks && <div className={`${styles.mobileStatCard} ${styles.glassCard}`} onClick={handlers.onTasksClick}><span className={styles.mobileStatValue}>{resolvedTaskCount}</span><span className={styles.mobileStatLabel}>Tasks</span></div>}
            {visibility.canViewEvents && <div className={`${styles.mobileStatCard} ${styles.glassCard}`} onClick={handlers.onEventsClick}><span className={styles.mobileStatValue}>{upcoming || 0}</span><span className={styles.mobileStatLabel}>Events</span></div>}
        </div>
    );
}

export default function ProfileHeader({ user, profileData, taskCount, upcomingEventCount: upcoming, handlers, visibility }) {
    const year = profileData?.year || user?.year || "";
    const major = profileData?.major || user?.major || "";
    const resolvedPhoto = getResolvedUserPhoto({
        ...user,
        ...profileData,
    });
    return (
        <>
            <div className={`${styles.header} ${styles.desktopOnly}`}>
                <ProfileAvatar user={user} profilePhotoUrl={resolvedPhoto} />
                <ProfileHeaderInfo user={{ ...user, reload: handlers.reload, setOptimisticShare: handlers.setOptimisticShare }} profileData={profileData} taskCount={taskCount} upcoming={upcoming} handlers={handlers} visibility={visibility} />
            </div>
            <div className={`${styles.mobileHeaderWrap} ${styles.mobileOnly}`}>
                <div className={styles.mobileHero}>
                    <div className={styles.mobileAvatar}>{resolvedPhoto ? <img src={resolvedPhoto} alt="Profile" className={styles.avatarImage} /> : buildInitials(user)}</div>
                    <h1 className={styles.mobileUsername}>{(profileData || user)?.username || "guest"}</h1><p className={styles.mobileBio}>{year} {year && major ? '·' : ''} {major}</p>
                    <div className={styles.mobileActions}>{visibility.canEditProfile ? <button className={styles.mobileBtnEdit} onClick={handlers.onEditProfile}>Edit Profile</button> : <ShareButton userId={user?.id} initialIsSharing={user?.is_sharing} />}</div>
                </div>
                <MobileStats profileData={profileData} taskCount={taskCount} upcoming={upcoming} handlers={handlers} visibility={visibility} />
            </div>
        </>
    );
}
