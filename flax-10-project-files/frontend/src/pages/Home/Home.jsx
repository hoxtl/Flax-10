import { useState, useMemo, useEffect } from "react";
import styles from "./Home.module.css";
import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { useCalendarEvents, useEventActions } from "../../components/Calendar/hooks/useCalendarEvents";
import { fetchTasks, updateTask } from "../../api/taskService";
import DateNavigator from "../../components/Home/DateNavigator";
import { useTags } from "../../context/TagContext";

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
            const due = new Date(t.due_date);
            return due <= todayEnd;
        });
    }, [tasks, selectedDate]);

    const toggleTask = async (id) => {
        await updateTask(id, { completed: true });
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return { dayEvents, dayTasks, toggleTask };
}

function EventRow({ event, onDelete, onEdit }) {
    const { getTag } = useTags();
    const theme = getTag(event.tag) || { color: "#94A3B8", icon: "📅" };
    const isOverdue = new Date(event.end_time) < new Date();
    return (
        <div className={styles.row} onClick={() => onEdit?.(event)}>
            <div className={styles.timeCol}>
                <span className={styles.time}>{formatTime(event.start_time)}</span>
                <span className={styles.timeSep}>–</span>
                <span className={styles.time}>{formatTime(event.end_time)}</span>
            </div>
            <div className={styles.accent} style={{ background: theme.color }} />
            <div className={styles.icon} style={{ background: theme.color + "22" }}>
                {theme.icon}
            </div>
            <div className={styles.info}>
                <span className={styles.rowTitle} style={{ opacity: isOverdue ? 0.5 : 1 }}>
                    {event.title}
                </span>
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
            <div className={styles.timeCol}>
                <span className={styles.time}>{formatTime(task.due_date)}</span>
                <span className={styles.taskLabel}>due</span>
            </div>
            <div className={styles.accent} style={{ background: PRIORITY_COLOURS[task.priority] }} />
            <div className={styles.icon} style={{ background: PRIORITY_COLOURS[task.priority] + "22" }}>
                ✓
            </div>
            <div className={styles.info}>
                <span className={styles.rowTitle}>
                    {task.title}
                </span>
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

    const hasContent = sortedEvents.length > 0 || sortedTasks.length > 0;

    return (
        <div className={styles.page}>
            <DateNavigator date={selectedDate} onChange={setSelectedDate} scheduleTitle={scheduleTitle} />
            <div className={styles.timeline}>
                {!hasContent && <EmptyDay />}
                {sortedEvents.length > 0 && (
                    <>
                        <SectionLabel label="Schedule" />
                        {sortedEvents.map(e => (
                            <EventRow
                                key={e.id}
                                event={e}
                                onDelete={removeEvent}
                                onEdit={(ev) => openModal(ev, ev.tag)}
                            />
                        ))}
                    </>
                )}
                {sortedTasks.length > 0 && (
                    <>
                        <SectionLabel label={isToday(selectedDate) ? "Due Today" : "Tasks"} />
                        {sortedTasks.map(t => (
                            <TaskRow key={t.id} task={t} onToggle={toggleTask} />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}