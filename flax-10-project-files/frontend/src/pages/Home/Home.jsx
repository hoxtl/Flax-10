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
import { createEvent } from "../../api/eventApi";
import DateNavigator from "../../components/Home/DateNavigator";
import { useTags } from "../../context/TagContext";
import { useNavigate, Link } from "react-router-dom";
import { extractBaseEventId } from "../../components/Calendar/utils/eventUtils";
import DeadlinesWidget from "../../components/Modules/DeadlinesWidget";
import HomeStudyCoachCard from "../../components/Home/HomeStudyCoachCard";

const PRIORITY_COLOURS = {
  urgent: "var(--danger)",
  high:   "#f59e0b",
  medium: "var(--primary)",
  low:    "var(--muted)",
};

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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
  return t.includes("lecture") || t.includes("seminar") || t.includes("tutorial") || item.source === "timetable";
}

function extractModuleCode(str) {
  const match = (str || "").match(/\b([A-Z]{2,3}\d{4})\b/);
  return match ? match[1] : null;
}

function resolveEventIcon(event, tagIcon) {
  const t   = (event.title || "").toLowerCase();
  const src = (event.source || "").toLowerCase();
  // Meals
  if (t === "breakfast")                                        return "🌅";
  if (t === "lunch")                                            return "🥗";
  if (t === "dinner")                                           return "🍽️";
  // Academic
  if (t.includes("lecture") || t.includes("seminar") || t.includes("tutorial")) return "📖";
  if (t.includes("practical") || t.includes("lab"))            return "🔬";
  if (t.includes("workshop"))                                   return "🛠️";
  if (t.includes("exam") || t.includes("test"))                return "📝";
  if (t.includes("submission") || t.includes("coursework"))    return "📤";
  if (t.includes("revision") || t.includes("study"))           return "📚";
  if (t.includes("library"))                                    return "📚";
  if (t.includes("group project") || t.includes("group meeting")) return "🤝";
  if (t.includes("presentation") || t.includes("seminar"))     return "🎤";
  // Health
  if (t.includes("dentist"))                                    return "🦷";
  if (t.includes("gp") || t.includes("doctor"))                return "🩺";
  if (t.includes("appointment"))                                return "📋";
  if (t.includes("gym") || t.includes("basketball") || t.includes("sport")) return "🏋️";
  if (t.includes("run") || t.includes("jog"))                  return "🏃";
  if (t.includes("yoga") || t.includes("stretch") || t.includes("meditat")) return "🧘";
  if (t.includes("walk"))                                       return "🚶";
  // Social / life
  if (t.includes("coffee") || t.includes("costa") || t.includes("pret")) return "☕";
  if (t.includes("brunch"))                                     return "🍳";
  if (t.includes("drinks") || t.includes("pub"))                return "🍻";
  if (t.includes("dinner") || t.includes("restaurant"))        return "🍽️";
  if (t.includes("birthday"))                                   return "🎂";
  if (t.includes("cinema") || t.includes("movie"))             return "🎬";
  if (t.includes("facetime") || t.includes("call") || t.includes("phone")) return "📞";
  if (t.includes("meeting"))                                    return "🤝";
  // Errands / admin
  if (t.includes("email") || t.includes("reply"))              return tagIcon && tagIcon !== "📅" ? tagIcon : "📧";
  if (t.includes("shop") || t.includes("tesco") || t.includes("lidl") || t.includes("grocery")) return "🛒";
  if (t.includes("laundry") || t.includes("clean") || t.includes("tidy")) return "🧹";
  if (t.includes("parcel") || t.includes("inpost") || t.includes("delivery")) return "📦";
  if (t.includes("haircut") || t.includes("barber"))           return "✂️";
  if (t.includes("train") || t.includes("travel") || t.includes("journey")) return "🚆";
  if (t.includes("rent") || t.includes("bills") || t.includes("finance")) return "💸";
  if (t.includes("ikea"))                                       return "🪑";
  // Default — use tag icon if meaningful, else calendar
  if (src === "timetable")                                      return "📖";
  if (tagIcon && tagIcon !== "📅")                              return tagIcon;
  return "📅";
}

