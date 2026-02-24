// Home.jsx
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import styles from "./Home.module.css";
import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import {
  useCalendar,
  useCalendarDispatch,
  useEventModal,
} from "../../context/CalendarContext";
import {
  useCalendarEvents,
  useEventActions,
} from "../../components/Calendar/hooks/useCalendarEvents";
import { fetchTasks, updateTask } from "../../api/taskService";
import DateNavigator from "../../components/Home/DateNavigator";
import { useTags } from "../../context/TagContext";
import { useNavigate, Link } from "react-router-dom";
import DeadlinesWidget from "../../components/Modules/DeadlinesWidget";
import HomeStudyCoachCard from "../../components/Home/HomeStudyCoachCard";

const PRIORITY_COLOURS = {
  urgent: "var(--danger)",
  high: "#f59e0b",
  medium: "var(--primary)",
  low: "var(--muted)",
};

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(mins) {
  if (mins == null) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function isNow(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const now = new Date();
  return new Date(startStr) <= now && now <= new Date(endStr);
}

function isPast(endStr) {
  if (!endStr) return false;
  return new Date(endStr) < new Date();
}

function isLecture(item) {
  const t = (item.title || "").toLowerCase();
  return (
    t.includes("lecture") ||
    t.includes("seminar") ||
    t.includes("tutorial") ||
    item.source === "timetable"
  );
}

function extractModuleCode(str) {
  const match = (str || "").match(/\b([A-Z]{2,3}\d{4})\b/);
  return match ? match[1] : null;
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
      const curEnd = new Date(
        sortedItems[i].end_time || sortedItems[i].start_time
      );
      const nextStart = new Date(sortedItems[i + 1].start_time);
      const gapMins = Math.round((nextStart - curEnd) / 60000);
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
      .then((data) => setTasks((data || []).filter((t) => !t.completed)))
      .catch(() => {});
  }, []);

  const dayEvents = useMemo(() => {
    return events.filter((e) =>
      overlapsDay(new Date(e.start_time), new Date(e.end_time), selectedDate)
    );
  }, [events, selectedDate]);

  const dayTasks = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const todayEnd = new Date(selectedDate);
    todayEnd.setHours(23, 59, 59, 999);

    return tasks.filter((t) => {
      if (!t.due_date) return false;
      return new Date(t.due_date) <= todayEnd;
    });
  }, [tasks, selectedDate]);

  const toggleTask = async (id) => {
    try {
      await updateTask(id, { completed: true });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silent
    }
  };

  return { dayEvents, dayTasks, allTasks: tasks, toggleTask };
}

function DetailOverlay({ item, icon, accentColor, onClose }) {
  const start = new Date(item.start_time);
  const end = item.end_time ? new Date(item.end_time) : null;
  const durationMins = end ? Math.round((end - start) / 60000) : null;

  const active = isNow(item.start_time, item.end_time);
  const lect = isLecture(item);
  const modCode = lect
    ? (item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description))
    : null;

  return (
    <div className={styles.overlayBackdrop} onMouseDown={onClose}>
      <div className={styles.detailCard} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.detailTop} style={{ background: `${accentColor}18` }}>
          <div className={styles.detailIconLarge} style={{ background: `${accentColor}28` }}>
            {icon}
          </div>

          <div className={styles.detailTopText}>
            <div className={styles.detailMeta}>
              {active && <span className={styles.nowPill}>Now</span>}
              <span className={styles.detailTime}>
                {formatTime(item.start_time)}
                {end ? ` – ${formatTime(item.end_time)}` : ""}
              </span>
              {durationMins > 0 && <span className={styles.detailDur}>{fmtDuration(durationMins)}</span>}
            </div>
            <h2 className={styles.detailTitle}>{item.title}</h2>
          </div>

          <button className={styles.detailClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.detailBody}>
          {lect && (modCode || item.description) && (
            <div className={styles.detailRow}>
              <span className={styles.detailRowLabel}>Module</span>
              <span className={styles.detailRowText}>
                {modCode && <strong>{modCode}</strong>}
                {modCode && item.description && " · "}
                {item.description}
              </span>
            </div>
          )}

          {!lect && item.description && (
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
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className={styles.contextMenu} style={{ top: y, left: x }}>
      <button
        className={styles.contextItem}
        onClick={() => {
          onEdit(item);
          onClose();
        }}
      >
        ✏️ Edit
      </button>
      <div className={styles.contextDivider} />
      <button
        className={`${styles.contextItem} ${styles.contextDelete}`}
        onClick={() => {
          onDelete(item.id);
          onClose();
        }}
      >
        🗑️ Delete
      </button>
    </div>
  );
}

