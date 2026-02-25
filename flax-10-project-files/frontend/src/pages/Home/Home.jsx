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
import analyticsService from "../../api/analyticsService";
import { getHistory } from "../../components/Timer/utils/historyUtils";
import { getModules } from "../../api/moduleApi";
import { useTimerContext } from "../../context/TimerContext";
import { formatTime as formatTimerSeconds } from "../../components/Timer/TimerComponents";

const PRIORITY_COLOURS = {
  urgent: "var(--urgent)",
  high:   "var(--study)",
  medium: "var(--personal)",
  low:    "var(--neutral)",
};

/* Unified color language: study = caramel/gold, life = greige */
const STUDY_ACCENT = "#c4a35a";
const LIFE_ACCENT  = "#9c8f7e";
function eventAccentColor(item, matchTask, themeColor) {
  if (matchTask) return PRIORITY_COLOURS[matchTask.priority] || themeColor;
  if (isLecture(item) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/i.test(item.title || "")) return STUDY_ACCENT;
  if (/gym|lunch|dinner|breakfast|run|yoga|walk|coffee|cinema|drinks|meeting|shop|laundry/i.test(item.title || "")) return LIFE_ACCENT;
  return themeColor || "#94A3B8";
}

/* 3px left border by type: meals grey, study blue, urgent red, health green, personal/admin purple */
function scheduleCardBorderColor(item, matchTask) {
  if (matchTask?.priority === "urgent" || /deadline|urgent|due|submission/i.test(item.title || "")) return "#E85555";
  if (isLecture(item) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/i.test(item.title || "")) return "#4A7CF7";
  if (/gym|run|yoga|walk|sport|exercise/i.test(item.title || "")) return "#22C897";
  if (/breakfast|lunch|dinner|coffee|meal/i.test(item.title || "")) return "#6B7280";
  if (/cinema|drinks|meeting|shop|laundry|personal|admin/i.test(item.title || "")) return "#8B5CF6";
  return "#6B7280";
}

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

function getTimeOfDay(date) {
  const d = date instanceof Date ? date : new Date(date);
  const h = d.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function getNowBannerIdleMessage({ nextItem, selectedDate }) {
  const timeOfDay = getTimeOfDay(selectedDate);
  if (timeOfDay === "morning" && nextItem) {
    return `🌅 Fresh start — your first block begins at ${formatTime(nextItem.start_time)}`;
  }
  if (timeOfDay === "afternoon") {
    return "☕ Free window — want to tackle a quick win?";
  }
  return "🌱 Garden's quiet. Time to plant tomorrow's goals?";
}

/** Context-aware motivation header for Plan for the Day. Uses currentTime, totalTasks, completedTasks, lectureCount. */
function getMotivationMessage(currentTime, totalTasks, completedTasks, lectureCount) {
  const hour = currentTime.getHours();
  const isMorning = hour < 12;
  const isEvening = hour >= 18;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highCompletion = totalTasks > 0 && (pct >= 50 || completedTasks >= 2);

  if (isEvening && highCompletion) {
    return "Great work today. You've tackled the bulk of your schedule. Time for a breather?";
  }
  if (completedTasks > 0) {
    return `${pct}% of your day is complete — ${completedTasks} goal${completedTasks === 1 ? "" : "s"} crushed!`;
  }
  if (lectureCount > 3) {
    return `It's a big academic day with ${lectureCount} lectures. Pace yourself!`;
  }
  if (isMorning) {
    const taskWord = totalTasks === 1 ? "task" : "tasks";
    const lectWord = lectureCount === 1 ? "lecture" : "lectures";
    return `Good morning! You have ${totalTasks} ${taskWord} and ${lectureCount} ${lectWord} today. Let's get started!`;
  }
  if (totalTasks === 0) {
    return "Your garden is quiet. Time to plant something?";
  }
  return `You have ${totalTasks} item${totalTasks === 1 ? "" : "s"} today. You've got this!`;
}

function isNow(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const now = new Date();
  return new Date(startStr) <= now && now <= new Date(endStr);
}

/** Percent through the event (0–100) for the current time; null if not active. */
function getNowLinePercent(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (now < start || now > end) return null;
  const p = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, p));
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

/* Daily progress ring: percentage of today's scheduled items completed (past events / total) */
function DailyProgressRing({ dayEvents }) {
  const { completed, total, pct } = useMemo(() => {
    const totalCount = dayEvents.length;
    const completedCount = dayEvents.filter((e) => isPast(e.end_time)).length;
    const value = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completed: completedCount, total: totalCount, pct: value };
  }, [dayEvents]);

  const r = 22;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className={styles.progressRingWrap} title={`${completed} of ${total} done today`}>
      <svg className={styles.progressRingSvg} viewBox="0 0 52 52" aria-hidden>
        <circle
          className={styles.progressRingBg}
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="4"
        />
        <circle
          className={styles.progressRingFill}
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
        />
      </svg>
      <span className={styles.progressRingLabel}>{total ? `${pct}%` : "—"}</span>
    </div>
  );
}

