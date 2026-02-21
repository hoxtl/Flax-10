import { useState, useMemo, useEffect } from "react";
import styles from "./Home.module.css";
import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { useCalendarEvents, useEventActions } from "../../components/Calendar/hooks/useCalendarEvents";
import { fetchTasks, updateTask } from "../../api/taskService";
import DateNavigator from "../../components/Home/DateNavigator";
import { useTags } from "../../context/TagContext";
import { useNavigate } from "react-router-dom";

const PRIORITY_COLOURS = {
    urgent: "var(--danger)",
    high: "#f59e0b",
    medium: "var(--primary)",
    low: "var(--muted)",
};

function formatTime(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(mins) {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

function isNow(startStr, endStr) {
    const now = new Date();
    return new Date(startStr) <= now && now <= new Date(endStr);
}

// Smart icon resolver 
function resolveEventIcon(event, tagIcon) {
    const t = (event.title || "").toLowerCase();
    const src = (event.source || "").toLowerCase();

    if (t.includes("lecture"))                                              return "📖";
    if (t.includes("seminar") || t.includes("tutorial"))                   return "📖";
    if (t.includes("workshop"))                                            return "🛠️";
    if (t.includes("dentist"))                                             return "🦷";
    if (t.includes("gp") || t.includes("doctor") || t.includes("appointment")) return "🩺";
    if (t.includes("hospital"))                                            return "🏥";
    if (t.includes("gym") || t.includes("sport"))                          return "🏋️";
    if (t.includes("run") || t.includes("jog"))                            return "🏃";
    if (t.includes("yoga"))                                                return "🧘";
    if (t.includes("walk"))                                                return "🚶";
    if (t.includes("coffee") || t.includes("costa") || t.includes("pret")) return "☕";
    if (t.includes("lunch"))                                               return "🥗";
    if (t.includes("dinner") || t.includes("brunch"))                      return "🍽️";
    if (t.includes("drink") || t.includes("pub"))                          return "🍻";
    if (t.includes("call") || t.includes("facetime") || t.includes("phone")) return "📞";
    if (t.includes("meeting") || t.includes("group project"))              return "🤝";
    if (t.includes("shop") || t.includes("tesco") || t.includes("lidl"))  return "🛒";
    if (t.includes("laundry"))                                             return "🫧";
    if (t.includes("clean"))                                               return "🧹";
    if (t.includes("bike") || t.includes("cycling"))                       return "🚲";
    if (t.includes("study") || t.includes("revision") || t.includes("library") || t.includes("mock")) return "📚";
    if (t.includes("deadline") || t.includes("submission"))                return "⚠️";
    if (src === "timetable")                                               return "📖";
    if (tagIcon && tagIcon !== "📅")                                       return tagIcon;
    return "📅";
}

// Detect free gaps >= 30 min between consecutive time-sorted items 
function computeTimelineWithGaps(sortedItems) {
    const result = [];
    for (let i = 0; i < sortedItems.length; i++) {
        result.push({ type: "item", data: sortedItems[i] });
        if (i < sortedItems.length - 1) {
            const endCurrent = new Date(sortedItems[i].end_time || sortedItems[i].start_time || sortedItems[i].due_date);
            const startNext  = new Date(sortedItems[i + 1].start_time || sortedItems[i + 1].due_date);
            const gapMins    = Math.round((startNext - endCurrent) / 60000);
            if (gapMins >= 30) result.push({ type: "gap", minutes: gapMins });
        }
    }
    return result;
}

function useHomeData(selectedDate) {
    const { events } = useCalendar();
    const [tasks, setTasks] = useState([]);
    useCalendarEvents();

    useEffect(() => {
        fetchTasks()
            .then(data => setTasks(data.filter(t => !t.completed)))
            .catch(() => {});
    }, []);

    const dayEvents = useMemo(() =>
        events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), selectedDate)),
        [events, selectedDate]
    );

    const dayTasks = useMemo(() => {
        if (!isToday(selectedDate)) return [];
        const todayEnd = new Date(selectedDate);
        todayEnd.setHours(23, 59, 59, 999);
        return tasks.filter(t => {
            if (!t.due_date) return false;
            return new Date(t.due_date) <= todayEnd;
        });
    }, [tasks, selectedDate]);

    const toggleTask = async (id) => {
        await updateTask(id, { completed: true });
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return { dayEvents, dayTasks, toggleTask };
}

