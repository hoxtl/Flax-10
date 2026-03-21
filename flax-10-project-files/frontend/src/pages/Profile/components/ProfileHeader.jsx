/**
 * Profile page header.
 */
import { useState } from "react";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import ShareButton from "../../../components/Social/ShareButton";
import { getResolvedUserPhoto } from "../../../utils/tutorPhotoFallback";
import { buildFullName, buildInitials } from "../utils/profileHelpers";
import badgeStyles from "./ProfileHeaderBadges.module.css";
import headerStyles from "./ProfileHeader.module.css";

const styles = { ...headerStyles, ...badgeStyles };

function buildHeaderDescription(isTeacher, major, year) {
  return isTeacher ? `Department: ${major}` : `${year}${year && major ? " · " : ""}${major}`;
}

function buildHeaderVars(user, profileData) {
  const role = profileData?.role || user?.role || "student";
  const fullName = buildFullName(profileData || user);
  const isTeacher = role === "teacher" || fullName.startsWith("Dr.");
  const year = !isTeacher && role === "student" ? profileData?.year || user?.year || "" : "";
  const major = profileData?.major || user?.major || (isTeacher ? "Teaching staff" : "");
  return { isTeacher, roleLabel: isTeacher ? "Professor" : role === "pending_teacher" ? "Teacher applicant" : "Student", description: buildHeaderDescription(isTeacher, major, year) };
}

function buildShareUser(user, handlers) {
  return { ...user, reload: handlers.reload, setOptimisticShare: handlers.setOptimisticShare };
}

function resolvePhoto(user, profileData) {
  const resolvedUser = { ...user, ...profileData };
  return getResolvedUserPhoto(resolvedUser, { allowGeneric: true, seed: resolvedUser?.username || resolvedUser?.id || resolvedUser?.name });
}

function HeaderAction({ visibility, handlers, user, mobile = false }) {
  if (!visibility.canEditProfile) return <ShareButton userId={user?.id} initialIsSharing={user?.is_sharing} onToggle={(nextValue) => { user?.setOptimisticShare?.(nextValue); user?.reload?.(); }} />;
  return <PrimaryButton className={mobile ? styles.mobileBtnEdit : styles.btnEdit} size="small" pill onClick={handlers.onEditProfile}>{mobile ? "Edit Profile" : "Edit profile"}</PrimaryButton>;
}

function BadgeTooltip({ badge }) {
  return (
    <div className={styles.badgeTooltip}>
      <span className={styles.badgeTooltipLabel}>{badge.label}</span>
      <span className={styles.badgeTooltipDesc}>{badge.description}</span>
    </div>
  );
}

function HeaderBadge({ badge, pinned, canPin, activeTooltip, onEnter, onLeave, onPinBadge }) {
  return (
    <button type="button" className={`${styles.headerBadge} ${pinned ? styles.headerBadgePinned : ""}`} onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={() => canPin && onPinBadge?.(badge.id)} title={canPin ? "Tap to pin this badge" : badge.label}>
      <span className={styles.headerBadgeEmoji}>{badge.emoji}</span>
      {activeTooltip === badge.id && <BadgeTooltip badge={badge} />}
    </button>
  );
}

function ProfileBadges({ badges, pinnedBadgeId, onPinBadge, canPin, onViewAll }) {
  const pinnedBadge = badges.find((badge) => badge.id === pinnedBadgeId);
  const topBadges = badges.filter((badge) => badge.id !== pinnedBadgeId).slice(0, 3);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const renderBadge = (badge, pinned = false) => <HeaderBadge key={badge.id} badge={badge} pinned={pinned} canPin={canPin} onPinBadge={onPinBadge} activeTooltip={activeTooltip} onEnter={() => setActiveTooltip(badge.id)} onLeave={() => setActiveTooltip(null)} />;
  return (
    <div className={styles.headerBadges}>
      {pinnedBadge && <div className={styles.pinnedBadgeWrap}>{renderBadge(pinnedBadge, true)}</div>}
      <div className={styles.headerBadgesMain}>{topBadges.map((badge) => renderBadge(badge))}</div>
      {onViewAll && <button className={styles.badgesViewAllLink} onClick={onViewAll}>View All &rarr;</button>}
    </div>
  );
}

function ProfileAvatar({ user, profilePhotoUrl, mobile = false }) {
  const className = mobile ? styles.mobileAvatar : styles.avatar;
  return <div className={className}>{profilePhotoUrl ? <img src={profilePhotoUrl} alt="Profile" className={styles.avatarImage} /> : buildInitials(user)}</div>;
}

function StatItem({ value, label, onClick }) {
  return <button className={styles.statButton} onClick={onClick}><span className={styles.statValue}>{value}</span> {label}</button>;
}

function ProfileStats({ profileData, handlers, visibility, societyCount, onSocietiesClick }) {
  return (
    <div className={styles.stats}>
      {visibility.canViewModules && visibility.canEditProfile && <StatItem value={profileData?.module_count || 0} label="modules" onClick={handlers.onModulesClick} />}
      {visibility.canEditProfile && societyCount > 0 && <StatItem value={societyCount} label="societies" onClick={onSocietiesClick} />}
      {visibility.canViewSharedWith && <StatItem value={profileData?.shared_with_count || 0} label="shared" onClick={handlers.onSharedWithClick} />}
    </div>
  );
}

