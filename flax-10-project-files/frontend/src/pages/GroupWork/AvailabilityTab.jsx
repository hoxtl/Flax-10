import { useState, useEffect } from "react";
import { getAuthHeaders } from "./groupWorkHooks";
import { Check, X, Star } from "lucide-react";
import styles from "./AvailabilityTab.module.css";

const USER_COLORS = ["#d4850a", "#4a7c59", "#b04b4b", "#5a4b81", "#4b8178", "#816d4b", "#4b6181"];
const getUserColor = (userId) => {
    if (!userId) return USER_COLORS[0];
    return USER_COLORS[userId % USER_COLORS.length];
};

export default function AvailabilityTab({ projectId }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const res = await fetch(`/api/group-work/projects/${projectId}/availability/`, {
                    headers: getAuthHeaders(),
                });
                if (!res.ok) throw new Error("Failed to fetch availability");
                const data = await res.json();
                setSuggestions(data.suggestions || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [projectId]);

    if (loading) {
        return <div className={styles.loading}>Analyzing member calendars...</div>;
    }

    if (error) {
        return <div className={styles.empty}>Error: {error}</div>;
    }

    if (suggestions.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No suitable meeting slots found for the next 7 days.</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Best times to meet</h3>
                <p className={styles.subtitle}>
                    Pulled from each member's calendar — green means everyone is free.
                </p>
            </div>

            <div className={styles.slotList}>
                {suggestions.map((slot, idx) => (
                    <div key={idx} className={styles.slotRow}>
                        <div className={styles.timeLabel}>{slot.label}</div>

                        <div className={styles.memberList}>
                            {slot.members.map((m) => {
                                const userColor = getUserColor(m.id);
                                const isFree = m.is_free;
                                const hasData = m.has_data;

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

            <div className={styles.footer}>
                <Star size={12} className={styles.starIcon} fill="currentColor" />
                <span>= all members available · Click a slot to suggest a meeting time to your group</span>
            </div>
        </div>
    );
}
