/*
 * GroupWork availability tab.
 */

import { useMemo } from "react";
import { Check, Plus, Star, Trash2, X } from "lucide-react";
import ConfirmModal from "../../components/Common/ConfirmModal/ConfirmModal";
import SearchEmptyState from "../../components/Common/SearchEmptyState/SearchEmptyState";
import Tooltip from "../../components/Common/Tooltip/Tooltip";
import { useConfirm } from "../../context/ConfirmContext";
import { getPhotoUrl } from "./components/memberAvatarUtils";
import { useActiveMeetingView, useAvailability } from "./hooks/useAvailabilityHooks";
import baseStyles from "./AvailabilityTab.module.css";
import slotStyles from "./AvailabilityTabSlots.module.css";
import {
    RESPONSE_META,
    formatSuggestionDateLabel,
    getCurrentUserStatus,
    getMemberStatuses,
    getSuggestionCount,
    getTeamSize,
    splitSuggestions,
} from "./utils/availabilityUtils";

const styles = { ...baseStyles, ...slotStyles };

const COUNT_CLASS = {
    accepted: "acceptedCount",
    rejected: "rejectedCount",
    pending: "pendingCount",
};

const AVATAR_CLASS = {
    accepted: "responseAccepted",
    rejected: "responseRejected",
    pending: "responsePending",
};

const MEETING_ACTIONS = [
    { status: "accepted", className: "acceptBtn", Icon: Check, label: "Accept meeting suggestion" },
    { status: "rejected", className: "rejectBtn", Icon: X, label: "Reject meeting suggestion" },
];

function MeetingToggleButton({ count, isActive, label, onClick }) {
    return (
        <button type="button" className={`${styles.meetingToggleButton} ${isActive ? styles.meetingToggleButtonActive : ""}`} onClick={onClick}>
            <span>{label}</span>
            <span className={styles.meetingToggleCount}>{count}</span>
        </button>
    );
}

function MeetingToggleRow({ activeView, confirmedCount, onViewChange, proposedCount }) {
    return (
        <div className={styles.meetingToggle}>
            <MeetingToggleButton isActive={activeView === "proposed"} label="Proposed slots" count={proposedCount} onClick={() => onViewChange("proposed")} />
            <MeetingToggleButton isActive={activeView === "confirmed"} label="Confirmed meeting slots" count={confirmedCount} onClick={() => onViewChange("confirmed")} />
        </div>
    );
}