function HeaderSocieties({ societies, onNavigate }) {
  if (!societies?.length) return null;
  return <div className={styles.headerSocietiesRow}>{societies.map((society) => <SocietyItem key={society.society_id ?? society.id ?? society.name} society={society} onNavigate={onNavigate} />)}</div>;
}

function SocietyItem({ society, onNavigate }) {
  const societyId = society.society_id ?? society.id;
  const imageUrl = society.cover_image || society.image;
  return (
    <button className={styles.headerSocietyItem} onClick={() => societyId && onNavigate?.(`/societies?id=${societyId}`)}>
      <div className={styles.headerSocLogoWrap}>{imageUrl ? <img src={imageUrl} alt={society.name} className={styles.headerSocLogo} /> : <div className={styles.headerSocInitial}>{society.name[0]}</div>}</div>
      <span className={styles.headerSocName}>{society.name}</span>
    </button>
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
  return <div className={styles.bio}>{isTeacher && email && <div className={styles.teacherEmail}><a href={`mailto:${email}`}>{email}</a></div>}{bio && <div className={styles.reminder}>{bio}</div>}</div>;
}

function HeaderTitleRow({ user, roleLabel, handlers, visibility }) {
  return (
    <div className={styles.headerTop}>
      <h1 className={styles.username}>{user?.username || "guest"}</h1>
      <span className={styles.rolePill}>{roleLabel}</span>
      <HeaderAction visibility={visibility} handlers={handlers} user={user} />
    </div>
  );
}

function HeaderMeta({ user, profileData, handlers, visibility, societies, onSocietiesClick }) {
  const { description, isTeacher, roleLabel } = buildHeaderVars(user, profileData);
  return (
    <>
      <HeaderTitleRow user={user} roleLabel={roleLabel} handlers={handlers} visibility={visibility} />
      {description && <div className={styles.headerSubline}>{description}</div>}
      <ProfileStats profileData={profileData} handlers={handlers} visibility={visibility} societyCount={societies?.length || 0} onSocietiesClick={onSocietiesClick} />
      <ProfileBioSection isTeacher={isTeacher} email={profileData?.email} bio={profileData?.bio} />
    </>
  );
}

function HeaderInsights({ badges, pinnedBadgeId, onPinBadge, onViewAllBadges, persona, peakHour, visibility }) {
  if (!badges?.length && !persona) return null;
  return <div className={styles.headerBadgesPersonaRow}>{badges?.length > 0 && <ProfileBadges badges={badges} pinnedBadgeId={pinnedBadgeId} onPinBadge={onPinBadge} canPin={visibility.canEditProfile} onViewAll={onViewAllBadges} />}{persona && <PersonaInlineChip persona={persona} peakHour={peakHour} />}</div>;
}

function DesktopHeader(props) {
  const { user, profileData, handlers, visibility, badges, pinnedBadgeId, onPinBadge, onViewAllBadges, persona, peakHour, societies, onNavigate, onSocietiesClick, resolvedPhoto } = props;
  return (
    <div className={`${styles.header} ${styles.desktopOnly}`}>
      <ProfileAvatar user={user} profilePhotoUrl={resolvedPhoto} />
      <div className={styles.headerInfo}>
        <HeaderMeta user={user} profileData={profileData} handlers={handlers} visibility={visibility} societies={societies} onSocietiesClick={onSocietiesClick} />
        <HeaderInsights badges={badges} pinnedBadgeId={pinnedBadgeId} onPinBadge={onPinBadge} onViewAllBadges={onViewAllBadges} persona={persona} peakHour={peakHour} visibility={visibility} />
        <HeaderSocieties societies={societies} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function MobileStats({ profileData, handlers, visibility }) {
  if (!(visibility.canViewModules && visibility.canEditProfile)) return null;
  return <div className={styles.mobileStatsGrid}><div className={styles.mobileStatCard} onClick={handlers.onModulesClick}><span className={styles.mobileStatValue}>{profileData?.module_count || 0}</span><span className={styles.mobileStatLabel}>Modules</span></div></div>;
}

function MobileHeader({ user, profileData, handlers, visibility, resolvedPhoto }) {
  const { description, isTeacher, roleLabel } = buildHeaderVars(user, profileData);
  return (
    <div className={`${styles.mobileHeaderWrap} ${styles.mobileOnly}`}>
      <div className={styles.mobileHero}>
        <ProfileAvatar user={user} profilePhotoUrl={resolvedPhoto} mobile />
        <h1 className={styles.mobileUsername}>{(profileData || user)?.username || "guest"}</h1>
        <p className={styles.mobileBio}>{description}</p>
        <span className={styles.mobileRolePill}>{roleLabel}</span>
        {isTeacher && profileData?.email && <div className={styles.teacherEmail}><a href={`mailto:${profileData.email}`}>{profileData.email}</a></div>}
        <div className={styles.mobileActions}><HeaderAction visibility={visibility} handlers={handlers} user={user} mobile /></div>
      </div>
      <MobileStats profileData={profileData} handlers={handlers} visibility={visibility} />
    </div>
  );
}

export default function ProfileHeader(props) {
  const shareUser = buildShareUser(props.user, props.handlers);
  const resolvedPhoto = resolvePhoto(props.user, props.profileData);
  return (
    <>
      <DesktopHeader {...props} user={shareUser} resolvedPhoto={resolvedPhoto} />
      <MobileHeader user={shareUser} profileData={props.profileData} handlers={props.handlers} visibility={props.visibility} resolvedPhoto={resolvedPhoto} />
    </>
  );
}