/* Day progress ring for right column: ring + "X of Y done" above To Schedule */
function DayProgressRingSidebar({ completed, total }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className={styles.dayProgressRingSidebar}>
      <div className={styles.dayProgressRingCircle}>
        <svg viewBox="0 0 64 64" aria-hidden>
          <circle className={styles.dayProgressRingBg} cx="32" cy="32" r={r} fill="none" strokeWidth="4" />
          <circle
            className={styles.dayProgressRingFill}
            cx="32"
            cy="32"
            r={r}
            fill="none"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        </svg>
      </div>
      <span className={styles.dayProgressRingText}>{total ? `${completed} of ${total} done` : "No blocks today"}</span>
    </div>
  );
}

/* Active timer card: countdown + progress when a timer is running (replaces progress ring + task widget in that state) */
function ActiveTimerCard({ onOpenTimer }) {
  const { isActive, timeLeft, mode, progress, task, isOvertime, isBreakOvertime } = useTimerContext();
  if (!isActive) return null;

  const label = mode === "work"
    ? (isOvertime ? "Overtime" : "Focus")
    : (isBreakOvertime ? "Break overtime" : "Break");
  const pct = Math.min(100, Math.max(0, typeof progress === "number" ? progress : 0));

  return (
    <div className={styles.activeTimerCard}>
      <div className={styles.activeTimerCardHeader}>
        <span className={styles.activeTimerCardLabel}>{label}</span>
        <button
          type="button"
          className={styles.activeTimerCardLink}
          onClick={() => onOpenTimer?.()}
        >
          Open timer →
        </button>
      </div>
      <div className={styles.activeTimerCountdown}>{formatTimerSeconds(timeLeft)}</div>
      {task && mode === "work" && (
        <p className={styles.activeTimerTaskName}>{task}</p>
      )}
      <div className={styles.activeTimerProgressTrack}>
        <div
          className={styles.activeTimerProgressFill}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* Now & Next slim banner with progress ring and free-gap message */
function NowNextCard({ dayEvents, upcomingItems, selectedDate }) {
  const nowItem = useMemo(
    () => dayEvents.find((e) => isNow(e.start_time, e.end_time)),
    [dayEvents]
  );
  const nextItem = upcomingItems[0] ?? null;
  const nextText = nextItem
    ? `${nextItem.title} at ${formatTime(nextItem.start_time)}`
    : "Nothing scheduled";

  const hasActiveNow = !!nowItem;
  const idleMessage = useMemo(
    () => getNowBannerIdleMessage({ nextItem, selectedDate }),
    [nextItem, selectedDate]
  );

  return (
    <div
      className={`${styles.nowNextBanner} ${hasActiveNow ? styles.nowNextBannerActive : styles.nowNextBannerIdle}`}
    >
      <DailyProgressRing dayEvents={dayEvents} />
      <span className={styles.nowNextPart}>
        <span className={styles.nowNextLabel}>NOW:</span>{" "}
        {hasActiveNow ? (
          <span className={styles.nowNextCurrent}>{nowItem.title}</span>
        ) : (
          <span className={styles.nowNextIdle}>{idleMessage}</span>
        )}
      </span>
      <span className={styles.nowNextSep}>·</span>
      <span className={styles.nowNextPart}>
        <span className={styles.nowNextLabel}>UP NEXT:</span> {nextText}
      </span>
    </div>
  );
}

/* Unified Hero at top: Active Focus Session (when timer running) or Start a Seed (task selector + Start) */
function FocusHeroCard({ tasks, onStartTask, onOpenTimer }) {
  const timer = useTimerContext();
  const { isActive, timeLeft, task, progress, setIsActive, mode, isOvertime, isBreakOvertime } = timer;
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const topTasks = useMemo(() => tasks.slice(0, 50), [tasks]);

  if (isActive) {
    const label = mode === "work"
      ? (isOvertime ? "Overtime" : "Focus")
      : (isBreakOvertime ? "Break overtime" : "Break");
    const pct = Math.min(100, Math.max(0, typeof progress === "number" ? progress : 0));
    return (
      <div className={styles.focusHero}>
        <div className={styles.focusHeroActive}>
          <span className={styles.focusHeroLabel}>{label}</span>
          <div className={styles.focusHeroCountdown}>{formatTimerSeconds(timeLeft)}</div>
          {task && mode === "work" && (
            <p className={styles.focusHeroTaskName}>{task}</p>
          )}
          <div className={styles.focusHeroProgressTrack}>
            <div
              className={styles.focusHeroProgressFill}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={styles.focusHeroActions}>
            <button
              type="button"
              className={styles.focusHeroBtnSecondary}
              onClick={() => setIsActive(false)}
            >
              Pause
            </button>
            <button
              type="button"
              className={styles.focusHeroBtnPrimary}
              onClick={() => onOpenTimer?.()}
            >
              Open timer →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.focusHero}>
      <div className={styles.focusHeroSeed}>
        <h2 className={styles.focusHeroSeedTitle}>Start a Seed</h2>
        <p className={styles.focusHeroSeedSub}>Pick a task and grow your focus.</p>
        <div className={styles.focusHeroSeedRow}>
          <select
            className={styles.focusHeroSelect}
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            aria-label="Choose a task"
          >
            <option value="">Choose a task…</option>
            {topTasks.map((t) => (
              <option key={t.id} value={String(t.id)}>{t.title}</option>
            ))}
          </select>
          <button
            type="button"
            className={styles.focusHeroStartBtn}
            disabled={!selectedTaskId}
            onClick={() => {
              if (!selectedTaskId) return;
              const t = topTasks.find((x) => String(x.id) === selectedTaskId);
              if (t) onStartTask(t);
            }}
          >
            Start
          </button>
        </div>
        {topTasks.length === 0 && (
          <p className={styles.focusHeroSeedEmpty}>No tasks yet. Add one from Tasks.</p>
        )}
      </div>
    </div>
  );
}

/* Data hook */
function useHomeData(selectedDate) {
  const { events } = useCalendar();
  const [allTasks, setAllTasks] = useState([]);
  useCalendarEvents();

  useEffect(() => {
    fetchTasks()
      .then((data) => setAllTasks(data || []))
      .catch(() => {});
  }, []);

  const dayEvents = useMemo(
    () => events.filter((e) => overlapsDay(new Date(e.start_time), new Date(e.end_time), selectedDate)),
    [events, selectedDate]
  );

  const dayTasks = useMemo(() => {
    const incomplete = allTasks.filter((t) => !t.completed);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return incomplete
      .filter((t) => t.due_date && new Date(t.due_date) <= dayEnd)
      .sort((a, b) => (p[a.priority] ?? 4) - (p[b.priority] ?? 4));
  }, [allTasks, selectedDate]);

  const removePendingTask = useCallback((id) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { dayEvents, dayTasks, allTasks, removePendingTask };
}

/* Detail overlay */
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

/* Small monochromatic icons for context menu */
const IconPencil = () => (
  <svg className={styles.contextIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
);
const IconTrash = () => (
  <svg className={styles.contextIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);

/* Context menu — clean dropdown with blur */
function ContextMenu({ x, y, item, onEdit, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className={styles.contextMenu} style={{ top: y, left: x }} role="menu">
      <button type="button" role="menuitem" className={styles.contextItem} onClick={() => { onEdit(item); onClose(); }}>
        <IconPencil /> Edit
      </button>
      <div className={styles.contextDivider} />
      <button type="button" role="menuitem" className={`${styles.contextItem} ${styles.contextDelete}`} onClick={() => { onDelete(item.id); onClose(); }}>
        <IconTrash /> Delete
      </button>
    </div>
  );
}

/* Timeline event card */
function TimelineRow({ item, isFirst, isLast, onDelete, onEdit, dayTasks, asPastBar }) {
  const { getTag }          = useTags();
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu]       = useState(null);

  const theme       = getTag(item.tag) || { color: "#94A3B8", icon: "📅" };
  const icon        = resolveEventIcon(item, theme.icon);
  const durationMins = item.end_time
    ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000)
    : null;
  const matchTask   = dayTasks?.find((t) => (t.title || "").trim() === (item.title || "").trim());
  const accentColor = eventAccentColor(item, matchTask, theme.color);
  const borderColor = scheduleCardBorderColor(item, matchTask);
  const active      = isNow(item.start_time, item.end_time);
  const past        = !active && isPast(item.end_time);
  const lect        = isLecture(item);
  const modCode     = lect ? (item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description)) : null;
  const startTime   = formatTime(item.start_time);
  const endTime     = formatTime(item.end_time);

  const cardHeight = durationMins != null ? Math.max(40, Math.min(180, Math.round(durationMins * 1.8))) : undefined;

  const actionBtnRef = useRef(null);
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);
  const openActionMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionBtnRef.current) {
      const rect = actionBtnRef.current.getBoundingClientRect();
      setCtxMenu({ x: rect.left, y: rect.bottom + 4 });
    }
  }, []);

  const isThinBar = asPastBar || past;
  const startHour = item.start_time ? new Date(item.start_time).getHours() : 12;
  const timeOfDayClass = startHour < 12 ? styles.timeOfDayMorning : startHour >= 17 ? styles.timeOfDayEvening : null;
  const nowLineTop = active ? getNowLinePercent(item.start_time, item.end_time) : null;

  return (
    <>
      <div className={`${styles.timelineRow} ${past ? styles.rowPast : ""} ${isThinBar ? styles.rowThinBar : ""}`}>
        <div className={styles.gutter}>
          <span className={styles.gutterTime}>{startTime}</span>
          {durationMins > 0 && <span className={styles.gutterDur}>{fmtDuration(durationMins)}</span>}
        </div>

        {isThinBar ? (
          <div
            className={styles.pastBar}
            style={{ background: `linear-gradient(90deg, ${accentColor}40, ${accentColor}15)` }}
            onClick={() => setShowDetail(true)}
            onContextMenu={handleContextMenu}
            title={item.title}
          />
        ) : (
          <div
            className={`${styles.card} ${active ? styles.cardActive : ""} ${timeOfDayClass || ""} ${styles.cardWithNowLine}`}
            style={{
              "--card-accent": borderColor,
              minHeight: cardHeight ? `${cardHeight}px` : undefined,
              "--now-line-top": nowLineTop != null ? `${nowLineTop}%` : undefined,
            }}
            onClick={() => setShowDetail(true)}
            onContextMenu={handleContextMenu}
          >
            {active && nowLineTop != null && (
              <div className={styles.nowIndicatorLine} aria-hidden />
            )}
            <div className={styles.cardIcon} style={{ background: `${accentColor}1A` }}>
              <span className={styles.cardIconEmoji}>{icon}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardMeta}>
                {active && <span className={styles.nowBadge}>Now</span>}
              </div>
              <span className={styles.cardTitle}>{item.title}</span>
              {lect && modCode && <span className={styles.cardSub}>{modCode}</span>}
            </div>
            <div className={styles.cardActionBar}>
              <button
                ref={actionBtnRef}
                type="button"
                className={styles.cardActionBtn}
                onClick={openActionMenu}
                aria-label="Schedule options"
                aria-haspopup="menu"
              >
                <svg className={styles.cardActionKebab} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
              </button>
            </div>
          </div>
        )}
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


