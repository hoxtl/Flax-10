import React, { useMemo } from "react";
import styles from "./TaskTimelineView.module.css";

// Helper to determine week/day index
// We'll anchor the timeline to "this week's Monday"
function getTimelineAnchor() {
    const now = new Date();
    const day = now.getDay() || 7; // make Sunday = 7
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function TaskTimelineView({ tasks, members, onUpdate }) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const anchorMonday = useMemo(() => getTimelineAnchor(), []);

    // Generate 3 weeks starting from anchorMonday
    const weeks = useMemo(() => {
        return [0, 1, 2].map(offset => {
            const start = new Date(anchorMonday.getTime() + offset * WEEK_MS);
            const end = new Date(start.getTime() + 5 * DAY_MS); // Saturday

            const startStr = start.toLocaleString('en-US', { month: 'short', day: 'numeric' });
            const endStr = end.toLocaleString('en-US', { month: 'short', day: 'numeric' });

            return {
                id: offset,
                label: `Week ${offset + 1} (${startStr}–${endStr})`,
                startTs: start.getTime(),
                endTs: end.getTime() + DAY_MS // Up to Sunday start
            };
        });
    }, [anchorMonday]);

    const colors = {
        urgent: { bg: "#f9a8c9", border: "#f472a8", text: "#9b2257" },
        high: { bg: "#fcd5a8", border: "#f4a872", text: "#9b5a22" },
        medium: { bg: "#f5e6a3", border: "#e8d660", text: "#7a6a1a" },
        low: { bg: "#b8e8c8", border: "#60d888", text: "#1a6a3a" },
    };

    // Calculate dynamic weeks from the current tasks
    const placedTasks = useMemo(() => {
        const layout = [
            [[], [], [], [], [], []],
            [[], [], [], [], [], []],
            [[], [], [], [], [], []]
        ];

        tasks.forEach(t => {
            if (!t.due_date) return;
            const ts = new Date(t.due_date).getTime();

            // Find which week it falls in
            let weekIdx = -1;
            for (let i = 0; i < weeks.length; i++) {
                if (ts >= weeks[i].startTs && ts < weeks[i].endTs) {
                    weekIdx = i;
                    break;
                }
            }

            if (weekIdx !== -1) {
                const dayOfWeek = (new Date(ts).getDay() + 6) % 7; // Monday = 0
                if (dayOfWeek < 6) { // Mon-Sat only
                    layout[weekIdx][dayOfWeek].push(t);
                }
            }
        });
        return layout;
    }, [tasks, weeks]);

    return (
        <div style={{ background: "#faf7f2", borderRadius: 16, border: "1px solid #e8e0d4", overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "180px repeat(6, 1fr)", borderBottom: "1.5px solid #e0d8cc" }}>
                <div style={{ padding: "14px 20px", fontWeight: 700, fontSize: 12, color: "#8a7a6a", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif", background: "#f2ede5" }} />
                {days.map(d => (
                    <div key={d} style={{ padding: "14px 0", textAlign: "center", fontWeight: 700, fontSize: 12, color: "#6b5e50", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif", background: "#f2ede5", borderLeft: "1px solid #e8e0d4" }}>{d}</div>
                ))}
            </div>

            {weeks.map((wk, wi) => (
                <div key={wi}>
                    {/* Week label */}
                    <div style={{ padding: "10px 20px", fontSize: 11, fontWeight: 700, color: "#9b8a78", letterSpacing: "0.08em", background: "#f7f3ed", borderBottom: "1px solid #ede6dc", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>
                        {wk.label}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "180px repeat(6, 1fr)", minHeight: 80 }}>
                        {/* Row content */}
                        <div style={{ borderRight: "1px solid #ede6dc", background: "#faf7f2" }} />
                        {days.map((_, di) => {
                            const cellTasks = placedTasks[wi][di] || [];
                            return (
                                <div key={di} style={{ borderLeft: "1px solid #ede6dc", padding: "8px 6px", display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid #ede6dc" }}>
                                    {cellTasks.map(t => {
                                        const c = colors[(t.priority || "medium").toLowerCase()] || colors.medium;
                                        return (
                                            <div key={t.id} className={styles.timelineCard} style={{ background: c.bg, border: `1.5px solid ${c.border}` }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: c.text, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, lineHeight: 1.3 }}>{t.title}</div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontSize: 9, fontWeight: 800, color: c.text, opacity: 0.75, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>{t.priority || "MEDIUM"}</span>
                                                    <div style={{ display: "flex" }}>
                                                        {(t.assignees_info || []).slice(0, 2).map((a, i) => (
                                                            <div key={a.id} className={styles.avatarMini} style={{ marginLeft: i > 0 ? -6 : 0 }}>
                                                                {(a.name || "?").slice(0, 2).toUpperCase()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
