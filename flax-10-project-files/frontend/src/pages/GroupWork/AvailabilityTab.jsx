import { useState, useEffect } from "react";
import { Check, X, Star, Trash2 } from "lucide-react";
import { getAuthHeaders } from "./groupWorkHooks";
import { useConfirm } from "../../context/ConfirmContext";
import { getUserColor } from "./utils/priorityUtils";
import styles from "./AvailabilityTab.module.css";

// --- Sub-components ---

function AvailabilityHeader() {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}>Best times to meet</h3>
            <p className={styles.subtitle}>Click a slot below to suggest it to the group.</p>
        </div>
    );
}

function AvailabilityFooter() {
    return (
        <div className={styles.footer}>
            <Star size={12} className={styles.starIcon} fill="currentColor" />
            <span>= all members available · Suggested times will notify the group</span>
        </div>
    );
}

function MeetingVoteCount({ count, icon: Icon, title }) {
    return <span className={styles.voteCount} title={title}><Icon size={14} /> {count}</span>;
}

function MeetingCardActions({ s, currentUserId, onVote, onDelete }) {
    return (
        <div className={styles.suggestionActions}>
            <button onClick={() => onVote(s.id, 'accepted')} className={styles.acceptBtn}><Check size={20} /></button>
            <button onClick={() => onVote(s.id, 'rejected')} className={styles.rejectBtn}><X size={20} /></button>
            {s.suggested_by.id === currentUserId && <button onClick={() => onDelete(s.id)} className={styles.deleteBtn}><Trash2 size={20} /></button>}
        </div>
    );
}

function ProposedMeetingCard({ s, currentUserId, onVote, onDelete }) {
    const dateLabel = new Date(s.start).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const accepted = s.responses.filter(r => r.status === 'accepted').length;
    const rejected = s.responses.filter(r => r.status === 'rejected').length;

    return (
        <div className={styles.suggestionCard}>
            <div className={styles.suggestionInfo}>
                <div className={styles.suggestionTitle}>{dateLabel}</div>
                <div className={styles.suggestionMeta}>Proposed by {s.suggested_by.username}</div>
                <div className={styles.votes}>
                    <MeetingVoteCount count={accepted} icon={Check} title={`${accepted} accepted`} />
                    <span className={styles.voteSeparator}>·</span>
                    <MeetingVoteCount count={rejected} icon={X} title={`${rejected} rejected`} />
                </div>
            </div>
            <MeetingCardActions s={s} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />
        </div>
    );
}

function ProposedMeetings({ suggestions, currentUserId, onVote, onDelete }) {
    if (suggestions.length === 0) return null;
    const sorted = [...suggestions].sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <div className={styles.activeSection}>
            <h4 className={styles.sectionTitle}>Proposed Meetings</h4>
            {sorted.map(s => <ProposedMeetingCard key={s.id} s={s} currentUserId={currentUserId} onVote={onVote} onDelete={onDelete} />)}
        </div>
    );
}

function MemberAvatar({ m }) {
    const color = getUserColor(m.id);
    const st = m.is_free ? { backgroundColor: color, borderColor: color } : {};
    return (
        <div className={`${styles.avatar} ${m.is_free ? styles.avatarFree : styles.avatarBusy}`} style={st} title={`${m.name} is ${m.is_free ? 'free' : 'busy'}`}>
            <span className={styles.avatarName}>{m.initials}</span>
            <span className={styles.statusIcon}>{m.is_free ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}</span>
        </div>
    );
}

function SlotRow({ slot, onClick }) {
    const isBest = slot.free_count === slot.total_count;
    return (
        <div className={styles.slotRow} onClick={onClick} style={{ cursor: 'pointer' }}>
            <div className={styles.timeLabel}>
                {slot.label}
                {isBest && <Star size={14} className={styles.bestTimeStar} fill="currentColor" />}
            </div>
            <div className={styles.memberList}>{slot.members.map(m => <MemberAvatar key={m.id} m={m} />)}</div>
            <div className={`${styles.scoreLabel} ${isBest ? styles.scoreLabelHighlight : ""}`}>{slot.free_count}/{slot.total_count} free</div>
        </div>
    );
}

