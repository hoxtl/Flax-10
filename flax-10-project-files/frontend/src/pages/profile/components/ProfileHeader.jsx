/*
 * Profile header component – avatar, stats, badges, persona, and calendar sharing.
 */

import { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import widgetStyles from "./widgets/ProfileWidgets.module.css";
import headerStyles from "./ProfileHeader.module.css";
import badgeStyles from "./ProfileHeaderBadges.module.css";
import { buildPeakLabel } from "./widgets/PersonaCard";
import { buildInitials, buildFullName } from "../utils/profileHelpers";
import ShareButton from "../../../components/Social/ShareButton";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import { getResolvedUserPhoto } from "../../../utils/tutorPhotoFallback";
const styles = { ...widgetStyles, ...headerStyles, ...badgeStyles };

function buildHeaderDescription(isTeacher, major, year) {
  return isTeacher ? `Department: ${major}` : `${year}${year && major ? " · " : ""}${major}`;
}

function buildHeaderVars(user, profileData) {
  const role = profileData?.role || user?.role || "student";
  const fullName = buildFullName(profileData || user);
  const isTeacher = role === "teacher" || fullName.startsWith("Dr.");
  const year = !isTeacher && role === "student" ? profileData?.year || user?.year || "" : "";
  const major = profileData?.major || user?.major || (isTeacher ? "Teaching staff" : "");
  return { isTeacher, roleLabel: isTeacher ? "Professor" : "Student", description: buildHeaderDescription(isTeacher, major, year) };
}

function buildShareUser(user, handlers) {
  return { ...user, reload: handlers.reload, setOptimisticShare: handlers.setOptimisticShare };
}

function buildSharedCalendarRoute(user, profileData) {
  const targetUser = profileData || user;
  if (!targetUser?.id) return "/calendar";
  const displayName = buildFullName(targetUser);
  const params = new URLSearchParams({
    user_id: String(targetUser.id),
    shared_name: displayName || targetUser.username || "Shared user",
  });
  return `/calendar?${params.toString()}`;
}

function resolvePhoto(user, profileData) {
  const resolvedUser = { ...user, ...profileData };
  return getResolvedUserPhoto(resolvedUser, { allowGeneric: false });
}

function HeaderAction({ visibility, handlers, user, mobile = false }) {
  if (!visibility.canEditProfile) return <ShareButton userId={user?.id} initialIsSharing={user?.is_sharing} onToggle={(nextValue) => { user?.setOptimisticShare?.(nextValue); user?.reload?.(); }} />;
  return <PrimaryButton className={mobile ? styles.mobileBtnEdit : styles.btnEdit} size="small" pill onClick={handlers.onEditProfile}>{mobile ? "Edit Profile" : "Edit profile"}</PrimaryButton>;
}

function SharedCalendarPill({ profileData, visibility, onNavigate }) {
  if (visibility.canEditProfile || !profileData?.is_shared_with_me || !onNavigate) return null;
  return (
    <span className={styles.sharedCalendarIndicator}>
      Shared calendar with me
    </span>
  );
}

function BadgeTooltip({ badge, canPin, pinned }) {
  return (
    <Motion.div className={styles.badgeTooltip} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }}>
      <span className={styles.badgeTooltipLabel}>{badge.label}</span>
      <span className={styles.badgeTooltipDesc}>{badge.description}</span>
      {canPin && <span className={styles.badgeTooltipPin}>{pinned ? "Tap to unpin" : "Tap to pin this badge"}</span>}
    </Motion.div>
  );
}

function BadgeButton({ badge, canPin, onPinBadge, activeTooltip, onEnter, onLeave, pinned }) {
  const className = `${styles.headerBadge} ${pinned ? styles.headerBadgePinned : ""}`;
  const animate = pinned ? { scale: [1, 1.4, 0.9, 1.05, 1] } : { scale: 1 };
  const transition = pinned ? { duration: 0.45, ease: "easeOut" } : { duration: 0.25, ease: "easeInOut" };
  return (
    <Motion.button type="button" className={className} onMouseEnter={() => onEnter(badge.id)} onMouseLeave={onLeave} onClick={() => canPin && onPinBadge?.(badge.id)} layout animate={animate} transition={transition} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}>
      <span className={styles.headerBadgeEmoji}>{badge.emoji}</span>
      <AnimatePresence>
        {activeTooltip === badge.id && <BadgeTooltip badge={badge} canPin={canPin} pinned={pinned} />}
      </AnimatePresence>
    </Motion.button>
  );
}

function FeaturedBadgeContent({ badge, canPin }) {
  return (
    <div className={styles.featuredBadgeMain}>
      <div className={styles.featuredBadgeEmojiWrap}><span className={styles.featuredBadgeEmoji}>{badge.emoji}</span></div>
      <div className={styles.featuredBadgeText}>
        <p className={styles.featuredBadgeTitle}>{badge.label}</p>
        {badge.description && <p className={styles.featuredBadgeDesc}>{badge.description}</p>}
        {canPin && <p className={styles.featuredBadgeUnpin}>Tap to unpin</p>}
      </div>
    </div>
  );
}