/* Overlap cluster */
function OverlapCluster({ items, onDelete, onEdit, onApplySuggestion }) {
  const { getTag }      = useTags();
  const [expanded,      setExpanded]      = useState(false);
  const [resolveOpen,   setResolveOpen]   = useState(false);
  const [dismissed,     setDismissed]     = useState(false);
  const firstStart      = formatTime(items[0].start_time);

  const clusterTimeRange = useMemo(() => {
    let minStart = Infinity;
    let maxEnd = -Infinity;
    items.forEach((it) => {
      const s = new Date(it.start_time).getTime();
      const e = new Date(it.end_time || it.start_time).getTime();
      if (s < minStart) minStart = s;
      if (e > maxEnd) maxEnd = e;
    });
    return { start: minStart === Infinity ? null : minStart, end: maxEnd === -Infinity ? null : maxEnd };
  }, [items]);

  const nowLinePercent = useMemo(() => {
    if (!clusterTimeRange.start || !clusterTimeRange.end) return null;
    const now = Date.now();
    if (now < clusterTimeRange.start || now > clusterTimeRange.end) return null;
    return Math.max(0, Math.min(100, ((now - clusterTimeRange.start) / (clusterTimeRange.end - clusterTimeRange.start)) * 100));
  }, [clusterTimeRange]);

  const hasActiveNow = items.some((it) => isNow(it.start_time, it.end_time));

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
      <div className={styles.gutter}>
        <span className={styles.gutterTime}>{firstStart}</span>
      </div>

      <div className={styles.clusterCards}>
        {hasActiveNow && nowLinePercent != null && (
          <div
            className={styles.clusterNowLine}
            style={{ top: `${nowLinePercent}%` }}
            aria-hidden
          />
        )}
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

        {/* Events list: side-by-side when overlapping */}
        {(expanded || true) && (
          <div className={styles.clusterCardsRow}>
            {items.map((item) => {
              const theme       = getTag(item.tag) || { color: "#94A3B8", icon: "📅" };
              const icon        = resolveEventIcon(item, theme.icon);
              const accentColor = eventAccentColor(item, null, theme.color);
              const borderColor = scheduleCardBorderColor(item, null);
              const durationMins = item.end_time
                ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000)
                : null;
              return (
                <ClusterCard
                  key={item.id}
                  item={item}
                  icon={icon}
                  accentColor={accentColor}
                  borderColor={borderColor}
                  durationMins={durationMins}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              );
            })}
          </div>
        )}

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