/* Group overlapping events into clusters, then interleave gaps */
function groupOverlaps(sortedItems) {
  const groups = [];
  let current  = [];
  let clusterEnd = null;

  for (const item of sortedItems) {
    const start = new Date(item.start_time);
    const end   = new Date(item.end_time || item.start_time);
    if (current.length === 0 || start < clusterEnd) {
      current.push(item);
      if (!clusterEnd || end > clusterEnd) clusterEnd = end;
    } else {
      groups.push(current.length === 1 ? { type: "single", item: current[0] } : { type: "cluster", items: current });
      current    = [item];
      clusterEnd = end;
    }
  }
  if (current.length > 0) {
    groups.push(current.length === 1 ? { type: "single", item: current[0] } : { type: "cluster", items: current });
  }
  return groups;
}

function computeTimelineWithGaps(sortedItems, pendingTasks) {
  const grouped = groupOverlaps(sortedItems);
  const result  = [];

  for (let i = 0; i < grouped.length; i++) {
    const g = grouped[i];
    result.push(g.type === "cluster" ? { type: "cluster", items: g.items } : { type: "item", data: g.item });

    if (i < grouped.length - 1) {
      const lastItem  = g.type === "cluster" ? g.items[g.items.length - 1] : g.item;
      const curEnd    = new Date(lastItem.end_time || lastItem.start_time);
      const nextGroup = grouped[i + 1];
      const firstNext = nextGroup.type === "cluster" ? nextGroup.items[0] : nextGroup.item;
      const nextStart = new Date(firstNext.start_time);
      const gapMins   = Math.round((nextStart - curEnd) / 60000);
      if (gapMins >= 30) {
        const fits = (t) => ((t.estimated_blocks || 1) * 25) <= gapMins;
        const suggestedTask = pendingTasks.find(fits) || pendingTasks[0] || null;
        result.push({ type: "gap", minutes: gapMins, gapStart: curEnd, suggestedTask });
      }
    }
  }
  return result;
}

/* ─── Data hook ─────────────────────────────────────────── */
function useHomeData(selectedDate) {
  const { events } = useCalendar();
  const [tasks, setTasks] = useState([]);
  useCalendarEvents();

  useEffect(() => {
    fetchTasks()
      .then((data) => setTasks((data || []).filter((t) => !t.completed)))
      .catch(() => {});
  }, []);

  const dayEvents = useMemo(
    () => events.filter((e) => overlapsDay(new Date(e.start_time), new Date(e.end_time), selectedDate)),
    [events, selectedDate]
  );

  const dayTasks = useMemo(() => {
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return tasks
      .filter((t) => t.due_date && new Date(t.due_date) <= dayEnd)
      .sort((a, b) => (p[a.priority] ?? 4) - (p[b.priority] ?? 4));
  }, [tasks, selectedDate]);

  const removePendingTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { dayEvents, dayTasks, removePendingTask };
}

/* ─── Detail overlay ─────────────────────────────────────── */
function DetailOverlay({ item, icon, accentColor, onClose }) {
  const start        = new Date(item.start_time);
  const end          = item.end_time ? new Date(item.end_time) : null;
  const durationMins = end ? Math.round((end - start) / 60000) : null;
  const active       = isNow(item.start_time, item.end_time);
  const lect         = isLecture(item);
  const modCode      = lect ? (item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description)) : null;

  return (
    <div className={styles.overlayBackdrop} onMouseDown={onClose}>
      <div className={styles.detailCard} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.detailTop} style={{ background: `${accentColor}14` }}>
          <div className={styles.detailIconLarge} style={{ background: `${accentColor}22` }}>{icon}</div>
          <div className={styles.detailTopText}>
            <div className={styles.detailMeta}>
              {active && <span className={styles.nowPill}>Now</span>}
              <span className={styles.detailTime}>
                {formatTime(item.start_time)}{end ? ` – ${formatTime(item.end_time)}` : ""}
              </span>
              {durationMins > 0 && <span className={styles.detailDur}>{fmtDuration(durationMins)}</span>}
            </div>
            <h2 className={styles.detailTitle}>{item.title}</h2>
          </div>
          <button className={styles.detailClose} onClick={onClose}>✕</button>
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

/* ─── Context menu ───────────────────────────────────────── */
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
      <button className={`${styles.contextItem} ${styles.contextDelete}`} onClick={() => { onDelete(item.id); onClose(); }}>
        🗑️ Delete
      </button>
    </div>
  );
}