function AvailabilityHeader({ activeView, confirmedCount, hasMeetingCards, onViewChange, proposedCount }) {
    return (
        <div className={styles.header}>
            <div className={styles.headerCopy}>
                <h3 className={styles.title}>Propose meeting timings with your team</h3>
                <p className={styles.subtitle}>Click a slot or use the propose button to suggest it to the group.</p>
            </div>
            {hasMeetingCards ? <MeetingToggleRow activeView={activeView} onViewChange={onViewChange} proposedCount={proposedCount} confirmedCount={confirmedCount} /> : null}
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

function MeetingCountPill({ status, suggestion }) {
    const meta = RESPONSE_META[status];
    const count = getSuggestionCount(suggestion, status);
    const Icon = meta.Icon;
    return <span className={`${styles.countPill} ${styles[COUNT_CLASS[status]]}`}><Icon size={12} />{count}</span>;
}

function DeleteButton({ currentUserId, onDelete, suggestion }) {
    if (suggestion.suggested_by.id !== currentUserId) return null;
    return (
        <button type="button" onClick={() => onDelete(suggestion.id)} className={styles.deleteBtn} aria-label="Delete meeting suggestion">
            <Trash2 size={18} />
        </button>
    );
}

function MeetingActionButton({ action, currentStatus, onVote, suggestionId }) {
    const Icon = action.Icon;
    const className = `${styles[action.className]} ${currentStatus === action.status ? styles.meetingActionActive : ""}`;
    return <button type="button" onClick={() => onVote(suggestionId, action.status)} className={className} aria-label={action.label}><Icon size={18} /></button>;
}

function MeetingCardActions({ currentUserId, onDelete, onVote, suggestion }) {
    const currentStatus = getCurrentUserStatus(suggestion, currentUserId);
    return (
        <div className={styles.suggestionActions}>
            {MEETING_ACTIONS.map((action) => <MeetingActionButton key={action.status} action={action} currentStatus={currentStatus} onVote={onVote} suggestionId={suggestion.id} />)}
            <DeleteButton suggestion={suggestion} currentUserId={currentUserId} onDelete={onDelete} />
        </div>
    );
}

function MemberStatusAvatar({ member }) {
    const meta = RESPONSE_META[member.status] || RESPONSE_META.pending;
    const Icon = meta.Icon;
    const photoUrl = getPhotoUrl({ user: member.id, username: member.username, name: member.name, profile_photo_url: member.profile_photo_url });
    const tooltip = `@${member.username} · ${meta.label.toLowerCase()}${member.is_suggester ? " · proposed this slot" : ""}`;
    return (
        <Tooltip content={tooltip} position="top">
            <div className={`${styles.responseAvatar} ${styles[AVATAR_CLASS[member.status] || AVATAR_CLASS.pending]}`}>
                {photoUrl ? <img src={photoUrl} alt={member.username} className={styles.avatarImg} /> : <span className={styles.avatarFallback}>{member.initials}</span>}
                <span className={styles.responseBadge}><Icon size={10} strokeWidth={2.5} /></span>
            </div>
        </Tooltip>
    );
}

function MemberStatusStack({ suggestion }) {
    const memberStatuses = getMemberStatuses(suggestion);
    if (!memberStatuses.length) return null;
    return <div className={styles.responseStack}>{memberStatuses.map((member) => <MemberStatusAvatar key={member.id} member={member} />)}</div>;
}

function SuggestionSummary({ subtext, suggestion }) {
    return (
        <>
            <div className={styles.suggestionMeta}>Proposed by {suggestion.suggested_by.username}</div>
            <div className={styles.suggestionSubtext}>{subtext}</div>
            <MemberStatusStack suggestion={suggestion} />
        </>
    );
}

function ProposedMeetingCard({ currentUserId, onDelete, onVote, suggestion }) {
    const teamSize = getTeamSize(suggestion);
    return (
        <div className={styles.suggestionCard}>
            <div className={styles.suggestionMain}>
                <div className={styles.suggestionTopRow}>
                    <div className={styles.suggestionTitle}>{formatSuggestionDateLabel(suggestion.start)}</div>
                    <div className={styles.countRow}>
                        <MeetingCountPill suggestion={suggestion} status="accepted" />
                        <MeetingCountPill suggestion={suggestion} status="rejected" />
                        <MeetingCountPill suggestion={suggestion} status="pending" />
                    </div>
                </div>
                <SuggestionSummary suggestion={suggestion} subtext={`${teamSize} team members tracking this slot`} />
            </div>
            <MeetingCardActions suggestion={suggestion} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />
        </div>
    );
}

function ConfirmedMeetingCard({ index, suggestion }) {
    const teamSize = getTeamSize(suggestion);
    return (
        <div className={`${styles.suggestionCard} ${styles.confirmedCard}`}>
            <div className={styles.suggestionMain}>
                <div className={styles.suggestionTopRow}>
                    <div className={styles.confirmedTitleRow}>
                        <span className={styles.confirmedLabel}>Meeting {index + 1}</span>
                        <span className={styles.suggestionTitle}>{formatSuggestionDateLabel(suggestion.start)}</span>
                    </div>
                    <span className={styles.confirmedPill}>All users attending</span>
                </div>
                <SuggestionSummary suggestion={suggestion} subtext={`All ${teamSize} members accepted this timing.`} />
            </div>
        </div>
    );
}

function EmptyMeetingCards({ isConfirmedView }) {
    return (
        <div className={styles.meetingCardsEmpty}>
            <SearchEmptyState
                title={isConfirmedView ? "No confirmed meeting slots yet" : "No proposed meeting slots yet"}
                hint={isConfirmedView ? "Once every teammate accepts a proposal, it will appear here." : "Choose a suggested time below or propose one to get things started."}
                className={styles.meetingCardsEmptyState}
            />
        </div>
    );
}

function ProposedCardsList({ currentUserId, items, onDelete, onVote }) {
    return items.map((suggestion) => (
        <ProposedMeetingCard key={suggestion.id} suggestion={suggestion} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />
    ));
}

function MeetingCardsSection({ activeView, confirmedSuggestions, currentUserId, onDelete, onVote, proposedSuggestions }) {
    const isConfirmedView = activeView === "confirmed";
    const items = isConfirmedView ? confirmedSuggestions : proposedSuggestions;
    if (!items.length) return <EmptyMeetingCards isConfirmedView={isConfirmedView} />;
    return (
        <div className={styles.meetingCards}>
            {isConfirmedView
                ? items.map((suggestion, index) => <ConfirmedMeetingCard key={suggestion.id} suggestion={suggestion} index={index} />)
                : <ProposedCardsList items={items} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />}
        </div>
    );
}

function AvatarPhotoContent({ member, photoUrl }) {
    if (photoUrl) return <img src={photoUrl} alt={member.name} className={styles.avatarImg} />;
    return <span className={styles.avatarFallback}>{member.initials}</span>;
}

function navigateToMemberProfile(event, memberId) {
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent("navigate", { detail: `profile_${memberId}` }));
}

function AvatarStatusBadge({ isFree }) {
    return (
        <span className={`${styles.avatarStatus} ${isFree ? styles.avatarStatusFree : styles.avatarStatusBusy}`}>
            {isFree ? <Check size={8} strokeWidth={3} /> : <X size={8} strokeWidth={3} />}
        </span>
    );
}

function MemberAvatarPhoto({ member }) {
    const photoUrl = getPhotoUrl({ user: member.id, user_name: member.name, username: member.name, profile_photo_url: member.profile_photo_url });
    const tooltip = `@${member.name}${member.is_free ? " · free" : " · busy"}`;
    return (
        <Tooltip content={tooltip} position="top">
            <div className={`${styles.avatarCircle} ${member.is_free ? styles.avatarCircleFree : styles.avatarCircleBusy}`} onClick={(event) => navigateToMemberProfile(event, member.id)} title={member.name}>
                <AvatarPhotoContent photoUrl={photoUrl} member={member} />
                <AvatarStatusBadge isFree={member.is_free} />
            </div>
        </Tooltip>
    );
}

function SlotRow({ onClick, slot }) {
    const isBest = slot.free_count === slot.total_count;
    return (
        <div className={styles.slotRow}>
            <div className={styles.timeLabel}>
                {slot.label}
                {isBest ? <Star size={14} className={styles.bestTimeStar} fill="currentColor" /> : null}
            </div>
            <div className={styles.memberList}>{slot.members.map((member) => <MemberAvatarPhoto key={member.id} member={member} />)}</div>
            <div className={`${styles.scoreLabel} ${isBest ? styles.scoreLabelHighlight : ""}`}>{slot.free_count}/{slot.total_count} free</div>
            <button type="button" className={styles.proposePill} onClick={onClick}><Plus size={11} strokeWidth={2.5} /> Propose</button>
        </div>
    );
}

function SuggestionModal({ onCancel, onConfirm, slot }) {
    if (!slot) return null;
    return <ConfirmModal title={`Suggest ${formatSuggestionDateLabel(slot.start)}?`} message="This will notify all members and allow them to vote." onConfirm={() => onConfirm(slot)} onCancel={onCancel} confirmText="Suggest Time" />;
}

function SlotSuggestionsSection({ handleSuggestTime, setSuggestingSlot, suggestingSlot, suggestions }) {
    return (
        <>
            <div className={styles.slotList}>{suggestions.map((slot) => <SlotRow key={slot.start} slot={slot} onClick={() => setSuggestingSlot(slot)} />)}</div>
            <SuggestionModal slot={suggestingSlot} onCancel={() => setSuggestingSlot(null)} onConfirm={handleSuggestTime} />
            <AvailabilityFooter />
        </>
    );
}

function AvailabilityContent({ activeMeetingView, availability, confirmedSuggestions, handleViewChange, proposedSuggestions }) {
    const hasMeetingCards = proposedSuggestions.length > 0 || confirmedSuggestions.length > 0;
    return (
        <div className={styles.container}>
            <AvailabilityHeader hasMeetingCards={hasMeetingCards} activeView={activeMeetingView} onViewChange={handleViewChange} proposedCount={proposedSuggestions.length} confirmedCount={confirmedSuggestions.length} />
            {hasMeetingCards ? <MeetingCardsSection activeView={activeMeetingView} proposedSuggestions={proposedSuggestions} confirmedSuggestions={confirmedSuggestions} currentUserId={availability.current_user_id} onVote={availability.handleVote} onDelete={availability.handleDelete} /> : null}
            {activeMeetingView !== "confirmed" ? <SlotSuggestionsSection suggestions={availability.suggestions} suggestingSlot={availability.suggestingSlot} setSuggestingSlot={availability.setSuggestingSlot} handleSuggestTime={availability.handleSuggestTime} /> : null}
        </div>
    );
}

export default function AvailabilityTab({ projectId }) {
    const confirm = useConfirm();
    const availability = useAvailability(projectId, confirm);
    const { proposedSuggestions, confirmedSuggestions } = useMemo(() => splitSuggestions(availability.active_suggestions), [availability.active_suggestions]);
    const { activeMeetingView, handleViewChange } = useActiveMeetingView(proposedSuggestions, confirmedSuggestions);

    if (availability.loading) return <div className={styles.loading}>Analysing member calendars...</div>;
    return <AvailabilityContent activeMeetingView={activeMeetingView} availability={availability} confirmedSuggestions={confirmedSuggestions} handleViewChange={handleViewChange} proposedSuggestions={proposedSuggestions} />;
}
