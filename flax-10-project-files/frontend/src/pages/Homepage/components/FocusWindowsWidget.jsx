import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Target, FileText, Zap, Timer } from "lucide-react";
import { formatTime } from "../utils/dateFormatUtils";
import styles from "./FocusWindowsWidget.module.css";

const DAY_START_MINS = 8 * 60;
const DAY_END_MINS = 22 * 60;
const TOTAL_DAY_MINS = DAY_END_MINS - DAY_START_MINS;

function formatTime24(d) {
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDuration(mins) {
  const m = Math.round(mins);
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ""}` : `${m}m`;
}

function getSuggestion(minutes) {
  if (minutes >= 180) return { text: "Perfect for deep work", Icon: Target };
  if (minutes >= 60) return { text: "Good for a focused task block", Icon: FileText };
  if (minutes >= 30) return { text: "Quick focus sprint", Icon: Zap };
  return { text: "Short burst", Icon: Timer };
}

const barVariants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.2 } },
};

function EmptyState({ subtitle, onViewAnalytics }) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerIconWrap}>
          <Sparkles className={styles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
        </div>
        <span className={styles.headerLabel}>Focus Windows</span>
      </div>
      <div className={styles.emptyState}>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={32} strokeWidth={1.25} className={styles.emptyIcon} aria-hidden />
        </motion.div>
        <p className={styles.emptyTitle}>No focus windows right now</p>
        <p className={styles.emptySubtitle}>{subtitle || "Free gaps in your schedule will appear here as study opportunities"}</p>
      </div>
      {onViewAnalytics && (
        <div className={styles.footer}>
          <button type="button" className={styles.footerLink} onClick={onViewAnalytics}>
            View full analytics →
          </button>
        </div>
      )}
    </div>
  );
}

export function FocusWindowsWidget({
  windows = [],
  now = new Date(),
  onViewAnalytics,
  onStartFocus,
}) {
  const [otherExpanded, setOtherExpanded] = useState(false);
  const nowMs = now.getTime();

  const futureWindows = useMemo(() => {
    return [...windows]
      .filter((w) => w.end.getTime() > nowMs)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [windows, nowMs]);

  const bestWindow = useMemo(() => {
    if (!futureWindows.length) return null;
    return futureWindows.reduce((best, w) => (w.minutes > best.minutes ? w : best), futureWindows[0]);
  }, [futureWindows]);

  const otherByStart = useMemo(() => {
    if (!bestWindow) return [];
    return futureWindows.filter((w) => w.start.getTime() !== bestWindow.start.getTime());
  }, [futureWindows, bestWindow]);

  const displayOthers = otherExpanded ? otherByStart : otherByStart.slice(0, 2);
  const hiddenCount = otherByStart.length - 2;
  const showMoreBtn = !otherExpanded && hiddenCount > 0;

  const summary = useMemo(() => {
    if (!futureWindows.length) return null;
    const longest = Math.max(...futureWindows.map((w) => w.minutes));
    const shortest = Math.min(...futureWindows.map((w) => w.minutes));
    return {
      count: futureWindows.length,
      longest: formatDuration(longest),
      shortest: formatDuration(shortest),
    };
  }, [futureWindows]);

  const isBestNow = bestWindow && nowMs >= bestWindow.start.getTime() && nowMs < bestWindow.end.getTime();

  const segments = useMemo(() => {
    const toMins = (d) => d.getHours() * 60 + d.getMinutes();
    const freeSorted = [...windows].sort((a, b) => a.start.getTime() - b.start.getTime());
    const segs = [];
    let lastEnd = DAY_START_MINS;
    for (const w of freeSorted) {
      const s = Math.max(DAY_START_MINS, toMins(w.start));
      const e = Math.min(DAY_END_MINS, toMins(w.end));
      if (s > lastEnd) segs.push({ start: lastEnd, end: s, free: false });
      if (e > s) segs.push({ start: s, end: e, free: true, window: w });
      lastEnd = Math.max(lastEnd, e);
    }
    if (lastEnd < DAY_END_MINS) segs.push({ start: lastEnd, end: DAY_END_MINS, free: false });
    return segs;
  }, [windows]);

  const nowPositionPct = (() => {
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (nowMins <= DAY_START_MINS) return 0;
    if (nowMins >= DAY_END_MINS) return 100;
    return ((nowMins - DAY_START_MINS) / TOTAL_DAY_MINS) * 100;
  })();

  if (!Array.isArray(windows)) return null;
  if (windows.length === 0) return <EmptyState subtitle="Your schedule looks packed — consider freeing a slot" onViewAnalytics={onViewAnalytics} />;
  if (futureWindows.length === 0) return <EmptyState subtitle="No free windows left today — check tomorrow's schedule" onViewAnalytics={onViewAnalytics} />;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerIconWrap}>
          <Sparkles className={styles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
        </div>
        <span className={styles.headerLabel}>Focus Windows</span>
      </div>

      {summary && (
        <p className={styles.summary}>
          {summary.count} {summary.count === 1 ? "window" : "windows"} · Longest: {summary.longest} · Shortest: {summary.shortest}
        </p>
      )}

      {bestWindow && (
        <div className={styles.bestCard}>
          <div className={styles.bestCardTop}>
            <span className={styles.bestLabel}>Best Window</span>
            <span className={styles.bestDuration}>{formatDuration(bestWindow.minutes)}</span>
          </div>
          {isBestNow && (
            <div className={styles.bestNowBadge}>
              <span className={styles.bestNowDot} aria-hidden />
              <span>Available now</span>
            </div>
          )}
          <p className={styles.bestTimeRange}>
            {formatTime24(bestWindow.start)} – {formatTime24(bestWindow.end)}
          </p>
          <p className={styles.bestSuggestion}>
            {(() => {
              const { text, Icon } = getSuggestion(bestWindow.minutes);
              return (
                <>
                  <Icon size={12} className={styles.bestSuggestionIcon} aria-hidden />
                  {text}
                </>
              );
            })()}
          </p>
        </div>
      )}

      {displayOthers.length > 0 && (
        <div className={styles.otherList}>
          {displayOthers.map((w, i) => {
            const label = i === 0 ? "Next" : i === 1 ? "After" : null;
            return (
              <div key={i} className={styles.otherRow}>
                <span className={styles.otherTime}>
                  {label && <span className={styles.otherLabel}>{label}</span>}
                  {formatTime(w.start.toISOString())} – {formatTime(w.end.toISOString())}
                </span>
                <span className={styles.otherPill}>{formatDuration(w.minutes)}</span>
              </div>
            );
          })}
          {showMoreBtn && (
            <button type="button" className={styles.moreBtn} onClick={() => setOtherExpanded(true)}>
              + {hiddenCount} more windows
            </button>
          )}
        </div>
      )}

      <div className={styles.timelineWrap}>
        <span className={styles.timelineLabel}>8 AM</span>
        <div className={styles.timelineBarContainer}>
          <motion.div
            className={styles.timelineBar}
            style={{ originX: 0 }}
            variants={barVariants}
            initial="hidden"
            animate="visible"
          >
            {segments.map((seg, i) => (
              <span
                key={i}
                className={seg.free ? styles.timelineFree : styles.timelineBusy}
                style={{ width: `${((seg.end - seg.start) / TOTAL_DAY_MINS) * 100}%` }}
              />
            ))}
          </motion.div>
          <span
            className={styles.timelineNow}
            style={{ left: `${nowPositionPct}%` }}
            aria-hidden
          />
        </div>
        <span className={styles.timelineLabel}>10 PM</span>
      </div>

      {isBestNow && onStartFocus && (
        <motion.button
          type="button"
          className={styles.ctaBtn}
          onClick={onStartFocus}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start focus session →
        </motion.button>
      )}

      <div className={styles.footer}>
        {onViewAnalytics && (
          <button type="button" className={styles.footerLink} onClick={onViewAnalytics}>
            View full analytics →
          </button>
        )}
      </div>
    </div>
  );
}
