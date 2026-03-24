/*
 * GroupWork availability tab.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock3, Plus, Star, Trash2, X } from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import SearchEmptyState from "../../components/common/SearchEmptyState/SearchEmptyState";
import Tooltip from "../../components/common/Tooltip/Tooltip";
import { useConfirm } from "../../context/ConfirmContext";
import { getPhotoUrl } from "./utils/memberAvatarUtils";
import { useAvailability } from "./hooks/useAvailability";
import { formatSuggestionDateLabel, getMemberStatuses, getTeamSize, getSuggestionCount, getCurrentUserStatus } from "./utils/availabilityUtils";
import styles from "./AvailabilityTab.module.css";
import meetingStyles from "./AvailabilityMeetingCards.module.css";

const RESPONSE_META = {
    accepted: { label: "Accepted", Icon: Check, countClassName: meetingStyles.acceptedCount, avatarClassName: meetingStyles.responseAccepted },
    rejected: { label: "Rejected", Icon: X, countClassName: meetingStyles.rejectedCount, avatarClassName: meetingStyles.responseRejected },
    pending: { label: "Pending", Icon: Clock3, countClassName: meetingStyles.pendingCount, avatarClassName: meetingStyles.responsePending },
};

function useSortedSuggestions(active_suggestions) {
    return useMemo(() => {
        const all = [...(active_suggestions || [])].sort((left, right) => new Date(left.start) - new Date(right.start));
        return { confirmedSuggestions: all.filter((s) => s.is_confirmed), proposedSuggestions: all.filter((s) => !s.is_confirmed) };
    }, [active_suggestions]);
}

function useMeetingView(proposedSuggestions, confirmedSuggestions) {
    const [activeMeetingView, setActiveMeetingView] = useState("proposed");
    const [hasChosenMeetingView, setHasChosenMeetingView] = useState(false);
    useEffect(() => {
        if (hasChosenMeetingView) return;
        if (!proposedSuggestions.length && confirmedSuggestions.length > 0) setActiveMeetingView("confirmed");
    }, [confirmedSuggestions.length, hasChosenMeetingView, proposedSuggestions.length]);
    const onViewChange = (nextView) => { setHasChosenMeetingView(true); setActiveMeetingView(nextView); };
    return { activeMeetingView, onViewChange };
}

function MeetingToggleButton({ isActive, label, count, onClick }) {
    return (
        <button type="button" className={`${styles.meetingToggleButton} ${isActive ? styles.meetingToggleButtonActive : ""}`} onClick={onClick}>
            {isActive && (
                <motion.div
                    layoutId="meetingToggleIndicator"
                    className={styles.meetingToggleIndicator}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
            )}
            <span className={styles.meetingToggleLabel}>{label}</span>
            <span className={styles.meetingToggleCount}>{count}</span>
        </button>
    );
}

function MeetingViewToggle({ activeView, onViewChange, proposedCount, confirmedCount }) {
    return (
        <div className={styles.meetingToggle}>
            <MeetingToggleButton isActive={activeView === "proposed"} label="Proposed slots" count={proposedCount} onClick={() => onViewChange("proposed")} />
            <MeetingToggleButton isActive={activeView === "confirmed"} label="Confirmed meeting slots" count={confirmedCount} onClick={() => onViewChange("confirmed")} />
        </div>
    );
}

function AvailabilityHeader({ hasMeetingCards, activeView, onViewChange, proposedCount, confirmedCount }) {
    return (
        <div className={styles.header}>
            <div className={styles.headerCopy}>
                <h3 className={styles.title}>Propose meeting timings with your team</h3>
                <p className={styles.subtitle}>Click a slot or use the propose button to suggest it to the group.</p>
            </div>
            {hasMeetingCards ? <MeetingViewToggle activeView={activeView} onViewChange={onViewChange} proposedCount={proposedCount} confirmedCount={confirmedCount} /> : null}
        </div>
    );
}

function AvailabilityFooter() {
    return (
        <div className={styles.footer}>
            <Star size={14} className={styles.footerDot} fill="currentColor" />
            <span>Green rings mean free, muted rings mean busy, and starred slots are fully open for the whole team.</span>
        </div>
    );
}

function MeetingCountPill({ suggestion, status }) {
    const meta = RESPONSE_META[status];
    const count = getSuggestionCount(suggestion, status);
    const Icon = meta.Icon;
    return (
        <span className={`${meetingStyles.countPill} ${meta.countClassName}`}>
            <Icon size={12} />
            {count}
        </span>
    );
}

function VoteButtons({ suggestion, currentUserId, onVote }) {
    const currentStatus = getCurrentUserStatus(suggestion, currentUserId);
    return (
        <>
            <button type="button" onClick={() => onVote(suggestion.id, "accepted")} className={`${meetingStyles.acceptBtn} ${currentStatus === "accepted" ? meetingStyles.meetingActionActive : ""}`} aria-label="Accept meeting suggestion">
                <Check size={18} />
            </button>
            <button type="button" onClick={() => onVote(suggestion.id, "rejected")} className={`${meetingStyles.rejectBtn} ${currentStatus === "rejected" ? meetingStyles.meetingActionActive : ""}`} aria-label="Reject meeting suggestion">
                <X size={18} />
            </button>
        </>
    );
}

function DeleteButton({ suggestion, currentUserId, onDelete }) {
    if (suggestion.suggested_by.id !== currentUserId) return null;
    return (
        <button type="button" onClick={() => onDelete(suggestion.id)} className={meetingStyles.deleteBtn} aria-label="Delete meeting suggestion">
            <Trash2 size={18} />
        </button>
    );
}

function MeetingCardActions({ suggestion, currentUserId, onVote, onDelete }) {
    return (
        <div className={meetingStyles.suggestionActions}>
            <VoteButtons suggestion={suggestion} currentUserId={currentUserId} onVote={onVote} />
            <DeleteButton suggestion={suggestion} currentUserId={currentUserId} onDelete={onDelete} />
        </div>
    );
}

function ResponseAvatarContent({ photoUrl, member, meta }) {
    const Icon = meta.Icon;
    return (
        <div className={`${meetingStyles.responseAvatar} ${meta.avatarClassName}`}>
            {photoUrl ? <img src={photoUrl} alt={member.username} className={styles.avatarImg} /> : <span className={styles.avatarFallback}>{member.initials}</span>}
            <span className={meetingStyles.responseBadge}><Icon size={10} strokeWidth={2.5} /></span>
        </div>
    );
}

function MemberStatusAvatar({ member }) {
    const meta = RESPONSE_META[member.status] || RESPONSE_META.pending;
    const photoUrl = getPhotoUrl({ user: member.id, username: member.username, name: member.name, profile_photo_url: member.profile_photo_url });
    const tooltip = `@${member.username} · ${meta.label.toLowerCase()}${member.is_suggester ? " · proposed this slot" : ""}`;
    return (
        <Tooltip content={tooltip} position="top">
            <ResponseAvatarContent photoUrl={photoUrl} member={member} meta={meta} />
        </Tooltip>
    );
}

function MemberStatusStack({ suggestion }) {
    const memberStatuses = getMemberStatuses(suggestion);
    if (!memberStatuses.length) return null;
    return (
        <div className={meetingStyles.responseStack}>
            {memberStatuses.map((member) => <MemberStatusAvatar key={member.id} member={member} />)}
        </div>
    );
}

function ProposedMeetingMeta({ suggestion }) {
    const teamSize = getTeamSize(suggestion);
    return (
        <div className={meetingStyles.suggestionMain}>
            <div className={meetingStyles.suggestionTopRow}>
                <div className={meetingStyles.suggestionTitle}>{formatSuggestionDateLabel(suggestion.start)}</div>
                <div className={meetingStyles.countRow}>
                    <MeetingCountPill suggestion={suggestion} status="accepted" />
                    <MeetingCountPill suggestion={suggestion} status="rejected" />
                    <MeetingCountPill suggestion={suggestion} status="pending" />
                </div>
            </div>
            <div className={meetingStyles.suggestionMeta}>Proposed by {suggestion.suggested_by.username}</div>
            <div className={meetingStyles.suggestionSubtext}>{teamSize} team members tracking this slot</div>
            <MemberStatusStack suggestion={suggestion} />
        </div>
    );
}

function ProposedMeetingCard({ suggestion, currentUserId, onVote, onDelete }) {
    return (
        <div className={meetingStyles.suggestionCard}>
            <ProposedMeetingMeta suggestion={suggestion} />
            <MeetingCardActions suggestion={suggestion} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />
        </div>
    );
}

function ConfirmedMeetingCard({ suggestion, index }) {
    const teamSize = getTeamSize(suggestion);
    return (
        <div className={`${meetingStyles.suggestionCard} ${meetingStyles.confirmedCard}`}>
            <div className={meetingStyles.suggestionMain}>
                <div className={meetingStyles.suggestionTopRow}>
                    <div className={meetingStyles.confirmedTitleRow}>
                        <span className={meetingStyles.confirmedLabel}>Meeting {index + 1}</span>
                        <span className={meetingStyles.suggestionTitle}>{formatSuggestionDateLabel(suggestion.start)}</span>
                    </div>
                    <span className={meetingStyles.confirmedPill}>All users attending</span>
                </div>
                <div className={meetingStyles.suggestionMeta}>Confirmed from {suggestion.suggested_by.username}&apos;s proposal</div>
                <div className={meetingStyles.suggestionSubtext}>All {teamSize} members accepted this timing.</div>
                <MemberStatusStack suggestion={suggestion} />
            </div>
        </div>
    );
}

function ConfirmedCardList({ items }) {
    return (
        <div className={meetingStyles.meetingCards}>
            {items.map((suggestion, index) => <ConfirmedMeetingCard key={suggestion.id} suggestion={suggestion} index={index} />)}
        </div>
    );
}

function ProposedCardList({ items, currentUserId, onVote, onDelete }) {
    return (
        <div className={meetingStyles.meetingCards}>
            {items.map((suggestion) => <ProposedMeetingCard key={suggestion.id} suggestion={suggestion} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />)}
        </div>
    );
}

function MeetingCardsEmptyState({ isConfirmedView }) {
    const title = isConfirmedView ? "No confirmed meeting slots yet" : "No proposed meeting slots yet";
    const hint = isConfirmedView ? "Once every teammate accepts a proposal, it will appear here." : "Choose a suggested time below or propose one to get things started.";
    return <div className={meetingStyles.meetingCardsEmpty}><SearchEmptyState title={title} hint={hint} className={meetingStyles.meetingCardsEmptyState} /></div>;
}

function MeetingCardsContent({ isConfirmedView, items, currentUserId, onVote, onDelete }) {
    if (items.length === 0) return <MeetingCardsEmptyState isConfirmedView={isConfirmedView} />;
    if (isConfirmedView) return <ConfirmedCardList items={items} />;
    return <ProposedCardList items={items} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />;
}

function MeetingCardsSection({ activeView, proposedSuggestions, confirmedSuggestions, currentUserId, onVote, onDelete }) {
    const isConfirmedView = activeView === "confirmed";
    const items = isConfirmedView ? confirmedSuggestions : proposedSuggestions;
    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeView} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                <MeetingCardsContent isConfirmedView={isConfirmedView} items={items} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />
            </motion.div>
        </AnimatePresence>
    );
}

function AvatarImage({ src, name }) {
    if (src) return <img src={src} alt={name} className={styles.avatarImg} />;
    return null;
}

function StatusBadge({ isFree }) {
    return (
        <span className={`${styles.avatarStatus} ${isFree ? styles.avatarStatusFree : styles.avatarStatusBusy}`}>
            {isFree ? <Check size={8} strokeWidth={3} /> : <X size={8} strokeWidth={3} />}
        </span>
    );
}

function MemberAvatarPhoto({ member }) {
    const photoUrl = getPhotoUrl({ user: member.id, user_name: member.name, username: member.name, profile_photo_url: member.profile_photo_url });
    const navigateToProfile = (event) => {
        event.stopPropagation();
        window.dispatchEvent(new CustomEvent("navigate", { detail: `profile_${member.id}` }));
    };
    return (
        <Tooltip content={`@${member.name}${member.is_free ? " · free" : " · busy"}`} position="top">
            <div className={`${styles.avatarCircle} ${member.is_free ? styles.avatarCircleFree : styles.avatarCircleBusy}`} onClick={navigateToProfile} title={member.name}>
                <AvatarImage src={photoUrl} name={member.name} />
                {!photoUrl && <span className={styles.avatarFallback}>{member.initials}</span>}
                <StatusBadge isFree={member.is_free} />
            </div>
        </Tooltip>
    );
}

function SlotRow({ slot, onClick }) {
    const isBest = slot.free_count === slot.total_count;
    return (
        <div className={styles.slotRow}>
            <div className={styles.timeLabel}>
                {slot.label}
                {isBest ? <Star size={14} className={styles.bestTimeStar} fill="currentColor" /> : null}
            </div>
            <div className={styles.memberList}>{slot.members.map((member) => <MemberAvatarPhoto key={member.id} member={member} />)}</div>
            <div className={`${styles.scoreLabel} ${isBest ? styles.scoreLabelHighlight : ""}`}>{slot.free_count}/{slot.total_count} free</div>
            <button type="button" className={styles.proposePill} onClick={onClick}>
                <Plus size={11} strokeWidth={2.5} /> Propose
            </button>
        </div>
    );
}

function SuggestionModal({ slot, onCancel, onConfirm }) {
    if (!slot) return null;
    return (
        <ConfirmModal
            title={`Suggest ${formatSuggestionDateLabel(slot.start)}?`}
            message="This will notify all members and allow them to vote."
            onConfirm={() => onConfirm(slot)}
            onCancel={onCancel}
            confirmText="Suggest Time"
        />
    );
}

function AvailabilitySlotSection({ suggestions, suggestingSlot, setSuggestingSlot, onConfirm }) {
    return (
        <>
            <div className={styles.slotList}>
                {suggestions.map((slot) => <SlotRow key={slot.start} slot={slot} onClick={() => setSuggestingSlot(slot)} />)}
            </div>
            <SuggestionModal slot={suggestingSlot} onCancel={() => setSuggestingSlot(null)} onConfirm={onConfirm} />
            <AvailabilityFooter />
        </>
    );
}

function AvailabilityBody({ availability, viewState, sorted }) {
    const { suggestions, current_user_id, suggestingSlot, setSuggestingSlot, handleSuggestTime, handleDelete, handleVote } = availability;
    const { proposedSuggestions, confirmedSuggestions } = sorted;
    const { activeMeetingView, onViewChange } = viewState;
    const hasMeetingCards = proposedSuggestions.length > 0 || confirmedSuggestions.length > 0;
    const showSlotSuggestions = activeMeetingView !== "confirmed";
    return (
        <div className={styles.container}>
            <AvailabilityHeader hasMeetingCards={hasMeetingCards} activeView={activeMeetingView} onViewChange={onViewChange} proposedCount={proposedSuggestions.length} confirmedCount={confirmedSuggestions.length} />
            {hasMeetingCards ? <MeetingCardsSection activeView={activeMeetingView} proposedSuggestions={proposedSuggestions} confirmedSuggestions={confirmedSuggestions} currentUserId={current_user_id} onVote={handleVote} onDelete={handleDelete} /> : null}
            {showSlotSuggestions ? <AvailabilitySlotSection suggestions={suggestions} suggestingSlot={suggestingSlot} setSuggestingSlot={setSuggestingSlot} onConfirm={handleSuggestTime} /> : null}
        </div>
    );
}

/** Availability tab for proposing and voting on meeting slots. */

export default function AvailabilityTab({ projectId }) {
    const confirm = useConfirm();
    const availability = useAvailability(projectId, confirm);
    const sorted = useSortedSuggestions(availability.active_suggestions);
    const viewState = useMeetingView(sorted.proposedSuggestions, sorted.confirmedSuggestions);
    if (availability.loading) return <div className={styles.loading}>Analysing member calendars...</div>;
    return <AvailabilityBody availability={availability} viewState={viewState} sorted={sorted} />;
}
