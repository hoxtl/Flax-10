import { useState, useEffect } from "react";
import { getAuthHeaders } from "./groupWorkHooks";
import { Check, X, Star, Trash2 } from "lucide-react";
import styles from "./AvailabilityTab.module.css";

const USER_COLORS = ["#d4850a", "#4a7c59", "#b04b4b", "#5a4b81", "#4b8178", "#816d4b", "#4b6181"];
const getUserColor = (userId) => {
    if (!userId) return USER_COLORS[0];
    return USER_COLORS[userId % USER_COLORS.length];
};

export default function AvailabilityTab({ projectId }) {
    const [suggestions, setSuggestions] = useState([]);
    const [activeSuggestions, setActiveSuggestions] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [suggestingSlot, setSuggestingSlot] = useState(null);

    const fetchAvailability = async () => {
        try {
            const res = await fetch(`/api/group-work/projects/${projectId}/availability/`, {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to fetch availability");
            const data = await res.json();
            setCurrentUserId(data.current_user_id || null);
            setSuggestions(data.suggestions || []);
            setActiveSuggestions(data.active_suggestions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, [projectId]);

    const handleSuggestTime = async (slot) => {
        const endTime = new Date(new Date(slot.start).getTime() + 60 * 60 * 1000).toISOString();
        try {
            const res = await fetch(`/api/group-work/projects/${projectId}/suggestions/`, {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    start_time: slot.start,
                    end_time: endTime,
                }),
            });
            if (!res.ok) throw new Error("Failed to create suggestion");
            setSuggestingSlot(null);
            fetchAvailability();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteSuggestion = async (suggestionId) => {
        if (!window.confirm("Are you sure you want to delete this suggestion?")) return;
        try {
            const res = await fetch(`/api/group-work/suggestions/${suggestionId}/`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to delete suggestion");
            fetchAvailability();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleVote = async (suggestionId, status) => {
        try {
            const res = await fetch(`/api/group-work/suggestions/${suggestionId}/respond/`, {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to record vote");
            fetchAvailability();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Analyzing member calendars...</div>;
    }

    // Sort active suggestions by time
    const sortedActive = [...activeSuggestions].sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <div className={styles.container}>
            {sortedActive.length > 0 && (
                <div className={styles.activeSection}>
                    <h4 className={styles.sectionTitle}>Proposed Meetings</h4>
                    {sortedActive.map((s) => {
                        const dateLabel = new Date(s.start).toLocaleString([], {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit'
                        });
                        const accepted = s.responses.filter(r => r.status === 'accepted');
                        const rejected = s.responses.filter(r => r.status === 'rejected');

                        return (
                            <div key={s.id} className={styles.suggestionCard}>
                                <div className={styles.suggestionInfo}>
                                    <div className={styles.suggestionTitle}>{dateLabel}</div>
                                    <div className={styles.suggestionMeta}>Proposed by {s.suggested_by.username}</div>
                                    <div className={styles.votes}>
                                        <span className={styles.voteCount} title={`${accepted.length} accepted`}>
                                            <Check size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} /> {accepted.length}
                                        </span>
                                        <span className={styles.voteSeparator}>·</span>
                                        <span className={styles.voteCount} title={`${rejected.length} rejected`}>
                                            <X size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} /> {rejected.length}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.suggestionActions}>
                                    <button
                                        onClick={() => handleVote(s.id, 'accepted')}
                                        className={styles.acceptBtn}
                                        title="Accept"
                                    >
                                        <Check size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleVote(s.id, 'rejected')}
                                        className={styles.rejectBtn}
                                        title="Reject"
                                    >
                                        <X size={20} />
                                    </button>
                                    {s.suggested_by.id === currentUserId && (
                                        <button
                                            onClick={() => handleDeleteSuggestion(s.id)}
                                            className={styles.deleteBtn}
                                            title="Delete Suggestion"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={styles.header}>
                <h3 className={styles.title}>Best times to meet</h3>
                <p className={styles.subtitle}>
                    Click a slot below to suggest it to the group.
                </p>
            </div>

            <div className={styles.slotList}>
                {suggestions.map((slot, idx) => (
                    <div
                        key={idx}
                        className={styles.slotRow}
                        onClick={() => setSuggestingSlot(slot)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.timeLabel}>
                            {slot.label}
                            {slot.free_count === slot.total_count && (
                                <Star
                                    size={14}
                                    className={styles.bestTimeStar}
                                    fill="currentColor"
                                />
                            )}
                        </div>

                        <div className={styles.memberList}>
                            {slot.members.map((m) => {
                                const userColor = getUserColor(m.id);
                                const isFree = m.is_free;

                                return (
                                    <div
                                        key={m.id}
                                        className={`${styles.avatar} ${isFree ? styles.avatarFree : styles.avatarBusy}`}
                                        style={isFree ? { backgroundColor: userColor, borderColor: userColor } : {}}
                                        title={`${m.name} is ${isFree ? 'free' : 'busy'}`}
                                    >
                                        <span className={styles.avatarName}>{m.initials}</span>
                                        <span className={styles.statusIcon}>
                                            {isFree ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={`${styles.scoreLabel} ${slot.free_count === slot.total_count ? styles.scoreLabelHighlight : ""}`}>
                            {slot.free_count}/{slot.total_count} free
                        </div>
                    </div>
                ))}
            </div>

            {suggestingSlot && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h4>Suggest {suggestingSlot.label}?</h4>
                        <p>This will notify all members and allow them to vote.</p>
                        <div className={styles.modalButtons}>
                            <button onClick={() => setSuggestingSlot(null)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={() => handleSuggestTime(suggestingSlot)} className={styles.confirmBtn}>Suggest Time</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.footer}>
                <Star size={12} className={styles.starIcon} fill="currentColor" />
                <span>= all members available · Suggested times will notify the group</span>
            </div>
        </div>
    );
}
