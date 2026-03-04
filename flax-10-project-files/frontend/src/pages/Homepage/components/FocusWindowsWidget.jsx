/**
 * Focus Windows widget — free gaps in schedule for focused work.
 * Summary line, best-window hero card, next/after list, timeline bar, footer.
 */

import { useState, useMemo } from "react";
import { Zap, Target, FileText, Timer, CalendarX } from "lucide-react";
import { formatTime } from "../utils/dateFormatUtils";
import styles from "./FocusWindowsWidget.module.css";

const DAY_START_MINS = 8 * 60;   // 8 AM
const DAY_END_MINS = 22 * 60;    // 10 PM
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

export function FocusWindowsWidget({
  windows = [],
  now = new Date(),
  onViewAnalytics,
  onStartFocus,
}) {
  const [otherExpanded, setOtherExpanded] = useState(false);

  const nowMs = now.getTime();

  // Only future/current windows (end > now)
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

  // Timeline segments (8 AM – 10 PM)
  const segments = useMemo(() => {
    const toMins = (d) => d.getHours() * 60 + d.getMinutes();
    const freeSorted = [...windows].sort((a, b) => a.start - b.start);
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

  const nowPositionPct =
    (() => {
      const nowMins = now.getHours() * 60 + now.getMinutes();
      if (nowMins <= DAY_START_MINS) return 0;
      if (nowMins >= DAY_END_MINS) return 100;
      return ((nowMins - DAY_START_MINS) / TOTAL_DAY_MINS) * 100;
    })();

  if (!Array.isArray(windows)) return null;

  // Empty: no windows at all today
  if (windows.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <Zap className={styles.headerIcon} size={18} strokeWidth={1.5} aria-hidden />
          <span className={styles.headerTitle}>Focus Windows</span>
        </div>
        <div className={styles.emptyCard}>
          <p className={styles.emptyTitle}>
            <CalendarX size={18} className={styles.emptyTitleIcon} aria-hidden /> Fully booked today
          </p>
          <p className={styles.emptySubtitle}>No free windows available — consider rescheduling something</p>
        </div>
        {onViewAnalytics && (
          <div className={styles.footer}>
            <button type="button" className={styles.footerBtnGhost} onClick={onViewAnalytics}>
              View full analytics →
            </button>
          </div>
        )}
      </div>
    );
  }

  // Has windows but all in the past
  if (futureWindows.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <Zap className={styles.headerIcon} size={18} strokeWidth={1.5} aria-hidden />
          <span className={styles.headerTitle}>Focus Windows</span>
        </div>
        <div className={styles.emptyCard}>
          <p className={styles.emptyTitle}>
            <CalendarX size={18} className={styles.emptyTitleIcon} aria-hidden /> Fully booked today
          </p>
          <p className={styles.emptySubtitle}>No free windows left — next free time is tomorrow</p>
        </div>
        {onViewAnalytics && (
          <div className={styles.footer}>
            <button type="button" className={styles.footerBtnGhost} onClick={onViewAnalytics}>
              View full analytics →
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <Zap className={styles.headerIcon} size={18} strokeWidth={1.5} aria-hidden />
        <span className={styles.headerTitle}>Focus Windows</span>
      </div>

      {/* Summary: "X windows · Longest: Xh · Shortest: Xm" */}
      {summary && (
        <p className={styles.summary}>
          {summary.count} {summary.count === 1 ? "window" : "windows"} · Longest: {summary.longest} · Shortest: {summary.shortest}
        </p>
      )}

      {/* Best Window hero card */}
      {bestWindow && (
        <div className={styles.bestCard}>
          <span className={styles.bestLabel}>Best Window</span>
          <div className={styles.bestRow}>
            <div className={styles.bestLeft}>
              {isBestNow && (
                <div className={styles.bestNowBadge}>
                  <span className={styles.bestNowDot} aria-hidden />
                  <span>Available now</span>
                </div>
              )}
              <span className={styles.bestTimeRange}>
                {formatTime24(bestWindow.start)} – {formatTime24(bestWindow.end)}
              </span>
              <span className={styles.bestSuggestion}>
                {(() => {
                  const { text, Icon } = getSuggestion(bestWindow.minutes);
                  return (
                    <>
                      <Icon size={14} className={styles.bestSuggestionIcon} aria-hidden />
                      {text}
                    </>
                  );
                })()}
              </span>
            </div>
            <span className={styles.bestPill}>{formatDuration(bestWindow.minutes)}</span>
          </div>
        </div>
      )}

      {/* Other windows: Next / After */}
      {displayOthers.length > 0 && (
        <div className={styles.otherList}>
          {displayOthers.map((w, i) => {
            const label = i === 0 ? "Next:" : i === 1 ? "After:" : null;
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

      {/* Timeline bar */}
      <div className={styles.timelineWrap}>
        <span className={styles.timelineLabel}>8 AM</span>
        <div className={styles.timelineBarContainer}>
          <div className={styles.timelineBar}>
            {segments.map((seg, i) => (
              <span
                key={i}
                className={seg.free ? styles.timelineFree : styles.timelineBusy}
                style={{ width: `${((seg.end - seg.start) / TOTAL_DAY_MINS) * 100}%` }}
                title={seg.free && seg.window ? `${formatTime(seg.window.start.toISOString())} – ${formatTime(seg.window.end.toISOString())} (${formatDuration(seg.window.minutes)})` : undefined}
              />
            ))}
          </div>
          <span
            className={styles.timelineNow}
            style={{ left: `${nowPositionPct}%` }}
            title="Current time"
            aria-hidden
          />
        </div>
        <span className={styles.timelineLabel}>10 PM</span>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {onViewAnalytics && (
          <button type="button" className={styles.footerBtnGhost} onClick={onViewAnalytics}>
            View full analytics →
          </button>
        )}
        {onStartFocus && (
          <button type="button" className={styles.footerBtnPrimary} onClick={onStartFocus}>
            Start focus session →
          </button>
        )}
      </div>
    </div>
  );
}