/** Events-only timeline row (no tasks in spine; no location/details shown on the card) */
function TimelineRow({ item, isFirst, isLast, onDelete, onEdit }) {
  const { getTag } = useTags();
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);

  const theme =
    (getTag(item.tag) || {
      color: "#94A3B8",
      icon: "📅",
    });

  const icon = resolveEventIcon(item, theme.icon);
  const active = isNow(item.start_time, item.end_time);
  const past = !active && isPast(item.end_time);
  const lect = isLecture(item);

  const accentColor = theme.color;

  const startTime = formatTime(item.start_time);
  const endTime = formatTime(item.end_time);

  const durationMins =
    item.end_time ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000) : null;

  const modCode = lect
    ? item.module_code ||
      extractModuleCode(item.title) ||
      extractModuleCode(item.description)
    : null;

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <>
      <div className={`${styles.timelineRow} ${past ? styles.rowPast : ""}`}>
        <div className={styles.spine}>
          <div className={styles.spineTime}>{startTime}</div>
          <div className={styles.spineTrack}>
            <div className={styles.spineLine} style={{ background: isFirst ? "transparent" : "var(--border)" }} />
            <div className={styles.spineNode} style={{ background: past ? "var(--border)" : accentColor }} />
            <div className={styles.spineLine} style={{ background: isLast ? "transparent" : "var(--border)" }} />
          </div>
        </div>

        <div
          className={`${styles.card} ${past ? styles.cardPast : ""} ${active ? styles.cardActive : ""}`}
          style={active ? { borderColor: accentColor } : {}}
          onClick={() => setShowDetail(true)}
          onContextMenu={handleContextMenu}
        >
          <div className={styles.cardLeft}>
            <div className={styles.cardIcon} style={{ background: past ? "var(--hover)" : `${accentColor}20` }}>
              {icon}
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardMeta}>
                <span className={styles.cardTime}>{startTime}–{endTime}</span>
                {durationMins > 0 && <span className={styles.cardDur}>{fmtDuration(durationMins)}</span>}
                {active && <span className={styles.nowBadge}>Now</span>}
              </div>

              <span className={styles.cardTitle}>{item.title}</span>

              {/* keep it minimal: module code only (no location/description on the card) */}
              {lect && modCode && (
                <span className={styles.cardSub}>
                  <strong>{modCode}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <DetailOverlay
          item={item}
          icon={icon}
          accentColor={accentColor}
          onClose={() => setShowDetail(false)}
        />
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}

function pickSuggestedTask(pendingTasks, minutes) {
  if (!pendingTasks?.length) return null;

  const p = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...pendingTasks].sort(
    (a, b) =>
      (p[a.priority] - p[b.priority]) ||
      (new Date(a.due_date || 0) - new Date(b.due_date || 0))
  );

  // pick first that fits, otherwise top priority anyway
  const fit = sorted.find((t) => {
    const estMins = (t.estimated_blocks || 0) * 25;
    return estMins === 0 || estMins <= minutes;
  });

  return fit || sorted[0] || null;
}

