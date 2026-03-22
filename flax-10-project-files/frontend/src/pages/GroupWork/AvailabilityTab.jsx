/*
 * GroupWork availability tab.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock3, Plus, Star, Trash2, X } from "lucide-react";
import ConfirmModal from "../../components/Common/ConfirmModal/ConfirmModal";
import SearchEmptyState from "../../components/Common/SearchEmptyState/SearchEmptyState";
import Tooltip from "../../components/Common/Tooltip/Tooltip";
import { useConfirm } from "../../context/ConfirmContext";
import { getAuthHeaders } from "./api/groupWorkApi";
import { getPhotoUrl } from "./components/memberAvatarUtils";
import styles from "./AvailabilityTab.module.css";

const RESPONSE_META = {
    accepted: { label: "Accepted", Icon: Check, countClassName: styles.acceptedCount, avatarClassName: styles.responseAccepted },
    rejected: { label: "Rejected", Icon: X, countClassName: styles.rejectedCount, avatarClassName: styles.responseRejected },
    pending: { label: "Pending", Icon: Clock3, countClassName: styles.pendingCount, avatarClassName: styles.responsePending },
};

function formatSuggestionDateLabel(value) {
    const date = new Date(value);
    const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
    const day = date.toLocaleDateString("en-GB", { day: "numeric" });
    const month = date.toLocaleDateString("en-GB", { month: "short" });
    const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${weekday} ${day} ${month}, ${time}`;
}

function getMemberStatuses(suggestion) {
    return Array.isArray(suggestion?.member_statuses) ? suggestion.member_statuses : [];
}

function getTeamSize(suggestion) {
    return Number(suggestion?.team_size || getMemberStatuses(suggestion).length || 0);
}

function getSuggestionCount(suggestion, status) {
    const field = `${status}_count`;
    if (typeof suggestion?.[field] === "number") return suggestion[field];
    return getMemberStatuses(suggestion).filter((member) => member.status === status).length;
}

function getCurrentUserStatus(suggestion, currentUserId) {
    const memberStatus = getMemberStatuses(suggestion).find((member) => member.id === currentUserId);
    if (memberStatus?.status) return memberStatus.status;
    if (suggestion?.suggested_by?.id === currentUserId) return "accepted";
    return "pending";
}

function AvailabilityHeader({ hasMeetingCards, activeView, onViewChange, proposedCount, confirmedCount }) {
    return (
        <div className={styles.header}>
            <div className={styles.headerCopy}>
                <h3 className={styles.title}>Propose meeting timings with your team</h3>
                <p className={styles.subtitle}>Click a slot or use the propose button to suggest it to the group.</p>
            </div>
            {hasMeetingCards ? (
                <div className={styles.meetingToggle}>
                    <MeetingToggleButton isActive={activeView === "proposed"} label="Proposed slots" count={proposedCount} onClick={() => onViewChange("proposed")} />
                    <MeetingToggleButton isActive={activeView === "confirmed"} label="Confirmed meeting slots" count={confirmedCount} onClick={() => onViewChange("confirmed")} />
                </div>
            ) : null}
        </div>
    );
}

function MeetingToggleButton({ isActive, label, count, onClick }) {
    return (
        <button type="button" className={`${styles.meetingToggleButton} ${isActive ? styles.meetingToggleButtonActive : ""}`} onClick={onClick}>
            <span>{label}</span>
            <span className={styles.meetingToggleCount}>{count}</span>
        </button>
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
    return <span className={`${styles.countPill} ${meta.countClassName}`}><Icon size={12} />{count}</span>;
}

function MeetingCardActions({ suggestion, currentUserId, onVote, onDelete }) {
    const currentStatus = getCurrentUserStatus(suggestion, currentUserId);
    return (
        <div className={styles.suggestionActions}>
            <button type="button" onClick={() => onVote(suggestion.id, "accepted")} className={`${styles.acceptBtn} ${currentStatus === "accepted" ? styles.meetingActionActive : ""}`} aria-label="Accept meeting suggestion"><Check size={18} /></button>
            <button type="button" onClick={() => onVote(suggestion.id, "rejected")} className={`${styles.rejectBtn} ${currentStatus === "rejected" ? styles.meetingActionActive : ""}`} aria-label="Reject meeting suggestion"><X size={18} /></button>
            {suggestion.suggested_by.id === currentUserId ? (
                <button type="button" onClick={() => onDelete(suggestion.id)} className={styles.deleteBtn} aria-label="Delete meeting suggestion"><Trash2 size={18} /></button>
            ) : null}
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
            <div className={`${styles.responseAvatar} ${meta.avatarClassName}`}>
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

function ProposedMeetingCard({ suggestion, currentUserId, onVote, onDelete }) {
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
                <div className={styles.suggestionMeta}>Proposed by {suggestion.suggested_by.username}</div>
                <div className={styles.suggestionSubtext}>{teamSize} team members tracking this slot</div>
                <MemberStatusStack suggestion={suggestion} />
            </div>
            <MeetingCardActions suggestion={suggestion} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />
        </div>
    );
}

function ConfirmedMeetingCard({ suggestion, index }) {
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
                <div className={styles.suggestionMeta}>Confirmed from {suggestion.suggested_by.username}&apos;s proposal</div>
                <div className={styles.suggestionSubtext}>All {teamSize} members accepted this timing.</div>
                <MemberStatusStack suggestion={suggestion} />
            </div>
        </div>
    );
}

function MeetingCardsSection({ activeView, proposedSuggestions, confirmedSuggestions, currentUserId, onVote, onDelete }) {
    const isConfirmedView = activeView === "confirmed";
    const items = isConfirmedView ? confirmedSuggestions : proposedSuggestions;
    if (!items.length) {
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
    return (
        <div className={styles.meetingCards}>
            {isConfirmedView
                ? items.map((suggestion, index) => <ConfirmedMeetingCard key={suggestion.id} suggestion={suggestion} index={index} />)
                : items.map((suggestion) => <ProposedMeetingCard key={suggestion.id} suggestion={suggestion} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />)}
        </div>
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
                {photoUrl ? <img src={photoUrl} alt={member.name} className={styles.avatarImg} /> : <span className={styles.avatarFallback}>{member.initials}</span>}
                <span className={`${styles.avatarStatus} ${member.is_free ? styles.avatarStatusFree : styles.avatarStatusBusy}`}>
                    {member.is_free ? <Check size={8} strokeWidth={3} /> : <X size={8} strokeWidth={3} />}
                </span>
            </div>
        </Tooltip>
    );
}

function SlotRow({ slot, onClick }) {
    const isBest = slot.free_count === slot.total_count;
    return (
        <div className={styles.slotRow}>
            <div className={styles.timeLabel}>{slot.label}{isBest ? <Star size={14} className={styles.bestTimeStar} fill="currentColor" /> : null}</div>
            <div className={styles.memberList}>{slot.members.map((member) => <MemberAvatarPhoto key={member.id} member={member} />)}</div>
            <div className={`${styles.scoreLabel} ${isBest ? styles.scoreLabelHighlight : ""}`}>{slot.free_count}/{slot.total_count} free</div>
            <button type="button" className={styles.proposePill} onClick={onClick}><Plus size={11} strokeWidth={2.5} /> Propose</button>
        </div>
    );
}

function SuggestionModal({ slot, onCancel, onConfirm }) {
    if (!slot) return null;
    return <ConfirmModal title={`Suggest ${formatSuggestionDateLabel(slot.start)}?`} message="This will notify all members and allow them to vote." onConfirm={() => onConfirm(slot)} onCancel={onCancel} confirmText="Suggest Time" />;
}

function useAvailabilityData(projectId) {
    const [data, setData] = useState({ suggestions: [], active_suggestions: [], current_user_id: null, project_members: [], team_size: 0 });
    const [loading, setLoading] = useState(true);
    const fetchAvail = useCallback(() => {
        setLoading(true);
        fetch(`/api/group-work/projects/${projectId}/availability/`, { headers: getAuthHeaders() })
            .then((res) => (res.ok ? res.json() : null))
            .then((payload) => { if (payload) setData(payload); })
            .finally(() => setLoading(false));
    }, [projectId]);
    useEffect(() => { fetchAvail(); }, [fetchAvail]);
    return { data, fetchAvail, loading };
}

function useSuggestionActions(projectId, fetchAvail, confirm) {
    const onSuggest = async (slot) => {
        const end = new Date(new Date(slot.start).getTime() + 3600000).toISOString();
        const res = await fetch(`/api/group-work/projects/${projectId}/suggestions/`, { method: "POST", headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ start_time: slot.start, end_time: end }) });
        if (res.ok) fetchAvail();
    };
    const onDelete = (id) => fetch(`/api/group-work/suggestions/${id}/`, { method: "DELETE", headers: getAuthHeaders() }).then((res) => res.ok && fetchAvail());
    const handleDelete = async (id) => {
        if (await confirm({ title: "Delete Suggestion", message: "Delete this meeting suggestion?", confirmText: "Delete", isDanger: true })) onDelete(id);
    };
    return { onSuggest, handleDelete };
}

function useAvailabilityActions(projectId, fetchAvail, confirm) {
    const { onSuggest, handleDelete } = useSuggestionActions(projectId, fetchAvail, confirm);
    const handleVote = async (id, status) => {
        const res = await fetch(`/api/group-work/suggestions/${id}/respond/`, { method: "POST", headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        if (res.ok) fetchAvail();
    };
    return { handleSuggestTime: onSuggest, handleDelete, handleVote };
}

function useAvailability(projectId, confirm) {
    const { data, fetchAvail, loading } = useAvailabilityData(projectId);
    const actions = useAvailabilityActions(projectId, fetchAvail, confirm);
    const [suggestingSlot, setSuggestingSlot] = useState(null);
    const suggest = (slot) => actions.handleSuggestTime(slot).then(() => setSuggestingSlot(null));
    return { ...data, loading, suggestingSlot, setSuggestingSlot, ...actions, handleSuggestTime: suggest };
}

export default function AvailabilityTab({ projectId }) {
    const confirm = useConfirm();
    const { suggestions, active_suggestions, current_user_id, loading, suggestingSlot, setSuggestingSlot, handleSuggestTime, handleDelete, handleVote } = useAvailability(projectId, confirm);
    const { proposedSuggestions, confirmedSuggestions } = useMemo(() => {
        const sorted = [...(active_suggestions || [])].sort((a, b) => new Date(a.start) - new Date(b.start));
        return { confirmedSuggestions: sorted.filter((s) => s.is_confirmed), proposedSuggestions: sorted.filter((s) => !s.is_confirmed) };
    }, [active_suggestions]);
    const [activeMeetingView, setActiveMeetingView] = useState("proposed");
    const [hasChosenMeetingView, setHasChosenMeetingView] = useState(false);
    useEffect(() => {
        if (hasChosenMeetingView) return;
        if (!proposedSuggestions.length && confirmedSuggestions.length > 0) setActiveMeetingView("confirmed");
    }, [confirmedSuggestions.length, hasChosenMeetingView, proposedSuggestions.length]);

    if (loading) return <div className={styles.loading}>Analysing member calendars...</div>;

    const hasMeetingCards = proposedSuggestions.length > 0 || confirmedSuggestions.length > 0;

    return (
        <div className={styles.container}>
            <AvailabilityHeader hasMeetingCards={hasMeetingCards} activeView={activeMeetingView} onViewChange={(v) => { setHasChosenMeetingView(true); setActiveMeetingView(v); }} proposedCount={proposedSuggestions.length} confirmedCount={confirmedSuggestions.length} />
            {hasMeetingCards ? <MeetingCardsSection activeView={activeMeetingView} proposedSuggestions={proposedSuggestions} confirmedSuggestions={confirmedSuggestions} currentUserId={current_user_id} onVote={handleVote} onDelete={handleDelete} /> : null}
            {activeMeetingView !== "confirmed" ? (
                <>
                    <div className={styles.slotList}>{suggestions.map((slot) => <SlotRow key={slot.start} slot={slot} onClick={() => setSuggestingSlot(slot)} />)}</div>
                    <SuggestionModal slot={suggestingSlot} onCancel={() => setSuggestingSlot(null)} onConfirm={handleSuggestTime} />
                    <AvailabilityFooter />
                </>
            ) : null}
        </div>
    );
}