function FeaturedBadgeCard({ badge, canPin, onPinBadge }) {
  if (!badge) return null;
  return (
    <Motion.button type="button" className={styles.featuredBadgeCard} onClick={() => canPin && onPinBadge?.(badge.id)} initial={{ opacity: 0, scale: 0.9, x: -8 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -8 }} transition={{ duration: 0.28, ease: "easeOut" }} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }} layout>
      <FeaturedBadgeContent badge={badge} canPin={canPin} />
    </Motion.button>
  );
}

function resolveBadgeLists(allBadges, pinnedBadgeId) {
  const pinnedBadge = allBadges.find((b) => String(b.id) === String(pinnedBadgeId));
  const topBadges = pinnedBadge
    ? allBadges.filter((b) => String(b.id) !== String(pinnedBadgeId)).slice(0, 3)
    : allBadges.slice(0, 4);
  return { featuredBadge: pinnedBadge || null, topBadges };
}

function BadgeRail({ topBadges, onViewAll, canPin, onPinBadge, activeTooltip, onEnter, onLeave }) {
  const tooltipProps = { canPin, onPinBadge, activeTooltip, onEnter, onLeave };
  return (
    <div className={styles.headerBadgeRail}>
      <div className={styles.headerBadges}>
        <div className={styles.headerBadgesMain}>
          {topBadges.map((badge) => <BadgeButton key={badge.id} badge={badge} pinned={false} {...tooltipProps} />)}
        </div>
        {onViewAll && <button className={styles.badgesViewAllLink} onClick={onViewAll}>View All &rarr;</button>}
      </div>
    </div>
  );
}

function ProfileBadges({ badges, pinnedBadgeId, onPinBadge, canPin, onViewAll }) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const allBadges = badges || [];
  if (!allBadges.length) return null;
  const { featuredBadge, topBadges } = resolveBadgeLists(allBadges, pinnedBadgeId);
  const tooltipProps = { canPin, onPinBadge, activeTooltip, onEnter: setActiveTooltip, onLeave: () => setActiveTooltip(null) };
  return (
    <div className={styles.headerAchievementsRow}>
      <AnimatePresence mode="popLayout">
        {featuredBadge && <FeaturedBadgeCard key={featuredBadge.id} badge={featuredBadge} canPin={canPin} onPinBadge={onPinBadge} />}
      </AnimatePresence>
      <BadgeRail topBadges={topBadges} onViewAll={onViewAll} {...tooltipProps} />
    </div>
  );
}

