import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import styles from "./Home.module.css";
import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import analyticsService from "../../api/analyticsService";
import { ChatPanel } from "../../components/Analytics/AIInsightsTab";
import SummaryCards from "../../components/Analytics/SummaryCards";
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

function resolveEventIcon(event, tagIcon) {
    const t = (event.title || "").toLowerCase();
    const src = (event.source || "").toLowerCase();
    if (t === "breakfast") return "🌅";
    if (t === "lunch") return "🥗";
    if (t === "dinner") return "🍽️";
    if (t.includes("lecture") || t.includes("seminar") || t.includes("tutorial")) return "📖";
    if (t.includes("practical") || t.includes("lab")) return "🔬";
    if (t.includes("workshop")) return "🛠️";
    if (t.includes("dentist")) return "🦷";
    if (t.includes("gp") || t.includes("doctor") || t.includes("appointment")) return "🩺";
    if (t.includes("gym") || t.includes("sport")) return "🏋️";
    if (t.includes("run") || t.includes("jog")) return "🏃";
    if (t.includes("yoga")) return "🧘";
    if (t.includes("coffee") || t.includes("costa") || t.includes("pret")) return "☕";
    if (t.includes("call") || t.includes("facetime") || t.includes("phone")) return "📞";
    if (t.includes("meeting") || t.includes("group project")) return "🤝";
    if (t.includes("study") || t.includes("revision") || t.includes("library")) return "📚";
    if (t.includes("deadline") || t.includes("submission")) return "⚠️";
    if (src === "timetable") return "📖";
    if (tagIcon && tagIcon !== "📅") return tagIcon;
    return "📅";
}