/* ─── Timeline event card ────────────────────────────────── */
function TimelineRow({ item, isFirst, isLast, onDelete, onEdit, dayTasks }) {
  const { getTag }          = useTags();
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu]       = useState(null);

  const theme       = getTag(item.tag) || { color: "#94A3B8", icon: "📅" };
  const icon        = resolveEventIcon(item, theme.icon);
  const durationMins = item.end_time
    ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000)
    : null;
  const matchTask   = dayTasks?.find((t) => (t.title || "").trim() === (item.title || "").trim());
  const accentColor = matchTask ? (PRIORITY_COLOURS[matchTask.priority] || theme.color) : (theme.color || "#94A3B8");
  const active      = isNow(item.start_time, item.end_time);
  const past        = !active && isPast(item.end_time);
  const lect        = isLecture(item);
  const modCode     = lect ? (item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description)) : null;
  const startTime   = formatTime(item.start_time);
  const endTime     = formatTime(item.end_time);

  const cardHeight = durationMins != null ? Math.max(40, Math.min(180, Math.round(durationMins * 1.8))) : undefined;

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
          style={{ "--card-accent": accentColor, minHeight: cardHeight ? `${cardHeight}px` : undefined }}
          onClick={() => setShowDetail(true)}
          onContextMenu={handleContextMenu}
        >
          <div className={styles.cardIcon} style={{ background: past ? "var(--hover)" : `${accentColor}1A` }}>
            {icon}
          </div>
          <div className={styles.cardBody}>
            <div className={styles.cardMeta}>
              <span className={styles.cardTime}>{startTime}–{endTime}</span>
              {durationMins > 0 && <span className={styles.cardDur}>{fmtDuration(durationMins)}</span>}
              {active && <span className={styles.nowBadge}>Now</span>}
            </div>
            <span className={styles.cardTitle}>{item.title}</span>
            {lect && modCode && <span className={styles.cardSub}>{modCode}</span>}
          </div>
        </div>
      </div>

      {showDetail && (
        <DetailOverlay item={item} icon={icon} accentColor={accentColor} onClose={() => setShowDetail(false)} />
      )}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y} item={item}
          onEdit={onEdit} onDelete={onDelete}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}


