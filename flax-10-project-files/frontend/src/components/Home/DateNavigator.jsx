import { useMemo } from "react";
import styles from "./DateNavigator.module.css";
import { useCalendar } from "../../context/CalendarContext";

function startOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth()    === b.getMonth()    &&
        a.getDate()     === b.getDate()
    );
}

const DAY_LABELS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
];

// Categorise an event into a dot colour bucket based on title/source
function eventDotColor(event) {
    const t = (event.title || "").toLowerCase();
    const src = (event.source || "").toLowerCase();

    if (t.includes("lecture") || t.includes("seminar") || t.includes("tutorial") || src === "timetable")
        return "lecture";       // blue
    if (t === "breakfast" || t === "lunch" || t === "dinner")
        return "meal";          // warm amber
    if (t.includes("gym") || t.includes("run") || t.includes("yoga") || t.includes("sport") || t.includes("walk"))
        return "health";        // green
    if (t.includes("deadline") || t.includes("submission") || t.includes("exam"))
        return "deadline";      // red
    return "personal";          // primary/caramel
}

const DOT_COLORS = {
    lecture:  "var(--dot-lecture)",
    meal:     "var(--dot-meal)",
    health:   "var(--dot-health)",
    deadline: "var(--dot-deadline)",
    personal: "var(--primary)",
};

export default function DateNavigator({ date, onChange, scheduleTitle }) {
    const { events } = useCalendar();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = useMemo(() => startOfWeek(date), [date]);

    const days = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return d;
        }),
        [weekStart]
    );

    // Map date string → up to 4 categorised dot colours (deduplicated by category)
    const dotMap = useMemo(() => {
        const map = {};
        for (const ev of events) {
            const key = new Date(ev.start_time).toDateString();
            if (!map[key]) map[key] = new Map();
            const cat = eventDotColor(ev);
            // One dot per category per day keeps it tidy
            if (!map[key].has(cat)) map[key].set(cat, DOT_COLORS[cat]);
        }
        // Convert to arrays, max 4 dots
        const result = {};
        for (const [key, catMap] of Object.entries(map)) {
            result[key] = [...catMap.values()].slice(0, 4);
        }
        return result;
    }, [events]);

    const prevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        onChange(d);
    };

    const nextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        onChange(d);
    };

    const monthLabel = useMemo(() => {
        const first = days[0], last = days[6];
        if (first.getMonth() === last.getMonth())
            return `${MONTH_LABELS[first.getMonth()]} ${first.getFullYear()}`;
        return `${MONTH_LABELS[first.getMonth()]} / ${MONTH_LABELS[last.getMonth()]} ${last.getFullYear()}`;
    }, [days]);

    const isCurrentWeek = isSameDay(weekStart, startOfWeek(today));

    return (
        <div className={styles.nav}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.monthLabel}>{monthLabel}</span>
                    {scheduleTitle && <span className={styles.scheduleLabel}>{scheduleTitle}</span>}
                </div>
                <div className={styles.headerRight}>
                    {!isCurrentWeek && (
                        <button className={styles.todayBtn} onClick={() => onChange(new Date())}>Today</button>
                    )}
                    <button className={styles.arrowBtn} onClick={prevWeek} aria-label="Previous week">‹</button>
                    <button className={styles.arrowBtn} onClick={nextWeek} aria-label="Next week">›</button>
                </div>
            </div>

            <div className={styles.strip}>
                {days.map((d) => {
                    const isSelected = isSameDay(d, date);
                    const isToday    = isSameDay(d, today);
                    const dots       = dotMap[d.toDateString()] || [];

                    return (
                        <button
                            key={d.toISOString()}
                            className={[
                                styles.dayCell,
                                isSelected ? styles.dayCellSelected : "",
                                isToday && !isSelected ? styles.dayCellToday : "",
                            ].join(" ")}
                            onClick={() => onChange(new Date(d))}
                        >
                            <span className={styles.dayName}>{DAY_LABELS[d.getDay()]}</span>
                            <span className={styles.dayNum}>{d.getDate()}</span>
                            <div className={styles.dots}>
                                {dots.map((color, i) => (
                                    <span
                                        key={i}
                                        className={styles.dot}
                                        style={{ background: isSelected ? "rgba(255,255,255,0.8)" : color }}
                                    />
                                ))}
                                {dots.length === 0 && <span className={styles.dotPlaceholder} />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}