function computeTimelineWithGaps(sortedItems) {
    const result = [];
    for (let i = 0; i < sortedItems.length; i++) {
        result.push({ type: "item", data: sortedItems[i] });
        if (i < sortedItems.length - 1) {
            const endCur = new Date(sortedItems[i].end_time || sortedItems[i].due_date);
            const startNext = new Date(sortedItems[i + 1].start_time || sortedItems[i + 1].due_date);
            const gapMins = Math.round((startNext - endCur) / 60000);
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
        return tasks.filter(t => t.due_date && new Date(t.due_date) <= todayEnd);
    }, [tasks, selectedDate]);

    const toggleTask = async (id) => {
        await updateTask(id, { completed: true });
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return { dayEvents, dayTasks, toggleTask };
}

function DetailOverlay({ item, icon, accentColor, onClose }) {
    const isTask = item._type === "task";
    const start = new Date(item.start_time || item.due_date);
    const end = item.end_time ? new Date(item.end_time) : null;
    const durationMins = end ? Math.round((end - start) / 60000) : null;
    const active = !isTask && isNow(item.start_time, item.end_time);

    return (
        <div className={styles.overlayBackdrop} onMouseDown={onClose}>
            <div className={styles.detailCard} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.detailTop} style={{ background: accentColor + "18" }}>
                    <div className={styles.detailIconLarge} style={{ background: accentColor + "28" }}>
                        {icon}
                    </div>
                    <div className={styles.detailTopText}>
                        <div className={styles.detailMeta}>
                            {active && <span className={styles.nowPill}>Now</span>}
                            {isTask && <span className={styles.taskPill}>Task</span>}
                            <span className={styles.detailTime}>
                                {formatTime(item.start_time || item.due_date)}
                                {end ? ` – ${formatTime(item.end_time)}` : ""}
                            </span>
                            {durationMins > 0 && (
                                <span className={styles.detailDur}>{fmtDuration(durationMins)}</span>
                            )}
                        </div>
                        <h2 className={styles.detailTitle}>{item.title}</h2>
                    </div>
                    <button className={styles.detailClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.detailBody}>
                    {item.description && (
                        <div className={styles.detailRow}>
                            <span className={styles.detailRowLabel}>Notes</span>
                            <span className={styles.detailRowText}>{item.description}</span>
                        </div>
                    )}
                    {item.location && (
                        <div className={styles.detailRow}>
                            <span className={styles.detailRowLabel}>Where</span>
                            <span className={styles.detailRowText}>{item.location}</span>
                        </div>
                    )}
                    {isTask && item.priority && (
                        <div className={styles.detailRow}>
                            <span className={styles.detailRowLabel}>Priority</span>
                            <span className={styles.detailRowText} style={{ color: PRIORITY_COLOURS[item.priority], fontWeight: 600, textTransform: "capitalize" }}>
                                {item.priority}
                            </span>
                        </div>
                    )}
                    {isTask && item.module_code && (
                        <div className={styles.detailRow}>
                            <span className={styles.detailRowLabel}>Module</span>
                            <span className={styles.detailRowText}>{item.module_code}</span>
                        </div>
                    )}
                    {!item.description && !item.location && (
                        <p className={styles.detailEmpty}>No additional details.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function ContextMenu({ x, y, item, onEdit, onDelete, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div ref={ref} className={styles.contextMenu} style={{ top: y, left: x }}>
            <button className={styles.contextItem} onClick={() => { onEdit(item); onClose(); }}>✏️ Edit</button>
            <div className={styles.contextDivider} />
            <button className={`${styles.contextItem} ${styles.contextDelete}`} onClick={() => { onDelete(item.id); onClose(); }}>🗑️ Delete</button>
        </div>
    );
}

function TimelineRow({ item, isFirst, isLast, onDelete, onEdit, onToggle }) {
    const { getTag } = useTags();
    const [showDetail, setShowDetail] = useState(false);
    const [ctxMenu, setCtxMenu] = useState(null);

    const isTask = item._type === "task";
    const theme = (!isTask && getTag(item.tag)) || { color: isTask ? PRIORITY_COLOURS[item.priority] : "#94A3B8", icon: "📅" };
    const icon = isTask ? "🎯" : resolveEventIcon(item, theme.icon);
    const active = !isTask && isNow(item.start_time, item.end_time);
    const isOverdue = new Date(item.end_time || item.due_date) < new Date();
    const accentColor = isTask ? PRIORITY_COLOURS[item.priority] : theme.color;

    const startTime = formatTime(item.start_time || item.due_date);
    const endTime = !isTask ? formatTime(item.end_time) : null;
    const durationMins = (!isTask && item.end_time)
        ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000)
        : null;

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    }, []);

    return (
        <>
            <div className={`${styles.timelineRow} ${active ? styles.rowActive : ""}`}>
                <div className={styles.spine}>
                    <div className={styles.spineTime}>{startTime}</div>
                    <div className={styles.spineTrack}>
                        <div className={styles.spineLine} style={{ background: isFirst ? "transparent" : "var(--border)" }} />
                        <div className={styles.spineNode} style={{ background: accentColor }} />
                        <div className={styles.spineLine} style={{ background: isLast ? "transparent" : "var(--border)" }} />
                    </div>
                </div>

                <div
                    className={`${styles.card} ${active ? styles.cardActive : ""}`}
                    style={active ? { borderColor: accentColor } : {}}
                    onClick={() => setShowDetail(true)}
                    onContextMenu={handleContextMenu}
                >
                    <div className={styles.cardLeft}>
                        <div className={styles.cardIcon} style={{ background: accentColor + "20" }}>
                            {icon}
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.cardMeta}>
                                {endTime && <span className={styles.cardTime}>{startTime}–{endTime}</span>}
                                {durationMins > 0 && <span className={styles.cardDur}>{fmtDuration(durationMins)}</span>}
                                {active && <span className={styles.nowBadge}>Now</span>}
                                {isTask && item.priority && (
                                    <span className={styles.priorityBadge} style={{ color: PRIORITY_COLOURS[item.priority] }}>
                                        {item.priority}
                                    </span>
                                )}
                            </div>
                            <span className={styles.cardTitle} style={{ opacity: isOverdue && !active ? 0.45 : 1 }}>
                                {item.title}
                            </span>
                            {isTask && item.module_code && (
                                <span className={styles.cardSub}>{item.module_code}</span>
                            )}
                        </div>
                    </div>

                    {isTask && (
                        <button
                            className={styles.checkBtn}
                            onClick={e => { e.stopPropagation(); onToggle?.(item.id); }}
                            title="Mark complete"
                        >
                            <span className={styles.checkInner} />
                        </button>
                    )}
                </div>
            </div>

            {showDetail && (
                <DetailOverlay item={item} icon={icon} accentColor={accentColor} onClose={() => setShowDetail(false)} />
            )}
            {ctxMenu && (
                <ContextMenu x={ctxMenu.x} y={ctxMenu.y} item={item} onEdit={onEdit} onDelete={onDelete} onClose={() => setCtxMenu(null)} />
            )}
        </>
    );
}