function getGapGuidance({ minutes, pendingTasks, longBlocksSoFar }) {
  const hasUrgent =
    (pendingTasks || []).some((t) => (t.priority || "").toLowerCase() === "urgent");

  // “multiple long blocks today” → suggest rest for long gaps
  const shouldRest = longBlocksSoFar >= 2;

  if (minutes < 30) {
    return {
      label: "Quick admin",
      tone: "neutral",
      suggestion: "Do a tiny win: plan next block, reply to 1 email, tidy notes.",
    };
  }

  if (minutes <= 90) {
    return {
      label: "Focus block",
      tone: "focus",
      suggestion: "One focused session (25–50m) + short break.",
    };
  }

  // > 90
  if (shouldRest && !hasUrgent) {
    return {
      label: "Recharge",
      tone: "rest",
      suggestion: "Take a proper break: walk, food, reset — then come back sharper.",
    };
  }

  if (hasUrgent) {
    return {
      label: "Deep work",
      tone: "focus",
      suggestion: "Two focus blocks (2×25m) + break — prioritise urgent work.",
    };
  }

  return {
    label: "Deep work",
    tone: "focus",
    suggestion: "Use this for a longer study block or assignment progress.",
  };
}

function FreeGap({ minutes, pendingTasks, longBlocksSoFar }) {
  const nav = useNavigate();

  const suggestedTask = useMemo(
    () => pickSuggestedTask(pendingTasks, minutes),
    [pendingTasks, minutes]
  );

  const guidance = useMemo(
    () => getGapGuidance({ minutes, pendingTasks, longBlocksSoFar }),
    [minutes, pendingTasks, longBlocksSoFar]
  );

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
            <span className={styles.freeLabel}>{guidance.label} · </span>
            You have <strong>{fmtDuration(minutes)} free</strong>
            {suggestedTask ? (
              <>
                {" "}
                · try <strong>{suggestedTask.title}</strong>
              </>
            ) : null}
          </span>
          <div className={styles.freeHint}>{guidance.suggestion}</div>
        </div>

        <div className={styles.freeActions}>
          <button className={styles.freeBtn} onClick={() => nav("/tasks")}>
            Tasks
          </button>
        </div>
      </div>
    </div>
  );
}

/* Task widget (top-right) */
function TaskWidgetRow({ task }) {
  const color = PRIORITY_COLOURS[task.priority] || "var(--muted)";
  const estMins = task.estimated_blocks ? task.estimated_blocks * 25 : null;

  return (
    <div className={styles.twRow}>
      <div className={styles.twLeft}>
        <span className={styles.twDot} style={{ background: color }} />
        <div className={styles.twBody}>
          <span className={styles.twTitle}>{task.title}</span>
          <span className={styles.twMeta}>
            {task.module_code && <span className={styles.twModule}>{task.module_code}</span>}
            {estMins ? <span className={styles.twTime}>{fmtDuration(estMins)}</span> : null}
          </span>
        </div>
      </div>
    </div>
  );
}

