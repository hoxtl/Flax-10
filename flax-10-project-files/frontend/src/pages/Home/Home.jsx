import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import styles from "./Home.module.css";
import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import analyticsService from "../../api/analyticsService";
import {
  useCalendar,
  useCalendarDispatch,
  useEventModal,
} from "../../context/CalendarContext";
import { useCalendarEvents, useEventActions } from "../../components/Calendar/hooks/useCalendarEvents";
import { fetchTasks, updateTask } from "../../api/taskService";
import DateNavigator from "../../components/Home/DateNavigator";
import { useTags } from "../../context/TagContext";
import { useNavigate } from "react-router-dom";
import DeadlinesWidget from "../../components/Modules/DeadlinesWidget";
import { InsightsPanel } from "../../components/Analytics/AIInsightsTab";

const PRIORITY_COLOURS = {
  urgent: "var(--danger)",
  high: "#f59e0b",
  medium: "var(--primary)",
  low: "var(--muted)",
};

/** Format a datetime string as HH:MM (GB). */
function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Convert minutes to a human duration label. */
function fmtDuration(mins) {
  if (mins == null) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Returns true if `now` is between start and end (inclusive). */
function isNow(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const now = new Date();
  return new Date(startStr) <= now && now <= new Date(endStr);
}

/** Returns true if endStr is before now. */
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

/** Inserts “gap” entries between items when the free time is >= 30 mins. */
function computeTimelineWithGaps(sortedItems) {
  const result = [];
  for (let i = 0; i < sortedItems.length; i++) {
    result.push({ type: "item", data: sortedItems[i] });

    if (i < sortedItems.length - 1) {
      const curEnd = new Date(sortedItems[i].end_time || sortedItems[i].due_date || sortedItems[i].start_time);
      const nextStart = new Date(sortedItems[i + 1].start_time || sortedItems[i + 1].due_date);
      const gapMins = Math.round((nextStart - curEnd) / 60000);
      if (gapMins >= 30) result.push({ type: "gap", minutes: gapMins });
    }
  }
  return result;
}

/** Loads events (context) + tasks (API) and derives date-specific slices. */
function useHomeData(selectedDate) {
  const { events } = useCalendar();
  const [tasks, setTasks] = useState([]);
  useCalendarEvents();

  useEffect(() => {
    fetchTasks()
      .then((data) => setTasks(data.filter((t) => !t.completed)))
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
  const isTask = item._type === "task";
  const start = new Date(item.start_time || item.due_date);
  const end = item.end_time ? new Date(item.end_time) : null;
  const durationMins = end ? Math.round((end - start) / 60000) : null;

  const active = !isTask && isNow(item.start_time, item.end_time);
  const lect = !isTask && isLecture(item);
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
              {isTask && <span className={styles.taskPill}>Task</span>}
              <span className={styles.detailTime}>
                {formatTime(item.start_time || item.due_date)}
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

          {isTask && item.priority && (
            <div className={styles.detailRow}>
              <span className={styles.detailRowLabel}>Priority</span>
              <span
                className={styles.detailRowText}
                style={{
                  color: PRIORITY_COLOURS[item.priority],
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
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

function TflStatus() {
  return (
    <span className={styles.tflBadge} title="TfL status — live integration coming soon">
      <span className={styles.tflDot} />
      <span className={styles.tflLabel}>TfL</span>
    </span>
  );
}

function TimelineRow({ item, isFirst, isLast, onDelete, onEdit, onToggle }) {
  const { getTag } = useTags();
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);

  const isTask = item._type === "task";
  const theme =
    (!isTask && getTag(item.tag)) || {
      color: isTask ? PRIORITY_COLOURS[item.priority] : "#94A3B8",
      icon: "📅",
    };

  const icon = isTask ? "🎯" : resolveEventIcon(item, theme.icon);
  const active = !isTask && isNow(item.start_time, item.end_time);
  const past = !active && isPast(item.end_time || item.due_date);
  const lect = !isTask && isLecture(item);

  const accentColor = isTask ? PRIORITY_COLOURS[item.priority] : theme.color;

  const startTime = formatTime(item.start_time || item.due_date);
  const endTime = !isTask ? formatTime(item.end_time) : null;

  const durationMins =
    !isTask && item.end_time
      ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000)
      : null;

  const modCode = lect
    ? item.module_code ||
      extractModuleCode(item.title) ||
      extractModuleCode(item.description)
    : null;

  const modName = lect ? item.description : null;

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <>
      <div className={`${styles.timelineRow} ${active ? styles.rowActive : ""} ${past ? styles.rowPast : ""}`}>
        <div className={styles.spine}>
          <div className={styles.spineTime}>{startTime}</div>
          <div className={styles.spineTrack}>
            <div className={styles.spineLine} style={{ background: isFirst ? "transparent" : "var(--border)" }} />
            <div className={styles.spineNode} style={{ background: past ? "var(--border)" : accentColor }} />
            <div className={styles.spineLine} style={{ background: isLast ? "transparent" : "var(--border)" }} />
          </div>
        </div>

        <div
          className={`${styles.card} ${active ? styles.cardActive : ""} ${past ? styles.cardPast : ""}`}
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
                {endTime && <span className={styles.cardTime}>{startTime}–{endTime}</span>}
                {durationMins > 0 && <span className={styles.cardDur}>{fmtDuration(durationMins)}</span>}
                {active && <span className={styles.nowBadge}>Now</span>}

                {isTask && item.priority && (
                  <span className={styles.priorityBadge} style={{ color: PRIORITY_COLOURS[item.priority] }}>
                    {item.priority}
                  </span>
                )}
              </div>

              <span className={styles.cardTitle}>{item.title}</span>

              {lect && (modCode || modName) && (
                <span className={styles.cardSub}>
                  {modCode && <strong>{modCode}</strong>}
                  {modCode && modName && " · "}
                  {modName}
                </span>
              )}

              {isTask && item.module_code && <span className={styles.cardSub}>{item.module_code}</span>}

              {lect && item.location && (
                <span className={styles.cardLocation}>
                  <span className={styles.locationText}>{item.location.split(",")[0]}</span>
                  <TflStatus />
                </span>
              )}
            </div>
          </div>

          {isTask && (
            <button
              className={styles.checkBtn}
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.(item.id);
              }}
              title="Mark complete"
            >
              <span className={styles.checkInner} />
            </button>
          )}
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

function FreeGap({ minutes, pendingTasks }) {
  const nav = useNavigate();

  const suggestedTask = useMemo(() => {
    if (!pendingTasks?.length) return null;
    return (
      pendingTasks.find((t) => {
        const estMins = (t.estimated_blocks || 0) * 25;
        return estMins === 0 || estMins <= minutes;
      }) || null
    );
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
            {suggestedTask ? (
              <>
                {" "}
                · slot in <strong>{suggestedTask.title}?</strong>
              </>
            ) : (
              " · slot anything?"
            )}
          </span>
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

function MiniStat({ label, value }) {
  return (
    <div className={styles.miniStat}>
      <span className={styles.miniStatLabel}>{label}</span>
      <span className={styles.miniStatValue}>{value}</span>
    </div>
  );
}

function HomeStatsPills({ data }) {
  const streak = data?.current_streak ?? data?.streak ?? 0;
  const todayMins =
    data?.today_minutes ??
    data?.today_work_minutes ??
    data?.today_total_minutes ??
    null;

  const consistency = data?.consistency_score ?? data?.consistency ?? null;

  const todayLabel = todayMins == null ? "—" : fmtDuration(todayMins);
  const consistencyLabel = consistency == null ? "—" : `${Math.round(consistency)}%`;

  return (
    <div className={styles.pillsRow}>
      <MiniStat label="Today" value={todayLabel} />
      <MiniStat label="Streak" value={`${streak}d`} />
      <MiniStat label="Consistency" value={consistencyLabel} />
    </div>
  );
}

function StatsBar() {
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsService.getSummary(7).then(setData).catch(() => {});
  }, []);

  return (
    <div className={styles.statsBar}>
      <HomeStatsPills data={data} />
      <button className={styles.statLink} onClick={() => nav("/analytics")}>
        Full analytics →
      </button>
    </div>
  );
}

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
      .sort((a, b) => (p[a.priority] - p[b.priority]) || (new Date(a.due_date || 0) - new Date(b.due_date || 0)))
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className={styles.taskWidget}>
      <div className={styles.taskWidgetHeader}>
        <span className={styles.taskWidgetTitle}>Today's tasks</span>
        <button className={styles.taskWidgetLink} onClick={() => nav("/tasks")}>
          All tasks →
        </button>
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

function StudyCoachPanel() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getAiInsights(30);
      setInsights(res.insights);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <InsightsPanel
      insights={insights}
      loading={loading}
      onGenerate={generate}
      period={30}
    />
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

  const { dayEvents, dayTasks, allTasks, toggleTask } = useHomeData(selectedDate);

  const setSelectedDate = (date) =>
    dispatch({ type: "SET_SELECTED_DATE", payload: date });

  const scheduleTitle = isToday(selectedDate) ? "Today's schedule" : "Schedule";

  const sortedEvents = useMemo(() => {
    return [...dayEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [dayEvents]);

  const sortedTasks = useMemo(() => {
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...dayTasks].sort((a, b) => p[a.priority] - p[b.priority]);
  }, [dayTasks]);

  const timelineItems = useMemo(() => {
    const events = sortedEvents.map((e) => ({ ...e, _type: "event" }));
    const tasks = sortedTasks.map((t) => ({ ...t, _type: "task" }));
    const merged = [...events, ...tasks];

    return merged.sort((a, b) => {
      const aTime = new Date(a.start_time || a.due_date || 0);
      const bTime = new Date(b.start_time || b.due_date || 0);
      return aTime - bTime;
    });
  }, [sortedEvents, sortedTasks]);

  const now = new Date();

  const pastItems = useMemo(() => {
    return timelineItems.filter((it) => {
      const end = it.end_time || it.due_date || it.start_time;
      if (!end) return false;
      return new Date(end) < now && !isNow(it.start_time, it.end_time);
    });
  }, [timelineItems, now]);

  const upcomingItems = useMemo(() => {
    return timelineItems.filter((it) => !pastItems.includes(it));
  }, [timelineItems, pastItems]);

  const upcomingTimeline = useMemo(() => computeTimelineWithGaps(upcomingItems), [upcomingItems]);
  const upcomingItemEntries = upcomingTimeline.filter((e) => e.type === "item");

  const hasUpcoming = upcomingItems.length > 0;

  const widgetTasks = isToday(selectedDate) ? dayTasks : allTasks.slice(0, 5);

  return (
    <div className={styles.page}>
      <DateNavigator
        date={selectedDate}
        onChange={setSelectedDate}
        scheduleTitle={scheduleTitle}
      />

      <details className={styles.deadlinesDetails}>
        <summary className={styles.deadlinesSummary}>
          Upcoming deadlines
          <span className={styles.deadlinesHint}>View</span>
        </summary>
        <div className={styles.deadlinesBody}>
          <DeadlinesWidget />
        </div>
      </details>

      <StatsBar />

      <div className={styles.mainLayout}>
        <div className={styles.timeline}>
          {pastItems.length > 0 && (
            <details className={styles.pastDetails}>
              <summary className={styles.pastSummary}>
                Earlier today <span className={styles.pastCount}>({pastItems.length})</span>
                <span className={styles.pastHint}>Collapse</span>
              </summary>

              <div className={styles.pastBody}>
                {pastItems.map((item, idx) => (
                  <TimelineRow
                    key={`${item._type}-${item.id}`}
                    item={item}
                    isFirst={idx === 0}
                    isLast={idx === pastItems.length - 1}
                    onDelete={removeEvent}
                    onEdit={(ev) => openModal(ev, ev.tag)}
                    onToggle={toggleTask}
                  />
                ))}
              </div>
            </details>
          )}

          {!hasUpcoming && <EmptyDay />}

          {hasUpcoming &&
            upcomingTimeline.map((entry, i) => {
              if (entry.type === "gap") {
                return (
                  <FreeGap
                    key={`gap-${i}`}
                    minutes={entry.minutes}
                    pendingTasks={sortedTasks}
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
                  onToggle={toggleTask}
                />
              );
            })}
        </div>

        <aside className={styles.rightSidebar}>
          <TaskWidget tasks={widgetTasks} />

          <div className={styles.coachPromo}>
            <div className={styles.coachPromoTitle}>✨ Want a personalised schedule?</div>
            <div className={styles.coachPromoText}>
              Use Study Coach to generate a plan based on your streak, peak hours, and deadlines.
            </div>
          </div>

          <div className={styles.coachCard}>
            <div className={styles.coachCardHeader}>
              <div>
                <div className={styles.coachCardTitle}>Study Analysis</div>
                <div className={styles.coachCardSub}>Last 30 days · AI generated</div>
              </div>
            </div>
            <div className={styles.coachCardBody}>
              <StudyCoachPanel />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}