function ClusterCard({ item, icon, accentColor, borderColor, durationMins, onDelete, onEdit }) {
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu]       = useState(null);
  const actionBtnRef = useRef(null);
  const active = isNow(item.start_time, item.end_time);
  const past   = !active && isPast(item.end_time);
  const barColor = borderColor ?? accentColor;

  const openActionMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionBtnRef.current) {
      const rect = actionBtnRef.current.getBoundingClientRect();
      setCtxMenu({ x: rect.left, y: rect.bottom + 4 });
    }
  }, []);

  return (
    <>
      <div
        className={`${styles.card} ${styles.clusterCard} ${past ? styles.cardPast : ""} ${active ? styles.cardActive : ""}`}
        style={{ "--card-accent": barColor }}
        onClick={() => setShowDetail(true)}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      >
        <div className={styles.cardIcon} style={{ background: `${accentColor}1A` }}>
          <span className={styles.cardIconEmoji}>{icon}</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>
            {active && <span className={styles.nowBadge}>Now</span>}
          </div>
          <span className={styles.cardTitle}>{item.title}</span>
        </div>
        <div className={styles.cardActionBar}>
          <button
            ref={actionBtnRef}
            type="button"
            className={styles.cardActionBtn}
            onClick={openActionMenu}
            aria-label="Schedule options"
            aria-haspopup="menu"
          >
            <svg className={styles.cardActionKebab} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
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

/* Empty slot with Quick Add */
function FreeGap({ minutes, gapStart, suggestedTask, quickAddTasks = [], onTaskScheduled, addEvent, onToast }) {
  const [scheduling, setScheduling] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const menuRef = useRef(null);

  const topTasks = (quickAddTasks && quickAddTasks.length > 0) ? quickAddTasks.slice(0, 3) : (suggestedTask ? [suggestedTask] : []);

  const scheduleTask = async (task) => {
    if (!task || scheduling || hidden) return;
    setScheduling(true);
    try {
      const estMins   = (task.estimated_blocks || 1) * 25;
      const startTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
      const endTime   = new Date(startTime.getTime() + estMins * 60000);
      await addEvent({
        title:       task.title,
        start_time:  startTime.toISOString(),
        end_time:    endTime.toISOString(),
        description: task.description || "",
      });
      onTaskScheduled?.(task.id);
      onToast?.(`"${task.title}" added to your plan`);
      setHidden(true);
      setQuickOpen(false);
    } catch {
      onTaskScheduled?.(task.id);
      setHidden(true);
      setQuickOpen(false);
    } finally {
      setScheduling(false);
    }
  };

  useEffect(() => {
    if (!quickOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setQuickOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [quickOpen]);

  if (hidden) return null;

  return (
    <div className={styles.gapDividerRow} ref={menuRef}>
      <span className={styles.gapDividerLine} />
      <span className={styles.gapDividerDuration}>{fmtDuration(minutes)}</span>
      <button
        type="button"
        className={styles.gapDividerPlus}
        onClick={() => setQuickOpen((o) => !o)}
        title={`${fmtDuration(minutes)} free — add task`}
        aria-label="Add task to slot"
      >
        +
      </button>
      <span className={styles.gapDividerLine} />
      {quickOpen && topTasks.length > 0 && (
        <div className={styles.quickAddMenu}>
          <span className={styles.quickAddTitle}>Quick add</span>
          {topTasks.map((t) => (
            <button
              key={t.id}
              type="button"
              className={styles.quickAddItem}
              onClick={() => scheduleTask(t)}
              disabled={scheduling}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}
      {quickOpen && topTasks.length === 0 && (
        <div className={styles.quickAddMenu}>
          <span className={styles.quickAddEmptyIcon} aria-hidden>🪴</span>
          <span className={styles.quickAddEmpty}>Your garden is quiet</span>
        </div>
      )}
    </div>
  );
}

/* Task widget row */
function TaskWidgetRow({ task, onPlay, isActiveInTimer }) {
  const color   = PRIORITY_COLOURS[task.priority] || "var(--muted)";
  const estMins = task.estimated_blocks ? task.estimated_blocks * 25 : null;
  const priorityClass = task.priority === "urgent" ? styles.twDotUrgent
    : task.priority === "high" ? styles.twDotHigh
    : task.priority === "low" ? styles.twDotLow
    : "";
  const moduleId = task.moduleId ?? task.module_id;
  const moduleCode = task.module_code;
  const assignmentType = (task.assignment_type || task.deadline_type || "").toLowerCase();
  const typeBubbleClass =
    assignmentType === "exam" ? styles.twBubbleExam
    : assignmentType === "coursework" ? styles.twBubbleCoursework
    : assignmentType === "lab" ? styles.twBubbleOther
    : null;
  const typeLabel = assignmentType === "exam" ? "Exam" : assignmentType === "coursework" ? "Coursework" : assignmentType === "lab" ? "Lab" : null;
  const moduleHref = moduleId ? `/modules?moduleId=${moduleId}` : (moduleCode ? `/modules?code=${encodeURIComponent(moduleCode)}` : "/modules");

  return (
    <div className={`${styles.twRow} ${isActiveInTimer ? styles.twRowActiveTimer : ""}`}>
      <div className={styles.twLeft}>
        <span className={`${styles.twDot} ${priorityClass}`} style={{ background: color }} />
        <div className={styles.twBody}>
          <span className={styles.twTitle}>{task.title}</span>
          <div className={styles.twMeta}>
            {(moduleCode || moduleId) && (
              <Link to={moduleHref} className={`${styles.twBubble} ${styles.twBubbleModule}`} onClick={(e) => e.stopPropagation()}>
                {moduleCode || `Module ${moduleId}`}
              </Link>
            )}
            {typeLabel && typeBubbleClass && (
              <span className={`${styles.twBubble} ${typeBubbleClass}`}>{typeLabel}</span>
            )}
            {estMins && <span className={styles.twTime}>{fmtDuration(estMins)}</span>}
          </div>
        </div>
      </div>
      {onPlay && !task.completed && (
        <button
          type="button"
          className={styles.twPlay}
          title="Start timer for this task"
          onClick={() => onPlay(task)}
        >
          ▶
        </button>
      )}
    </div>
  );
}

/* Task widget — always visible; context-aware empty: brand new vs all completed */
function TaskWidget({ tasks, selectedDate, onViewAllTasks, onPlay, onAddTask, backlogLabel, activeTimerTaskId, isBrandNew, isAllCompleted }) {
  const topTasks = useMemo(() => tasks.slice(0, 5), [tasks]);
  const label    = backlogLabel ? "TO SCHEDULE" : (isToday(selectedDate) ? "TODAY'S TASKS" : "TASKS DUE");
  const isEmpty  = topTasks.length === 0;

  const emptyMessage = isBrandNew
    ? "A fresh start! What's the first goal you'll plant here?"
    : isAllCompleted
    ? "All chores are done. Time for a cat nap?"
    : "Your garden is clear";
  const emptyIcon = isBrandNew ? "🪴" : isAllCompleted ? "🐈" : "🪴";

  return (
    <div className={styles.taskWidget}>
      <div className={styles.taskWidgetHeader}>
        <span className={styles.taskWidgetTitle}>{label}</span>
        <div className={styles.taskWidgetHeaderActions}>
          {isEmpty && onAddTask && (
            <button
              type="button"
              className={styles.taskWidgetAddBtn}
              onClick={onAddTask}
              title="Add task"
              aria-label="Add task"
            >
              +
            </button>
          )}
          <button
            type="button"
            className={styles.taskWidgetLink}
            onClick={() => onViewAllTasks?.()}
          >
            All tasks →
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className={styles.taskWidgetEmpty}>
          <span className={styles.taskWidgetEmptyIcon} aria-hidden>{emptyIcon}</span>
          <p className={styles.taskWidgetEmptyText}>{emptyMessage}</p>
          {onAddTask && (isBrandNew || !isAllCompleted) && (
            <button
              type="button"
              className={styles.taskWidgetEmptyBtn}
              onClick={onAddTask}
            >
              + Add Task
            </button>
          )}
        </div>
      ) : (
        <div className={styles.taskWidgetList}>
          {topTasks.map((task) => (
            <TaskWidgetRow
              key={task.id}
              task={task}
              onPlay={onPlay}
              isActiveInTimer={activeTimerTaskId != null && String(task.id) === String(activeTimerTaskId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Empty day — Zen state when no tasks scheduled */
function EmptyDay() {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>🪴</span>
      <p>Your garden is quiet</p>
      <p className={styles.emptySub}>Time to plant tomorrow&apos;s goals?</p>
    </div>
  );
}

/* HOME PAGE */
export default function Home({ onNavigate }) {
  const navigate         = useNavigate();
  const { selectedDate } = useCalendar();
  const dispatch         = useCalendarDispatch();
  const { loadEvents }   = useCalendarEvents();
  const { removeEvent, addEvent, editEvent } = useEventActions();
  const { openModal }    = useEventModal();

  const { dayEvents, dayTasks, allTasks, removePendingTask } = useHomeData(selectedDate);
  const isBrandNewTasks = (allTasks || []).length === 0;
  const isAllTasksCompleted = (allTasks || []).length > 0 && (allTasks || []).filter((t) => !t.completed).length === 0;
  const { isActive: timerIsActive } = useTimerContext();
  const [toast, setToast] = useState(null);
  const [pastCollapsed, setPastCollapsed] = useState(true);
  const [coachInsights, setCoachInsights] = useState(null);
  const [recentGrowthTask, setRecentGrowthTask] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState(null);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
  const [modulesList, setModulesList] = useState([]);
  const [highlightedModuleId, setHighlightedModuleId] = useState(null);
  const moduleOverviewRef = useRef(null);
  useEffect(() => {
    const read = () => { try { setActiveTimerTaskId(sessionStorage.getItem("timerTaskId")); } catch (_) {} };
    read();
    window.addEventListener("focus", read);
    return () => window.removeEventListener("focus", read);
  }, []);

  useEffect(() => {
    if (!isToday(selectedDate)) {
      setRecentGrowthTask(null);
      return;
    }
    let cancelled = false;
    const fetchTodayGrowth = () => {
      getHistory()
        .then((history) => {
          if (cancelled || !Array.isArray(history)) return;
          const todayStr = new Date(selectedDate).toDateString();
          const todaySessions = history.filter((s) => {
            const end = s.end_time ?? s.endTime ?? s.date;
            return end && new Date(end).toDateString() === todayStr;
          });
          if (todaySessions.length === 0) {
            setRecentGrowthTask(null);
            return;
          }
          const byEnd = [...todaySessions].sort(
            (a, b) => new Date(b.end_time ?? b.endTime ?? b.date) - new Date(a.end_time ?? a.endTime ?? a.date)
          );
          const taskName = (byEnd[0].task || "").trim() || "Focus";
          setRecentGrowthTask(taskName);
        })
        .catch(() => setRecentGrowthTask(null));
    };
    fetchTodayGrowth();
    const onFocus = () => { if (isToday(selectedDate)) fetchTodayGrowth(); };
    window.addEventListener("focus", onFocus);
    return () => { cancelled = true; window.removeEventListener("focus", onFocus); };
  }, [selectedDate]);

  useEffect(() => {
    getModules().then((list) => setModulesList(Array.isArray(list) ? list : [])).catch(() => setModulesList([]));
  }, []);

  const handleModuleTagClick = useCallback((moduleId, moduleCode) => {
    moduleOverviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightedModuleId(String(moduleId || ""));
    setTimeout(() => setHighlightedModuleId(null), 2500);
  }, []);

  const generateCoach = useCallback(async () => {
    setCoachLoading(true);
    setCoachError(null);
    try {
      const res = await analyticsService.getAiInsights(7);
      setCoachInsights(res?.insights || "");
    } catch (err) {
      const msg = err?.message || "";
      setCoachError(
        msg.includes("OpenAI API key not configured") || msg.includes("OpenAI package not installed")
          ? "AI study coach isn't configured yet."
          : "Couldn't generate insights. Try again in a moment."
      );
    } finally {
      setCoachLoading(false);
    }
  }, []);

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

  /* Include overlapping past events in timeline so both show side-by-side in the same time block */
  const upcomingForTimeline = useMemo(() => {
    const upcomingIds = new Set(upcomingItems.map((e) => e.id));
    const pastThatOverlap = pastItems.filter((past) => {
      const pastStart = new Date(past.start_time);
      const pastEnd = new Date(past.end_time || past.start_time);
      return upcomingItems.some((up) => {
        const upStart = new Date(up.start_time);
        const upEnd = new Date(up.end_time || up.start_time);
        return pastEnd > upStart && pastStart < upEnd;
      });
    });
    const combined = [...upcomingItems, ...pastThatOverlap];
    return combined.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [upcomingItems, pastItems]);

  const pastIdsShownInTimeline = useMemo(
    () => new Set(
      pastItems.filter((past) => {
        const pastEnd = new Date(past.end_time || past.start_time);
        return upcomingItems.some((up) => pastEnd > new Date(up.start_time) && new Date(past.start_time) < new Date(up.end_time || up.start_time));
      }).map((p) => p.id)
    ),
    [pastItems, upcomingItems]
  );

  const pastItemsForSection = useMemo(
    () => pastItems.filter((p) => !pastIdsShownInTimeline.has(p.id)),
    [pastItems, pastIdsShownInTimeline]
  );

  const scheduledTitles = useMemo(
    () => new Set(upcomingItems.map((e) => e.title?.toLowerCase())),
    [upcomingItems]
  );

  const suggestableTasks = useMemo(
    () => dayTasks.filter((t) => !scheduledTitles.has(t.title?.toLowerCase())),
    [dayTasks, scheduledTitles]
  );

  const upcomingTimeline = useMemo(
    () => computeTimelineWithGaps(upcomingForTimeline, suggestableTasks),
    [upcomingForTimeline, suggestableTasks]
  );

  const upcomingItemEntries = upcomingTimeline.filter((e) => e.type === "item" || e.type === "cluster");

  const mustDoTasks = useMemo(() => {
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    return dayTasks.filter(
      (t) => (t.priority === "urgent" || t.priority === "high") && t.due_date && new Date(t.due_date) <= dayEnd && new Date(t.due_date) >= dayStart
    );
  }, [dayTasks, selectedDate]);

  const dayProgress = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    const now = new Date();
    if (now < startOfDay) return { percent: 0, message: "Your day hasn't started yet — get set!" };
    if (now > endOfDay) return { percent: 100, message: "Your day is complete — well done!" };
    const percent = Math.round(((now - startOfDay) / (endOfDay - startOfDay + 1)) * 100);
    const message = percent >= 100
      ? "Your day is complete — well done!"
      : `${percent}% of your day is complete — you're doing great!`;
    return { percent: Math.min(100, percent), message };
  }, [selectedDate]);

  const lectureCount = useMemo(
    () => sortedEvents.filter(isLecture).length,
    [sortedEvents]
  );

  const motivationMessage = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    return getMotivationMessage(now, sortedEvents.length, pastItems.length, lectureCount);
  }, [selectedDate, now, sortedEvents.length, pastItems.length, lectureCount]);

  return (
    <div className={styles.page}>
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

      <div className={styles.bentoGrid}>
        <div className={styles.bentoHero}>
          <FocusHeroCard
            tasks={dayTasks}
            onStartTask={(t) => {
              try { sessionStorage.setItem("timerTaskId", String(t.id)); } catch (_) {}
              navigate(`/timer?taskId=${t.id}`);
              onNavigate?.("timer");
            }}
            onOpenTimer={() => {
              navigate("/timer");
              onNavigate?.("timer");
            }}
          />
        </div>
        <div className={styles.bentoNowNext}>
          <NowNextCard dayEvents={sortedEvents} upcomingItems={upcomingItems} selectedDate={selectedDate} />
        </div>

        <section className={styles.bentoDeadlines}>
          <DeadlinesWidget onModuleTagClick={handleModuleTagClick} />
        </section>

        <section
          id="module-overview"
          ref={moduleOverviewRef}
          className={styles.bentoModuleOverview}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionHeaderLabel}>Modules</span>
            <h3 className={styles.sectionHeaderTitle}>
              <span className={styles.sectionHeaderIcon} aria-hidden>📚</span>
              Module Overview
            </h3>
          </div>
          {modulesList.length === 0 ? (
            <p className={styles.moduleOverviewEmpty}>No modules yet. Add modules from the Modules page.</p>
          ) : (
            <div className={styles.moduleOverviewGrid}>
              {modulesList.slice(0, 6).map((mod) => (
                <Link
                  key={mod.id}
                  to={`/modules?moduleId=${mod.id}`}
                  className={`${styles.moduleOverviewCard} ${highlightedModuleId && String(mod.id) === highlightedModuleId ? styles.moduleOverviewCardHighlight : ""}`}
                  data-module-id={mod.id}
                >
                  <span className={styles.moduleOverviewCardCode}>{mod.module_code}</span>
                  <span className={styles.moduleOverviewCardName}>{mod.module_name || mod.title}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className={styles.bentoPlan}>
          <div className={styles.timelineBox}>
            {/* Sleek progress bar at top: Sage → Terracotta; task-based when there are tasks */}
            {isToday(selectedDate) && (
              <div className={styles.dayProgressWrap}>
                <div className={styles.dayProgressTrack}>
                  <div
                    className={styles.dayProgressFill}
                    style={{
                      width: `${sortedEvents.length > 0
                        ? Math.round((pastItems.length / sortedEvents.length) * 100)
                        : dayProgress?.percent ?? 0}%`,
                    }}
                  />
                </div>
                <p className={styles.dayProgressLabel}>
                  {motivationMessage ?? dayProgress?.message ?? "Your plan for today"}
                </p>
                {recentGrowthTask && (
                  <div className={styles.recentGrowthBadge}>
                    🌱 {recentGrowthTask} completed!
                  </div>
                )}
              </div>
            )}
            <div className={styles.timelineHeader}>
              <div>
                <h3 className={styles.timelineTitle}>YOUR PLAN FOR THE DAY</h3>
                {!isToday(selectedDate) && (
                <span className={styles.timelineSub}>Preview & adjust.</span>
              )}
              </div>
              <button
                type="button"
                className={styles.headerGenerateBtn}
                onClick={generateCoach}
                disabled={coachLoading}
              >
                {coachLoading ? "…" : "Generate"}
              </button>
            </div>

            <div className={styles.timelineTrack}>
              <div className={styles.timelineTrackLine} aria-hidden />
              <div className={styles.timelineTrackContent}>
            {mustDoTasks.length > 0 && (
              <div className={styles.mustDoSection}>
                <div className={styles.mustDoLabel}>{isToday(selectedDate) ? "Must do today" : "Due this day"}</div>
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

            {pastItemsForSection.length > 0 && (
              <div className={styles.pastDetails}>
                <button
                  type="button"
                  className={styles.pastSummary}
                  onClick={() => setPastCollapsed((c) => !c)}
                >
                  Earlier today <span className={styles.pastCount}>({pastItemsForSection.length})</span>
                  <span className={styles.pastChevron}>{pastCollapsed ? "▼" : "▲"}</span>
                </button>
                {!pastCollapsed && (
                  <div className={styles.pastBody}>
                    {pastItemsForSection.map((item, idx) => (
                      <TimelineRow
                        key={item.id}
                        item={item}
                        dayTasks={dayTasks}
                        isFirst={idx === 0}
                        isLast={idx === pastItemsForSection.length - 1}
                        onDelete={removeEvent}
                        onEdit={(ev) => openModal(ev, ev.tag)}
                        asPastBar
                      />
                    ))}
                  </div>
                )}
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
                    quickAddTasks={suggestableTasks}
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
                    onEdit={(ev) => openModal(ev, ev.tag)}
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
          </div>
        </div>

        <aside className={styles.bentoTasks}>
          {timerIsActive ? (
            <ActiveTimerCard
              onOpenTimer={() => {
                navigate("/timer");
                onNavigate?.("timer");
              }}
            />
          ) : (
            <>
              <DayProgressRingSidebar completed={pastItems.length} total={sortedEvents.length} />
              <TaskWidget
                tasks={suggestableTasks}
                selectedDate={selectedDate}
                onViewAllTasks={() => onNavigate?.("tasks")}
                onAddTask={() => onNavigate?.("tasks")}
                onPlay={(t) => {
                  try { sessionStorage.setItem("timerTaskId", String(t.id)); } catch (_) {}
                  navigate(`/timer?taskId=${t.id}`);
                  onNavigate?.("timer");
                }}
                backlogLabel
                activeTimerTaskId={activeTimerTaskId}
                isBrandNew={isBrandNewTasks}
                isAllCompleted={isAllTasksCompleted}
              />
            </>
          )}
          <HomeStudyCoachCard
            days={7}
            onNavigateAnalytics={() => onNavigate?.("analytics")}
            insights={coachInsights}
            loading={coachLoading}
            error={coachError}
            onGenerate={generateCoach}
          />
        </aside>
      </div>
    </div>
  );
}