function TaskWidget({ tasks }) {
  const nav = useNavigate();

  const topTasks = useMemo(() => {
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...(tasks || [])]
      .sort(
        (a, b) =>
          (p[a.priority] - p[b.priority]) ||
          (new Date(a.due_date || 0) - new Date(b.due_date || 0))
      )
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className={styles.taskWidget}>
      <div className={styles.taskWidgetHeader}>
        <span className={styles.taskWidgetTitle}>Today’s tasks</span>
        <Link className={styles.taskWidgetLink} to="/tasks">
          All tasks →
        </Link>
      </div>

      {topTasks.length === 0 ? (
        <div className={styles.taskWidgetEmpty}>
          <span className={styles.taskWidgetEmptyIcon}>🎉</span>
          <p className={styles.taskWidgetEmptyText}>Nothing due today.</p>
          <button className={styles.taskWidgetEmptyBtn} onClick={() => nav("/tasks")}>
            Get ahead →
          </button>
        </div>
      ) : (
        <div className={styles.taskWidgetList}>
          {topTasks.map((task) => (
            <TaskWidgetRow key={task.id} task={task} />
          ))}
        </div>
      )}
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

  const { dayEvents, dayTasks, allTasks } = useHomeData(selectedDate);

  const setSelectedDate = (date) =>
    dispatch({ type: "SET_SELECTED_DATE", payload: date });

  const scheduleTitle = isToday(selectedDate) ? "Today’s schedule" : "Schedule";

  const sortedEvents = useMemo(() => {
    return [...dayEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [dayEvents]);

  // used for free-gap suggestions + widget
  const sortedTasks = useMemo(() => {
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...dayTasks].sort((a, b) => p[a.priority] - p[b.priority]);
  }, [dayTasks]);

  // ✅ events only (no tasks in spine)
  const timelineItems = useMemo(() => {
    return [...sortedEvents].map((e) => ({ ...e, _type: "event" }));
  }, [sortedEvents]);

  const now = new Date();

  const pastItems = useMemo(() => {
    return timelineItems.filter((it) => {
      const end = it.end_time || it.start_time;
      if (!end) return false;
      return new Date(end) < now && !isNow(it.start_time, it.end_time);
    });
  }, [timelineItems, now]);

  const upcomingItems = useMemo(() => {
    const pastIds = new Set(pastItems.map((x) => `${x._type}:${x.id}`));
    return timelineItems.filter((it) => !pastIds.has(`${it._type}:${it.id}`));
  }, [timelineItems, pastItems]);

  const upcomingTimeline = useMemo(
    () => computeTimelineWithGaps(upcomingItems),
    [upcomingItems]
  );
  const upcomingItemEntries = upcomingTimeline.filter((e) => e.type === "item");

  const widgetTasks = isToday(selectedDate) ? dayTasks : allTasks.slice(0, 5);

  const longBlocksSoFar = useMemo(() => {
    // count “long” events (>= 90m) in the day as a rough fatigue signal
    return (sortedEvents || []).reduce((acc, e) => {
      if (!e.start_time || !e.end_time) return acc;
      const mins = Math.round((new Date(e.end_time) - new Date(e.start_time)) / 60000);
      return acc + (mins >= 90 ? 1 : 0);
    }, 0);
  }, [sortedEvents]);

  return (
    <div className={styles.page}>
      <DateNavigator
        date={selectedDate}
        onChange={setSelectedDate}
        scheduleTitle={scheduleTitle}
      />

      <div className={styles.topWidgetsBar}>
        <DeadlinesWidget mode="list" limit={3} showViewAll />
        <TaskWidget tasks={widgetTasks} />
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.timeline}>
          <div className={styles.timelineBox}>
            <div className={styles.timelineHeader}>
              <h3 className={styles.timelineTitle}>Your plan for the day</h3>
              <span className={styles.timelineSub}>
                {isToday(selectedDate) ? "Keep it realistic — protect your focus blocks." : "Preview & adjust."}
              </span>
            </div>

            {pastItems.length > 0 && (
              <div className={styles.pastDetails}>
                <div className={styles.pastSummary}>
                  <span>
                    Earlier today <span className={styles.pastCount}>({pastItems.length})</span>
                  </span>
                </div>

                <div className={styles.pastBody}>
                  {pastItems.map((item, idx) => (
                    <TimelineRow
                      key={`${item._type}-${item.id}`}
                      item={item}
                      isFirst={idx === 0}
                      isLast={idx === pastItems.length - 1}
                      onDelete={removeEvent}
                      onEdit={(ev) => openModal(ev, ev.tag)}
                    />
                  ))}
                </div>
              </div>
            )}

            {timelineItems.length === 0 && <EmptyDay />}

            {upcomingTimeline.length > 0 &&
              upcomingTimeline.map((entry, i) => {
                if (entry.type === "gap") {
                  return (
                    <FreeGap
                      key={`gap-${i}`}
                      minutes={entry.minutes}
                      pendingTasks={sortedTasks}
                      longBlocksSoFar={longBlocksSoFar}
                    />
                  );
                }

                const item = entry.data;
                const itemIndex = upcomingItemEntries.findIndex((e) => e === entry);

                return (
                  <TimelineRow
                    key={`${item._type}-${item.id}`}
                    item={item}
                    isFirst={itemIndex === 0}
                    isLast={itemIndex === upcomingItemEntries.length - 1}
                    onDelete={removeEvent}
                    onEdit={(ev) => openModal(ev, ev.tag)}
                  />
                );
              })}
          </div>
        </div>

        <aside className={styles.rightSidebar}>
          <div className={styles.aiCoachWrap}>
            <HomeStudyCoachCard days={7} />
          </div>
        </aside>
      </div>
    </div>
  );
}