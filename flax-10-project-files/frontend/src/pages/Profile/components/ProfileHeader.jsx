import { useState } from "react";
import widgetStyles from "./widgets/ProfileWidgets.module.css";
import headerStyles from "./ProfileHeader.module.css";
import badgeStyles from "./ProfileHeaderBadges.module.css";
import { buildInitials, buildFullName } from "../utils/profileHelpers";
import ShareButton from "../../../components/Social/ShareButton";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import { getResolvedUserPhoto } from "../../../utils/tutorPhotoFallback";
const styles = { ...widgetStyles, ...headerStyles, ...badgeStyles };

function buildHeaderDescription(isTeacher, major, year) {
  return isTeacher ? `Department: ${major}` : `${year}${year && major ? " · " : ""}${major}`;
}

function BadgeButton({ badge, canPin, onPinBadge, activeTooltip, onEnter, onLeave, pinned }) {
  return (
    <button
      type="button"
      className={`${styles.headerBadge} ${pinned ? styles.headerBadgePinned : ""}`}
      onMouseEnter={() => onEnter(badge.id)}
      onMouseLeave={onLeave}
      onClick={() => canPin && onPinBadge?.(badge.id)}
      title={canPin ? "Tap to pin this badge" : badge.label}
    >
      <span className={styles.headerBadgeEmoji}>{badge.emoji}</span>
      {activeTooltip === badge.id && (
        <div className={styles.badgeTooltip}>
          <span className={styles.badgeTooltipLabel}>{badge.label}</span>
          <span className={styles.badgeTooltipDesc}>{badge.description}</span>
        </div>
      )}
    </button>
  );
}

function ProfileBadges({ badges, onViewAll, canPin, pinnedBadgeId, onPinBadge }) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const allBadges = badges || [];
  const pinnedBadge = allBadges.find(b => String(b.id) === String(pinnedBadgeId));
  const topBadges = pinnedBadge
    ? allBadges.filter(b => String(b.id) !== String(pinnedBadgeId)).slice(0, 3)
    : allBadges.slice(0, 4);
  if (!allBadges.length) return null;
  const props = { canPin, onPinBadge, activeTooltip, onEnter: setActiveTooltip, onLeave: () => setActiveTooltip(null) };
  return (
    <div className={styles.headerBadges}>
      {pinnedBadge && <div className={styles.pinnedBadgeWrap}><BadgeButton badge={pinnedBadge} pinned {...props} /></div>}
      <div className={styles.headerBadgesMain}>{topBadges.map(b => <BadgeButton key={b.id} badge={b} {...props} />)}</div>
      {onViewAll && <button className={styles.badgesViewAllLink} onClick={onViewAll}>View All &rarr;</button>}
    </div>
  );
}

function ProfileAvatar({ user, profilePhotoUrl }) {
  return <div className={styles.avatar}>{profilePhotoUrl ? <img src={profilePhotoUrl} alt="Profile" className={styles.avatarImage} /> : buildInitials(user)}</div>;
}

function StatItem({ value, label, onClick }) {
  return <button className={styles.statButton} onClick={onClick}><span className={styles.statValue}>{value}</span> {label}</button>;
}

function ProfileStats({ profileData, handlers, visibility, societyCount, onSocietiesClick }) {
  const { onModulesClick: om, onSharedWithClick: os } = handlers;
  return (
    <div className={styles.stats}>
      {visibility.canViewModules && visibility.canEditProfile && <StatItem value={profileData?.module_count || 0} label="modules" onClick={om} />}
      {visibility.canEditProfile && societyCount > 0 && <StatItem value={societyCount} label="societies" onClick={onSocietiesClick} />}
      {visibility.canViewSharedWith && <StatItem value={profileData?.shared_with_count || 0} label="shared" onClick={os} />}
    </div>
  );
}

