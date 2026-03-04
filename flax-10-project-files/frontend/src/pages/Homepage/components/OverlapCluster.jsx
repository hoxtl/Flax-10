/**
 * Overlap cluster — side-by-side display of overlapping events.
 */

import { useState, useMemo } from "react";
import { useTags } from "../../../context/TagContext";
import { isNow, resolveEventIcon, eventAccentColor, scheduleCardBorderColor } from "../utils/eventUtils";
import { formatTime } from "../utils/dateFormatUtils";
import { isNightSlot } from "../utils/slotUtils.js";
import { ClusterCard } from "./ClusterCard.jsx";
import styles from "../Homepage.module.css";

export function OverlapCluster({ items, onDelete, onEdit, onApplySuggestion }) {
  const { getTag } = useTags();
  const [expanded, setExpanded] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const firstStart = formatTime(items[0].start_time);

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
  const nightSlot = isNightSlot(items[0]?.start_time);

  const resolution = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const durA = new Date(a.end_time) - new Date(a.start_time);
      const durB = new Date(b.end_time) - new Date(b.start_time);
      return durB - durA;
    });
    const keep = sorted[0];
    const rest = sorted.slice(1);
    const suggestions = [];
    let cursor = new Date(keep.end_time);
    for (const ev of rest) {
      const dur = new Date(ev.end_time) - new Date(ev.start_time);
      const newStart = new Date(cursor);
      const newEnd = new Date(cursor.getTime() + dur);
      suggestions.push({
        event: ev,
        suggestedStart: newStart,
        suggestedEnd: newEnd,
        label: `${formatTime(newStart.toISOString())}–${formatTime(newEnd.toISOString())}`,
      });
      cursor = newEnd;
    }
    return { keep, suggestions };
  }, [items]);

  return (
    <div className={`${styles.clusterRow} ${nightSlot ? styles.nightSlot : ""}`}>
      <div className={styles.gutter}>
        <span className={styles.gutterTime}>{firstStart}</span>
      </div>

      <div className={styles.clusterCards}>
        {hasActiveNow && nowLinePercent != null && (
          <div className={styles.clusterNowLine} style={{ top: `${nowLinePercent}%` }} aria-hidden />
        )}
        <div className={styles.overlapHeader}>
          <div className={styles.overlapBadge}>⚡ {items.length} events overlap</div>
          <div className={styles.overlapActions}>
            <button className={styles.overlapResolveBtn} onClick={() => setResolveOpen((r) => !r)} title="Resolve overlap">
              {resolveOpen ? "Hide suggestions" : "✨ Resolve"}
            </button>
            <button className={styles.overlapExpandBtn} onClick={() => setExpanded((e) => !e)} title="Show events">
              {expanded ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {(expanded || true) && (
          <div className={styles.clusterCardsRow}>
            {items.map((item) => {
              const theme = getTag(item.tag) || { color: "#94A3B8", icon: "📅" };
              const icon = resolveEventIcon(item, theme.icon);
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

        {resolveOpen && (
          <div className={styles.resolvePanel}>
            <div className={styles.resolvePanelHeader}>
              <span className={styles.resolvePanelTitle}>✨ Suggested fix</span>
              <span className={styles.resolvePanelSub}>
                Keep <strong>"{resolution.keep.title}"</strong>, reschedule the rest:
              </span>
            </div>
            {resolution.suggestions.map((s) => (
              <div key={s.event.id} className={styles.resolveSuggestion}>
                <div className={styles.resolveSuggestLeft}>
                  <span className={styles.resolveName}>{s.event.title}</span>
                  <span className={styles.resolveTime}>{s.label}</span>
                </div>
                <button className={styles.resolveApplyBtn} onClick={() => onApplySuggestion?.(s)}>
                  Apply
                </button>
              </div>
            ))}
            <p className={styles.resolvePanelNote}>Or right-click any event to edit manually.</p>
          </div>
        )}
      </div>
    </div>
  );
}