function ProfileAvatar({ user, profilePhotoUrl }) {
  return (
    <div className={styles.avatar}>
      {profilePhotoUrl ? (
        <img
          src={profilePhotoUrl}
          alt="Profile"
          className={styles.avatarImage}
        />
      ) : (
        buildInitials(user)
      )}
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

function ProfileStats({
  profileData,
  handlers,
  visibility,
  societyCount,
  onSocietiesClick,
}) {
  return (
    <div className={styles.stats}>
      {visibility.canViewModules && visibility.canEditProfile && <StatItem value={profileData?.module_count || 0} label="modules" onClick={handlers.onModulesClick} />}
      {visibility.canEditProfile && societyCount > 0 && <StatItem value={societyCount} label="societies" onClick={onSocietiesClick} />}
      {visibility.canViewSharedWith && <StatItem value={profileData?.shared_with_count || 0} label="shared" onClick={handlers.onSharedWithClick} />}
      {visibility.canViewSharedWith && <StatItem value={profileData?.shared_by_count || 0} label="sharing with me" onClick={handlers.onSharedByClick} />}
    </div>
  );
}

function PersonaInlineChip({ persona, peakHour }) {
  if (!persona) return null;
  const peakLabel = buildPeakLabel(peakHour);
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

function ProfileBioSection({ bio }) {
  if (!bio) return null;
  return <div className={styles.bio}><div className={styles.reminder}>{bio}</div></div>;
}

function ContactEmail({ email }) {
  if (!email) return null;
  return (
    <div className={styles.emailTipRow}>
      <p className={styles.teacherEmail}>
        <a href={`mailto:${email}`}>{email}</a>
      </p>
    </div>
  );
}

function SharedPlanningTip() {
  return (
    <span className={styles.sharedPlanningTip}>
      <span className={styles.sharedPlanningTipLabel}>Tip</span>
      Compare free slots to find times that work for both of you.
    </span>
  );
}

function SharedCalendarActions({ user, route, onNavigate }) {
  return (
    <div className={styles.calendarActionsGroup}>
      <div className={styles.calendarActionsRow}>
        <span className={styles.sharedCalendarIndicator}>Shared calendar with me</span>
        <ShareButton userId={user?.id} initialIsSharing={user?.is_sharing} onToggle={(v) => { user?.setOptimisticShare?.(v); user?.reload?.(); }} shareVariant="secondary" sharedVariant="secondary" />
      </div>
      <PrimaryButton className={styles.viewCalendarPill} size="small" pill onClick={() => onNavigate(route)}>
        View their calendar
      </PrimaryButton>
    </div>
  );
}

function HeaderTitleRow({ user, roleLabel, handlers, visibility, isShared }) {
  return (
    <div className={styles.headerTop}>
      <h1 className={styles.username}>{user?.username || "guest"}</h1>
      <span className={styles.rolePill}>{roleLabel}</span>
      {!isShared && <HeaderAction visibility={visibility} handlers={handlers} user={user} />}
    </div>
  );
}

function HeaderMeta({ user, profileData, handlers, visibility, societies, onSocietiesClick, onNavigate }) {
  const { description, roleLabel } = buildHeaderVars(user, profileData);
  const isShared = !visibility.canEditProfile && profileData?.is_shared_with_me && !!onNavigate;
  const route = isShared ? buildSharedCalendarRoute(user, profileData) : null;
  return (
    <>
      <HeaderTitleRow user={user} roleLabel={roleLabel} handlers={handlers} visibility={visibility} isShared={isShared} />
      {description && <div className={styles.headerSubline}>{description}</div>}
      <ContactEmail email={profileData?.email} />
      {!visibility.canEditProfile && <SharedPlanningTip />}
      {isShared && <SharedCalendarActions user={user} route={route} onNavigate={onNavigate} />}
      <ProfileStats profileData={profileData} handlers={handlers} visibility={visibility} societyCount={societies?.length || 0} onSocietiesClick={onSocietiesClick} />
      <ProfileBioSection bio={profileData?.bio} />
    </>
  );
}

function BadgePlaceholder() {
  return (
    <div className={styles.badgePlaceholder}>
      <span className={styles.badgePlaceholderIcon} aria-hidden="true">🏅</span>
      <span className={styles.badgePlaceholderText}>Earn badges by building study habits</span>
    </div>
  );
}

function HeaderInsightsEmptyState() {
  return (
    <div className={styles.headerBadgesPersonaRow}>
      <BadgePlaceholder />
    </div>
  );
}

function HeaderInsights({ badges, pinnedBadgeId, onPinBadge, onViewAllBadges, persona, peakHour, visibility }) {
  const hasBadges = badges?.length > 0;
  const hasInsights = hasBadges || !!persona;

  if (!hasInsights) {
    return visibility.canEditProfile ? <HeaderInsightsEmptyState /> : null;
  }

  return (
    <div className={styles.headerBadgesPersonaRow}>
      {hasBadges && <ProfileBadges badges={badges} pinnedBadgeId={pinnedBadgeId} onPinBadge={onPinBadge} canPin={visibility.canEditProfile} onViewAll={onViewAllBadges} />}
      {persona && <PersonaInlineChip persona={persona} peakHour={peakHour} />}
    </div>
  );
}

function DesktopHeader(props) {
  const { user, profileData, handlers, visibility, badges, pinnedBadgeId, onPinBadge, onViewAllBadges, persona, peakHour, societies, onSocietiesClick, resolvedPhoto, onNavigate } = props;
  return (
    <div className={`${styles.header} ${styles.desktopOnly}`}>
      <ProfileAvatar user={user} profilePhotoUrl={resolvedPhoto} />
      <div className={styles.headerInfo}>
        <HeaderMeta user={user} profileData={profileData} handlers={handlers} visibility={visibility} societies={societies} onSocietiesClick={onSocietiesClick} onNavigate={onNavigate} />
        <HeaderInsights badges={badges} pinnedBadgeId={pinnedBadgeId} onPinBadge={onPinBadge} onViewAllBadges={onViewAllBadges} persona={persona} peakHour={peakHour} visibility={visibility} />
      </div>
    </div>
  );
}

function MobileStats({ profileData, handlers, visibility }) {
  if (!(visibility.canViewModules && visibility.canEditProfile)) return null;
  return <div className={styles.mobileStatsGrid}><div className={styles.mobileStatCard} onClick={handlers.onModulesClick}><span className={styles.mobileStatValue}>{profileData?.module_count || 0}</span><span className={styles.mobileStatLabel}>Modules</span></div></div>;
}

function MobileHeader({ user, profileData, handlers, visibility, resolvedPhoto, onNavigate }) {
  const { description, roleLabel } = buildHeaderVars(user, profileData);
  return (
    <div className={`${styles.mobileHeaderWrap} ${styles.mobileOnly}`}>
      <div className={styles.mobileHero}>
        <ProfileAvatar user={user} profilePhotoUrl={resolvedPhoto} mobile />
        <h1 className={styles.mobileUsername}>{(profileData || user)?.username || "guest"}</h1>
        <p className={styles.mobileBio}>{description}</p>
        <span className={styles.mobileRolePill}>{roleLabel}</span>
        <SharedCalendarPill profileData={profileData} visibility={visibility} onNavigate={onNavigate} />
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
      <MobileHeader
        user={shareUser}
        profileData={props.profileData}
        handlers={props.handlers}
        visibility={props.visibility}
        resolvedPhoto={resolvedPhoto}
        onNavigate={props.onNavigate}
      />
    </>
  );
}