function FreeGap({ minutes, pendingTasks }) {
    const nav = useNavigate();
    const suggestedTask = useMemo(() => {
        if (!pendingTasks?.length) return null;
        return pendingTasks.find(t => {
            const estMins = (t.estimated_blocks || 0) * 25;
            return estMins === 0 || estMins <= minutes;
        }) || null;
    }, [pendingTasks, minutes]);

    return (
        <div className={styles.gapRow}>
            <div className={styles.spine}>
                <div className={styles.spineTime} />
                <div className={styles.spineTrack}>
                    <div className={styles.spineLine} />
                    <div className={styles.spineNodeDash} />
                    <div className={styles.spineLine} />
                </div>
            </div>
            <div className={styles.freeGap}>
                <div className={styles.freeLeft}>
                    <span className={styles.freeText}>
                        You have <strong>{fmtDuration(minutes)} free</strong>
                        {suggestedTask ? ` · slot in ${suggestedTask.title}?` : " · slot anything?"}
                    </span>
                </div>
                <div className={styles.freeActions}>
                    {suggestedTask && (
                        <button className={styles.freeStartBtn} onClick={() => nav(`/timer?taskId=${suggestedTask.id}`)}>
                            ▶ Start
                        </button>
                    )}
                    <button className={styles.freeBtn} onClick={() => nav("/tasks")}>Tasks</button>
                </div>
            </div>
        </div>
    );
}

function HomeStatsBar() {
    const nav = useNavigate();
    const [analyticsData, setAnalyticsData] = useState(null);
    useEffect(() => {
        analyticsService.getSummary(7).then(setAnalyticsData).catch(() => {});
    }, []);
    return (
        <div className={styles.statsBar}>
            <div className={styles.statsHeader}>
                <span className={styles.statsTitle}>This week</span>
                <button className={styles.statLink} onClick={() => nav("/analytics")}>Full analytics →</button>
            </div>
            <SummaryCards data={analyticsData} />
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

export default function Home() {
    const { selectedDate } = useCalendar();
    const dispatch = useCalendarDispatch();
    const { removeEvent } = useEventActions();
    const { openModal } = useEventModal();
    const { dayEvents, dayTasks, toggleTask } = useHomeData(selectedDate);

    const setSelectedDate = (date) => dispatch({ type: "SET_SELECTED_DATE", payload: date });
    const scheduleTitle = isToday(selectedDate) ? "Today's schedule" : "Schedule";

    const sortedEvents = [...dayEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const sortedTasks = [...dayTasks].sort((a, b) => {
        const p = { urgent: 0, high: 1, medium: 2, low: 3 };
        return p[a.priority] - p[b.priority];
    });

    const allSorted = useMemo(() => {
        const taskItems = sortedTasks.map(t => ({ ...t, _type: "task", start_time: t.due_date, end_time: t.due_date }));
        const eventItems = sortedEvents.map(e => ({ ...e, _type: "event" }));
        return [...eventItems, ...taskItems].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }, [sortedEvents, sortedTasks]);

    const timelineWithGaps = useMemo(() => computeTimelineWithGaps(allSorted), [allSorted]);
    const itemEntries = timelineWithGaps.filter(e => e.type === "item");
    const hasContent = allSorted.length > 0;

    return (
        <div className={styles.page}>
            <DateNavigator date={selectedDate} onChange={setSelectedDate} scheduleTitle={scheduleTitle} />
            <HomeStatsBar />
            <div className={styles.mainLayout}>
                <div className={styles.timeline}>
                    {!hasContent && <EmptyDay />}
                    {hasContent && timelineWithGaps.map((entry, i) => {
                        if (entry.type === "gap") return (
                            <FreeGap key={`gap-${i}`} minutes={entry.minutes} pendingTasks={sortedTasks} />
                        );
                        const item = entry.data;
                        const itemIndex = itemEntries.findIndex(e => e === entry);
                        return (
                            <TimelineRow
                                key={`${item._type}-${item.id}`}
                                item={item}
                                isFirst={itemIndex === 0}
                                isLast={itemIndex === itemEntries.length - 1}
                                onDelete={removeEvent}
                                onEdit={(ev) => openModal(ev, ev.tag)}
                                onToggle={toggleTask}
                            />
                        );
                    })}
                </div>
                <ChatPanel period={30} />
            </div>
        </div>
    );
}