// Row components
function EventRow({ event, onDelete, onEdit }) {
    const { getTag } = useTags();
    const theme  = getTag(event.tag) || { color: "#94A3B8", icon: "📅" };
    const icon   = resolveEventIcon(event, theme.icon);
    const active = isNow(event.start_time, event.end_time);
    const isOverdue = new Date(event.end_time) < new Date();

    return (
        <div className={`${styles.row} ${active ? styles.rowActive : ""}`} onClick={() => onEdit?.(event)}>
            <div className={styles.accent} style={{ background: theme.color }} />
            <div className={styles.timeCol}>
                <span className={styles.time}>{formatTime(event.start_time)}</span>
                <span className={styles.timeSep}>–</span>
                <span className={styles.time}>{formatTime(event.end_time)}</span>
            </div>
            <div className={styles.icon} style={{ background: theme.color + "22" }}>
                {icon}
            </div>
            <div className={styles.info}>
                <div className={styles.titleRow}>
                    <span className={styles.rowTitle} style={{ opacity: isOverdue ? 0.5 : 1 }}>
                        {event.title}
                    </span>
                    {active && <span className={styles.nowBadge}>Now</span>}
                </div>
                {event.location && (
                    <span className={styles.rowMeta}>📍 {event.location}</span>
                )}
            </div>
            <button className={styles.deleteBtn}
                onClick={ev => { ev.stopPropagation(); onDelete?.(event.id); }}>×</button>
        </div>
    );
}

function TaskRow({ task, onToggle }) {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
    return (
        <div className={styles.row}>
            <div className={styles.accent} style={{ background: PRIORITY_COLOURS[task.priority] }} />
            <div className={styles.timeCol}>
                <span className={styles.time}>{formatTime(task.due_date)}</span>
                <span className={styles.taskLabel}>due</span>
            </div>
            {/* Tasks always show 🎯 so they're visually distinct from calendar events */}
            <div className={styles.icon} style={{ background: PRIORITY_COLOURS[task.priority] + "22" }}>
                🎯
            </div>
            <div className={styles.info}>
                <span className={styles.rowTitle}>{task.title}</span>
                <div className={styles.rowMetaRow}>
                    <span style={{ color: PRIORITY_COLOURS[task.priority] }} className={styles.rowMeta}>
                        ● {task.priority}
                    </span>
                    {task.module_code && <span className={styles.modulePill}>{task.module_code}</span>}
                    {isOverdue && <span className={styles.overduePill}>Overdue</span>}
                </div>
            </div>
            <button className={styles.checkBtn} onClick={() => onToggle(task.id)}>
                <span className={styles.checkInner} />
            </button>
        </div>
    );
}

function FreeGap({ minutes }) {
    const nav = useNavigate();
    return (
        <div className={styles.freeGap}>
            <span className={styles.freeIcon}>⏱</span>
            <span className={styles.freeText}>
                You have <strong>{fmtDuration(minutes)} free</strong>. Anything you'd like to slot in?
            </span>
            <button className={styles.freeBtn} onClick={() => nav("/tasks")}>
                View tasks
            </button>
        </div>
    );
}

function EmptyDay() {
    return (
        <div className={styles.empty}>
            <span className={styles.emptyIcon}>📭</span>
            <p>Nothing scheduled for this day</p>
        </div>
    );
}

function SectionLabel({ label }) {
    return <div className={styles.sectionLabel}>{label}</div>;
}

// Main
export default function Home() {
    const { selectedDate } = useCalendar();
    const dispatch = useCalendarDispatch();
    const { removeEvent } = useEventActions();
    const { openModal } = useEventModal();
    const { dayEvents, dayTasks, toggleTask } = useHomeData(selectedDate);

    const setSelectedDate = (date) => dispatch({ type: "SET_SELECTED_DATE", payload: date });
    const scheduleTitle = isToday(selectedDate) ? "Today's schedule" : "Schedule";

    const sortedEvents = [...dayEvents].sort((a, b) =>
        new Date(a.start_time) - new Date(b.start_time)
    );

    const sortedTasks = [...dayTasks].sort((a, b) => {
        const p = { urgent: 0, high: 1, medium: 2, low: 3 };
        return p[a.priority] - p[b.priority];
    });

    const allSorted = useMemo(() => {
        const taskItems  = sortedTasks.map(t => ({ ...t, _type: "task",  start_time: t.due_date, end_time: t.due_date }));
        const eventItems = sortedEvents.map(e => ({ ...e, _type: "event" }));
        return [...eventItems, ...taskItems].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }, [sortedEvents, sortedTasks]);

    const timelineWithGaps = useMemo(() => computeTimelineWithGaps(allSorted), [allSorted]);
    const hasContent = sortedEvents.length > 0 || sortedTasks.length > 0;

    return (
        <div className={styles.page}>
            <DateNavigator date={selectedDate} onChange={setSelectedDate} scheduleTitle={scheduleTitle} />
            <div className={styles.timeline}>
                {!hasContent && <EmptyDay />}
                {hasContent && timelineWithGaps.map((entry, i) => {
                    if (entry.type === "gap") return <FreeGap key={`gap-${i}`} minutes={entry.minutes} />;
                    const item = entry.data;
                    if (item._type === "event") {
                        return (
                            <EventRow
                                key={item.id}
                                event={item}
                                onDelete={removeEvent}
                                onEdit={(ev) => openModal(ev, ev.tag)}
                            />
                        );
                    }
                    return <TaskRow key={item.id} task={item} onToggle={toggleTask} />;
                })}
            </div>
        </div>
    );
}