/* ─── Overlap cluster (side-by-side cards) ───────────────── */
function OverlapCluster({ items, onDelete, onApplySuggestion }) {
  const { getTag }      = useTags();
  const [expanded,      setExpanded]      = useState(false);
  const [resolveOpen,   setResolveOpen]   = useState(false);
  const [dismissed,     setDismissed]     = useState(false);
  const firstStart      = formatTime(items[0].start_time);

  // Build suggested resolution: keep the longest event, reschedule others sequentially after it
  const resolution = useMemo(() => {
    const sorted  = [...items].sort((a, b) => {
      const durA = new Date(a.end_time) - new Date(a.start_time);
      const durB = new Date(b.end_time) - new Date(b.start_time);
      return durB - durA; // longest first
    });
    const keep  = sorted[0];
    const rest  = sorted.slice(1);
    const suggestions = [];
    let cursor = new Date(keep.end_time);
    for (const ev of rest) {
      const dur = new Date(ev.end_time) - new Date(ev.start_time);
      const newStart = new Date(cursor);
      const newEnd   = new Date(cursor.getTime() + dur);
      suggestions.push({
        event: ev,
        suggestedStart: newStart,
        suggestedEnd:   newEnd,
        label: `${formatTime(newStart.toISOString())}–${formatTime(newEnd.toISOString())}`,
      });
      cursor = newEnd;
    }
    return { keep, suggestions };
  }, [items]);

  return (
    <div className={styles.clusterRow}>
      <div className={styles.spine}>
        <div className={styles.spineTime}>{firstStart}</div>
        <div className={styles.spineTrack}>
          <div className={styles.spineLine} />
          <div className={styles.spineNode} style={{ background: "var(--warning, #f59e0b)" }} />
          <div className={styles.spineLine} />
        </div>
      </div>

      <div className={styles.clusterCards}>
        {/* Header */}
        <div className={styles.overlapHeader}>
          <div className={styles.overlapBadge}>
            ⚡ {items.length} events overlap
          </div>
          <div className={styles.overlapActions}>
            <button
              className={styles.overlapResolveBtn}
              onClick={() => setResolveOpen(r => !r)}
              title="Resolve overlap"
            >
              {resolveOpen ? "Hide suggestions" : "✨ Resolve"}
            </button>
            <button
              className={styles.overlapExpandBtn}
              onClick={() => setExpanded(e => !e)}
              title="Show events"
            >
              {expanded ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {/* Events list */}
        {(expanded || true) && items.map((item) => {
          const theme       = getTag(item.tag) || { color: "#94A3B8", icon: "📅" };
          const icon        = resolveEventIcon(item, theme.icon);
          const accentColor = theme.color || "#94A3B8";
          const durationMins = item.end_time
            ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000)
            : null;
          return (
            <ClusterCard
              key={item.id}
              item={item}
              icon={icon}
              accentColor={accentColor}
              durationMins={durationMins}
              onDelete={onDelete}
            />
          );
        })}

        {/* Resolve panel */}
        {resolveOpen && (
          <div className={styles.resolvePanel}>
            <div className={styles.resolvePanelHeader}>
              <span className={styles.resolvePanelTitle}>✨ Suggested fix</span>
              <span className={styles.resolvePanelSub}>
                Keep <strong>"{resolution.keep.title}"</strong>, reschedule the rest:
              </span>
            </div>
            {resolution.suggestions.map(s => (
              <div key={s.event.id} className={styles.resolveSuggestion}>
                <div className={styles.resolveSuggestLeft}>
                  <span className={styles.resolveName}>{s.event.title}</span>
                  <span className={styles.resolveTime}>{s.label}</span>
                </div>
                <button
                  className={styles.resolveApplyBtn}
                  onClick={() => onApplySuggestion?.(s)}
                >
                  Apply
                </button>
              </div>
            ))}
            <p className={styles.resolvePanelNote}>
              Or right-click any event to edit manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ClusterCard({ item, icon, accentColor, durationMins, onDelete, onEdit }) {
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu]       = useState(null);
  const active = isNow(item.start_time, item.end_time);
  const past   = !active && isPast(item.end_time);

  return (
    <>
      <div
        className={`${styles.card} ${styles.clusterCard} ${past ? styles.cardPast : ""} ${active ? styles.cardActive : ""}`}
        style={{ "--card-accent": accentColor }}
        onClick={() => setShowDetail(true)}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      >
        <div className={styles.cardIcon} style={{ background: `${accentColor}1A` }}>{icon}</div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>
            <span className={styles.cardTime}>{formatTime(item.start_time)}–{formatTime(item.end_time)}</span>
            {durationMins > 0 && <span className={styles.cardDur}>{fmtDuration(durationMins)}</span>}
            {active && <span className={styles.nowBadge}>Now</span>}
          </div>
          <span className={styles.cardTitle}>{item.title}</span>
        </div>
      </div>
      {showDetail && <DetailOverlay item={item} icon={icon} accentColor={accentColor} onClose={() => setShowDetail(false)} />}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} item={item}
          onEdit={onEdit} onDelete={onDelete} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}

/* ─── Free gap with task suggestion ─────────────────────── */
function FreeGap({ minutes, gapStart, suggestedTask, onTaskScheduled, addEvent, onToast }) {
  const [scheduling, setScheduling] = useState(false);
  const [hidden,     setHidden]     = useState(false);

  const handleSchedule = async () => {
    if (!suggestedTask || scheduling || hidden) return;
    setScheduling(true);
    try {
      const estMins   = (suggestedTask.estimated_blocks || 1) * 25;
      const startTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
      const endTime   = new Date(startTime.getTime() + estMins * 60000);

      await addEvent({
        title:       suggestedTask.title,
        start_time:  startTime.toISOString(),
        end_time:    endTime.toISOString(),
        description: suggestedTask.description || "",
      });

      onTaskScheduled?.(suggestedTask.id);
      onToast?.(`"${suggestedTask.title}" added to your plan`);
      setHidden(true);
    } catch {
      onTaskScheduled?.(suggestedTask.id);
      onToast?.(`"${suggestedTask.title}" added to your plan`);
      setHidden(true);
    } finally {
      setScheduling(false);
    }
  };

  // Disappear entirely after scheduling
  if (hidden) return null;

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
            <strong className={styles.freeDur}>{fmtDuration(minutes)} free</strong>
            {suggestedTask ? (
              <> — slot <span className={styles.freeTaskName}>{suggestedTask.title}?</span></>
            ) : (
              " — nothing due yet."
            )}
          </span>
        </div>
        {suggestedTask && (
          <button
            type="button"
            className={styles.freeTick}
            title="Suggest and add to timeline"
            onClick={handleSchedule}
            disabled={scheduling}
          >
            {scheduling ? "…" : "Suggest"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Task widget row ────────────────────────────────────── */
function TaskWidgetRow({ task }) {
  const color   = PRIORITY_COLOURS[task.priority] || "var(--muted)";
  const estMins = task.estimated_blocks ? task.estimated_blocks * 25 : null;

  return (
    <div className={styles.twRow}>
      <div className={styles.twLeft}>
        <span className={styles.twDot} style={{ background: color }} />
        <div className={styles.twBody}>
          <span className={styles.twTitle}>{task.title}</span>
          <div className={styles.twMeta}>
            {task.module_code && <span className={styles.twModule}>{task.module_code}</span>}
            {estMins && <span className={styles.twTime}>{fmtDuration(estMins)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Task widget ────────────────────────────────────────── */
function TaskWidget({ tasks, selectedDate, onViewAllTasks }) {
  const topTasks = useMemo(() => tasks.slice(0, 5), [tasks]);
  const label    = isToday(selectedDate) ? "TODAY'S TASKS" : "TASKS DUE";

  return (
    <div className={styles.taskWidget}>
      <div className={styles.taskWidgetHeader}>
        <span className={styles.taskWidgetTitle}>{label}</span>
        <button
          type="button"
          className={styles.taskWidgetLink}
          onClick={() => onViewAllTasks?.()}
        >
          All tasks →
        </button>
      </div>

      {topTasks.length === 0 ? (
        <div className={styles.taskWidgetEmpty}>
          <span className={styles.taskWidgetEmptyIcon}>🎉</span>
          <p className={styles.taskWidgetEmptyText}>
            {isToday(selectedDate) ? "Nothing due today." : "Nothing due this day."}
          </p>
          <button
            type="button"
            className={styles.taskWidgetEmptyBtn}
            onClick={() => onViewAllTasks?.()}
          >
            View all tasks →
          </button>
        </div>
      ) : (
        <div className={styles.taskWidgetList}>
          {topTasks.map((task) => <TaskWidgetRow key={task.id} task={task} />)}
        </div>
      )}
    </div>
  );
}

/* ─── Empty day ──────────────────────────────────────────── */
function EmptyDay() {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>📭</span>
      <p>Nothing scheduled for this day</p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   HOME PAGE
   ════════════════════════════════════════════════ */
export default function Home({ onNavigate }) {
  const { selectedDate } = useCalendar();
  const dispatch         = useCalendarDispatch();
  const { loadEvents }   = useCalendarEvents();
  const { removeEvent, addEvent, editEvent } = useEventActions();
  const { openModal }    = useEventModal();

  const { dayEvents, dayTasks, removePendingTask } = useHomeData(selectedDate);
  const [toast, setToast] = useState(null);

  // Show toast for 3 seconds
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const setSelectedDate = (date) => dispatch({ type: "SET_SELECTED_DATE", payload: date });

  const scheduleTitle = isToday(selectedDate) ? "Today's schedule" : "Schedule";

  const sortedEvents = useMemo(
    () => [...dayEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    [dayEvents]
  );

  const now = new Date();

  const pastItems = useMemo(
    () => sortedEvents.filter((it) => {
      const end = it.end_time || it.start_time;
      return end && new Date(end) < now && !isNow(it.start_time, it.end_time);
    }),
    [sortedEvents]
  );

  const upcomingItems = useMemo(() => {
    const pastIds = new Set(pastItems.map((x) => x.id));
    return sortedEvents.filter((it) => !pastIds.has(it.id));
  }, [sortedEvents, pastItems]);

  const scheduledTitles = useMemo(
    () => new Set(upcomingItems.map((e) => e.title?.toLowerCase())),
    [upcomingItems]
  );

  const suggestableTasks = useMemo(
    () => dayTasks.filter((t) => !scheduledTitles.has(t.title?.toLowerCase())),
    [dayTasks, scheduledTitles]
  );

  const upcomingTimeline = useMemo(
    () => computeTimelineWithGaps(upcomingItems, suggestableTasks),
    [upcomingItems, suggestableTasks]
  );

  const upcomingItemEntries = upcomingTimeline.filter((e) => e.type === "item" || e.type === "cluster");

  const mustDoTasks = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const todayEnd = new Date(selectedDate);
    todayEnd.setHours(23, 59, 59, 999);
    return dayTasks.filter(
      (t) => t.priority === "urgent" && t.due_date && new Date(t.due_date) <= todayEnd
    );
  }, [dayTasks, selectedDate]);

  return (
    <div className={styles.page}>
      {/* ── Toast banner ── */}
      {toast && (
    <div className={styles.alertToast}>
      <div className={styles.alertContent}>
        <span className={styles.alertIcon}>✓</span>
        <span className={styles.alertMessage}>{toast}</span>
      </div>
      <button className={styles.alertClose} onClick={() => setToast(null)}>✕</button>
    </div>
  )}

      <DateNavigator
        date={selectedDate}
        onChange={setSelectedDate}
        scheduleTitle={scheduleTitle}
      />

      {/* ── Single 2-col layout: left = deadlines + timeline, right = tasks + AI ── */}
      <div className={styles.mainGrid}>
        {/* Left column */}
        <div className={styles.leftCol}>
          <DeadlinesWidget mode="list" limit={3} showViewAll />

          <div className={styles.timelineBox}>
            <div className={styles.timelineHeader}>
              <h3 className={styles.timelineTitle}>YOUR PLAN FOR THE DAY</h3>
              <span className={styles.timelineSub}>
                {isToday(selectedDate)
                  ? "Keep it realistic — protect your focus blocks."
                  : "Preview & adjust."}
              </span>
            </div>

            {mustDoTasks.length > 0 && (
              <div className={styles.mustDoSection}>
                <div className={styles.mustDoLabel}>Must do today</div>
                <div className={styles.mustDoList}>
                  {mustDoTasks.map((task) => (
                    <div key={task.id} className={styles.mustDoItem} style={{ "--priority": PRIORITY_COLOURS[task.priority] || "var(--primary)" }}>
                      <span className={styles.mustDoTitle}>{task.title}</span>
                      {task.estimated_blocks && (
                        <span className={styles.mustDoEst}>{task.estimated_blocks * 25}m</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastItems.length > 0 && (
              <div className={styles.pastDetails}>
                <div className={styles.pastSummary}>
                  Earlier today <span className={styles.pastCount}>({pastItems.length})</span>
                </div>
                <div className={styles.pastBody}>
                  {pastItems.map((item, idx) => (
                    <TimelineRow
                      key={item.id}
                      item={item}
                      dayTasks={dayTasks}
                      isFirst={idx === 0}
                      isLast={idx === pastItems.length - 1}
                      onDelete={removeEvent}
                      onEdit={(ev) => openModal(ev, ev.tag)}
                    />
                  ))}
                </div>
              </div>
            )}

            {sortedEvents.length === 0 && <EmptyDay />}

            {upcomingTimeline.map((entry, i) => {
              if (entry.type === "gap") {
                return (
                  <FreeGap
                    key={`gap-${i}`}
                    minutes={entry.minutes}
                    gapStart={entry.gapStart}
                    suggestedTask={entry.suggestedTask}
                    onTaskScheduled={removePendingTask}
                    addEvent={addEvent}
                    onToast={showToast}
                  />
                );
              }
              if (entry.type === "cluster") {
                return (
                  <OverlapCluster
                    key={`cluster-${i}`}
                    items={entry.items}
                    onDelete={removeEvent}
                    onApplySuggestion={async (suggestion) => {
                      try {
                        const baseId = extractBaseEventId(suggestion.event.id);
                        await editEvent(baseId, {
                          start_time: suggestion.suggestedStart.toISOString(),
                          end_time:   suggestion.suggestedEnd.toISOString(),
                        });
                        await loadEvents();
                        showToast("Overlap resolved and schedule updated.");
                      } catch (err) {
                        console.error("Apply suggestion failed:", err);
                        showToast("Could not apply — try right-click to edit manually.");
                      }
                    }}
                  />
                );
              }
              const item      = entry.data;
              const itemIndex = upcomingItemEntries.findIndex((e) => e === entry);
              return (
                <TimelineRow
                  key={item.id}
                  item={item}
                  dayTasks={dayTasks}
                  isFirst={itemIndex === 0}
                  isLast={itemIndex === upcomingItemEntries.length - 1}
                  onDelete={removeEvent}
                  onEdit={(ev) => openModal(ev, ev.tag)}
                />
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <aside className={styles.rightSidebar}>
          <TaskWidget
            tasks={dayTasks}
            selectedDate={selectedDate}
            onViewAllTasks={() => onNavigate?.("tasks")}
          />
          <HomeStudyCoachCard
            days={7}
            onNavigateAnalytics={() => onNavigate?.("analytics")}
          />
        </aside>
      </div>
    </div>
  );
}