import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";

function SuggestionModal({ slot, onCancel, onConfirm }) {
    if (!slot) return null;
    return (
        <ConfirmModal
            title={`Suggest ${slot.label}?`}
            message="This will notify all members and allow them to vote."
            onConfirm={() => onConfirm(slot)}
            onCancel={onCancel}
            confirmText="Suggest Time"
        />
    );
}

// --- Logic Hook ---

function useAvailabilityData(pid) {
    const [data, setData] = useState({ suggestions: [], active_suggestions: [], current_user_id: null });
    const [loading, setLoading] = useState(true);
    const fetchAvail = () => {
        fetch(`/api/group-work/projects/${pid}/availability/`, { headers: getAuthHeaders() })
            .then(res => res.ok ? res.json() : null)
            .then(d => d && setData(d))
            .finally(() => setLoading(false));
    };
    useEffect(() => { fetchAvail(); }, [pid]);
    return { data, fetchAvail, loading };
}

function useSuggestionActions(pid, fetchAvail, confirm) {
    const onSuggest = async (slot) => {
        const end = new Date(new Date(slot.start).getTime() + 3600000).toISOString();
        const res = await fetch(`/api/group-work/projects/${pid}/suggestions/`, { method: "POST", headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ start_time: slot.start, end_time: end }) });
        if (res.ok) fetchAvail();
    };
    const onDelete = (id) => fetch(`/api/group-work/suggestions/${id}/`, { method: "DELETE", headers: getAuthHeaders() }).then(res => res.ok && fetchAvail());
    const handleDelete = async (id) => {
        const conf = { title: "Delete Suggestion", message: "Delete this meeting suggestion?", confirmText: "Delete", isDanger: true };
        if (await confirm(conf)) onDelete(id);
    };
    return { onSuggest, handleDelete };
}

function useAvailabilityActions(pid, fetchAvail, confirm) {
    const { onSuggest, handleDelete } = useSuggestionActions(pid, fetchAvail, confirm);
    const handleVote = async (id, status) => {
        const res = await fetch(`/api/group-work/suggestions/${id}/respond/`, { method: "POST", headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        if (res.ok) fetchAvail();
    };
    return { handleSuggestTime: onSuggest, handleDelete, handleVote };
}

function useAvailability(pid, confirm) {
    const { data, fetchAvail, loading } = useAvailabilityData(pid);
    const acts = useAvailabilityActions(pid, fetchAvail, confirm);
    const [suggestingSlot, setSuggestingSlot] = useState(null);
    const suggest = (s) => acts.handleSuggestTime(s).then(() => setSuggestingSlot(null));
    return { ...data, loading, suggestingSlot, setSuggestingSlot, ...acts, handleSuggestTime: suggest };
}

// --- Main Component ---

export default function AvailabilityTab({ projectId }) {
    const confirm = useConfirm();
    const { suggestions, active_suggestions, current_user_id, loading, suggestingSlot, setSuggestingSlot, handleSuggestTime, handleDelete, handleVote } = useAvailability(projectId, confirm);

    if (loading) return <div className={styles.loading}>Analyzing member calendars...</div>;

    return (
        <div style={{ marginTop: 24 }}>
            <ProposedMeetings suggestions={active_suggestions} currentUserId={current_user_id} onVote={handleVote} onDelete={handleDelete} />
            <AvailabilityHeader />
            <div className={styles.slotList}>{suggestions.map((s, i) => <SlotRow key={i} slot={s} onClick={() => setSuggestingSlot(s)} />)}</div>
            <SuggestionModal slot={suggestingSlot} onCancel={() => setSuggestingSlot(null)} onConfirm={handleSuggestTime} />
            <AvailabilityFooter />
        </div>
    );
}