function HeaderSocieties({ societies, onNavigate }) {
  if (!societies?.length) return null;
  return (
    <div className={styles.headerSocietiesRow}>
      {societies.map(soc => {
        const societyId = soc.society_id ?? soc.id;
        const imageUrl = soc.cover_image || soc.image;
        return (
          <button key={societyId || soc.name} className={styles.headerSocietyItem} onClick={() => societyId && onNavigate?.(`/societies?id=${societyId}`)}>
            <div className={styles.headerSocLogoWrap}>
              {imageUrl ? <img src={imageUrl} alt={soc.name} className={styles.headerSocLogo} /> : <div className={styles.headerSocInitial}>{soc.name[0]}</div>}
            </div>
            <span className={styles.headerSocName}>{soc.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function PersonaInlineChip({ persona, peakHour }) {
  if (!persona) return null;
  const peakLabel = peakHour != null ? `Based on your ${peakHour % 12 || 12}${peakHour >= 12 ? "pm" : "am"} peak` : null;
  return (
    <div className={styles.headerPersonaCard}>
      <div className={styles.headerPersonaLeft}>
        <span className={styles.headerPersonaEmoji} role="img" aria-label={persona.label}>{persona.emoji}</span>
        <span className={styles.headerPersonaName}>{persona.label}</span>
        {peakLabel && <span className={styles.headerPersonaPeak}>{peakLabel}</span>}
      </div>
      <p className={styles.headerPersonaDesc}>{persona.description}</p>
    </div>
  );
}

function ProfileBioSection({ isTeacher, email, bio }) {
  if (!((isTeacher && email) || bio)) return null;
  return (
    <div className={styles.bio}>
      {isTeacher && email && <div className={styles.teacherEmail}><a href={`mailto:${email}`}>{email}</a></div>}
      {bio && <div className={styles.reminder}>{bio}</div>}
    </div>
  );
}

function HeaderTopRow({ user, roleLabel, handlers, visibility }) {
  return (
    <div className={styles.headerTop}>
      <h1 className={styles.username}>{user?.username || "guest"}</h1>
      <span className={styles.rolePill}>{roleLabel}</span>
      {visibility.canEditProfile
        ? <PrimaryButton className={styles.btnEdit} size="small" pill onClick={handlers.onEditProfile}>Edit profile</PrimaryButton>
        : <ShareButton userId={user?.id} initialIsSharing={user?.is_sharing} onToggle={n => { user?.setOptimisticShare?.(n); user?.reload?.(); }} />}
    </div>
  );
}

function ProfileHeaderInfo({ user, profileData, handlers, visibility, badges, pinnedBadgeId, onPinBadge, onViewAllBadges, persona, peakHour, societies, onSocietiesClick }) {
  const role = profileData?.role || user?.role || "student";
  const fullName = buildFullName(user);
  const isTeacher = role === "teacher" || fullName.startsWith("Dr.");
  const isStudent = !isTeacher && role === "student";
  const year = isStudent ? (profileData?.year || user?.year || "") : "";
  const major = profileData?.major || user?.major || (isTeacher ? "Teaching staff" : "");
  const description = buildHeaderDescription(isTeacher, major, year);
  const roleLabel = isTeacher ? "Professor" : role === "pending_teacher" ? "Teacher applicant" : "Student";
  return (
    <div className={styles.headerInfo}>
      <HeaderTopRow user={user} roleLabel={roleLabel} handlers={handlers} visibility={visibility} />
      {description && <div className={styles.headerSubline}>{description}</div>}
      <ProfileStats profileData={profileData} handlers={handlers} visibility={visibility} societyCount={societies?.length || 0} onSocietiesClick={onSocietiesClick} />
      {(badges?.length > 0 || persona) && <div className={styles.headerBadgesPersonaRow}>{badges?.length > 0 && <ProfileBadges badges={badges} pinnedBadgeId={pinnedBadgeId} onPinBadge={onPinBadge} canPin={visibility.canEditProfile} onViewAll={onViewAllBadges} />}{persona && <PersonaInlineChip persona={persona} peakHour={peakHour} />}</div>}
      <ProfileBioSection isTeacher={isTeacher} email={profileData?.email} bio={profileData?.bio} />
    </div>
  );
}

function MobileStats({ profileData, handlers, visibility }) {
  return (
    <div className={styles.mobileStatsGrid}>
      {visibility.canViewModules && visibility.canEditProfile && <div className={`${styles.mobileStatCard} ${styles.glassCard}`} onClick={handlers.onModulesClick}><span className={styles.mobileStatValue}>{profileData?.module_count || 0}</span><span className={styles.mobileStatLabel}>Modules</span></div>}
    </div>
  );
}

function buildHeaderVars(user, profileData) {
  const role = profileData?.role || user?.role || "student";
  const fullName = buildFullName(profileData || user);
  const isTeacher = role === "teacher" || fullName.startsWith("Dr.");
  const isStudent = !isTeacher && role === "student";
  const year = isStudent ? (profileData?.year || user?.year || "") : "";
  const major = profileData?.major || user?.major || (isTeacher ? "Teaching staff" : "");
  return { role, isTeacher, description: buildHeaderDescription(isTeacher, major, year), roleLabel: isTeacher ? "Professor" : role === "pending_teacher" ? "Teacher applicant" : "Student" };
}

function MobileHeroSection({ user, profileData, resolvedPhoto, description, roleLabel, isTeacher, visibility, handlers }) {
  return (
    <div className={styles.mobileHero}>
      <div className={styles.mobileAvatar}>{resolvedPhoto ? <img src={resolvedPhoto} alt="Profile" className={styles.avatarImage} /> : buildInitials(user)}</div>
      <h1 className={styles.mobileUsername}>{(profileData || user)?.username || "guest"}</h1>
      <p className={styles.mobileBio}>{description}</p>
      <span className={styles.mobileRolePill}>{roleLabel}</span>
      {isTeacher && profileData?.email && <div className={styles.teacherEmail}><a href={`mailto:${profileData.email}`}>{profileData.email}</a></div>}
      <div className={styles.mobileActions}>{visibility.canEditProfile ? <PrimaryButton className={styles.mobileBtnEdit} size="small" pill onClick={handlers.onEditProfile}>Edit Profile</PrimaryButton> : <ShareButton userId={user?.id} initialIsSharing={user?.is_sharing} />}</div>
    </div>
  );
}

export default function ProfileHeader({ user, profileData, handlers, visibility, badges, pinnedBadgeId, onPinBadge, onViewAllBadges, persona, peakHour, societies, onNavigate, onSocietiesClick }) {
  const { description, roleLabel, isTeacher } = buildHeaderVars(user, profileData);
  const resolvedUser = { ...user, ...profileData };
  const resolvedPhoto = getResolvedUserPhoto({ ...resolvedUser }, { allowGeneric: true, seed: resolvedUser?.username || resolvedUser?.id || resolvedUser?.name });
  return (
    <>
      <div className={`${styles.header} ${styles.desktopOnly}`}>
        <ProfileAvatar user={user} profilePhotoUrl={resolvedPhoto} />
        <ProfileHeaderInfo user={{ ...user, reload: handlers.reload, setOptimisticShare: handlers.setOptimisticShare }} profileData={profileData} handlers={handlers} visibility={visibility} badges={badges} pinnedBadgeId={pinnedBadgeId} onPinBadge={onPinBadge} onViewAllBadges={onViewAllBadges} persona={persona} peakHour={peakHour} societies={societies} onNavigate={onNavigate} onSocietiesClick={onSocietiesClick} />
      </div>
      <div className={`${styles.mobileHeaderWrap} ${styles.mobileOnly}`}>
        <MobileHeroSection user={user} profileData={profileData} resolvedPhoto={resolvedPhoto} description={description} roleLabel={roleLabel} isTeacher={isTeacher} visibility={visibility} handlers={handlers} />
        <MobileStats profileData={profileData} handlers={handlers} visibility={visibility} />
      </div>
    </>
  );
}
