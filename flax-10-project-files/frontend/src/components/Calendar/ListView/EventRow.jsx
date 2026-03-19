/**
 * EventRow - Expandable event row for list view.
 * Shows event summary with optional detail expansion.
 */
import { useState } from 'react';
import { getEventType, isReadOnlyEvent, isAllDay } from '../utils/eventUtils';
import { useEventModal, useCalendarDispatch } from '../../../context/CalendarContext';
import { useConfirm } from '../../../context/ConfirmContext';

import { useQuickActions } from '../hooks/useQuickActions';
import { useTags } from '../../../context/TagContext';
import { getEventTheme } from '../utils/eventStyleUtils';
import Badge from '../../common/Badge/Badge';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import styles from './ListView.module.css';

function formatEventTime(event) {
  if (isAllDay(event)) return 'All day';
  const start = new Date(event.start_time);
  return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatTimeRange(event) {
  if (isAllDay(event)) return 'All day';
  const opts = { hour: 'numeric', minute: '2-digit', hour12: true };
  const from = new Date(event.start_time).toLocaleTimeString('en-US', opts);
  const to = new Date(event.end_time).toLocaleTimeString('en-US', opts);
  return `${from} - ${to}`;
}

function getDurationLabel(event) {
  if (isAllDay(event)) return 'All day';
  const minutes = Math.max(0, Math.round((new Date(event.end_time) - new Date(event.start_time)) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function getTagBadges(event, accentColor) {
  const tagName = event.tag_name || event.tag?.name;
  const badges = tagName ? [{ label: tagName, type: 'tag', color: accentColor }] : [];
  const eventType = getEventType(event);
  if (eventType === 'module' && event.module?.name) badges.push({ label: event.module.name, type: 'source' });
  if (eventType === 'society' && event.society_name) badges.push({ label: event.society_name, type: 'source', color: event.society_color || accentColor });
  return badges;
}

function TagBadge({ badge }) {
  const className = badge.type === 'source' ? styles.sourceBadge : styles.tagBadge;
  const style = badge.color ? { backgroundColor: badge.color, color: 'var(--c-white)', borderColor: badge.color } : undefined;
  return <Badge className={className} tone={badge.type === 'source' ? "default" : "muted"} style={style}>{badge.label}</Badge>;
}

function DetailRow({ label, value, muted, full }) {
  const rowClass = full ? `${styles.detailItem} ${styles.detailFullRow}` : styles.detailItem;
  return (
    <div className={rowClass}>
      <div className={styles.detailLabel}>{label}</div>
      <div className={muted ? styles.detailValueMuted : styles.detailValue}>{value}</div>
    </div>
  );
}

function DetailButton({ variant = 'secondary', onClick, children, className }) {
  const btnVariant = variant === 'primary' ? 'primary' : variant === 'danger' ? 'danger' : 'ghost';
  return (
    <PrimaryButton type="button" className={`${styles.detailButton} ${className || ''}`} onClick={onClick}
      variant={btnVariant} size="small" pill>{children}</PrimaryButton>
  );
}

/** Renders a single row in the calendar list view with expandable details. */
export function EventRow({ event }) {
  const state = useEventRowState(event);
  const rowClass = `${styles.eventRow} ${state.expanded ? styles.expanded : ''} ${state.readOnly ? styles.readOnly : ''}`;
  return (
    <div className={rowClass} onClick={() => state.setExpanded(p => !p)}>
      <EventRowMain event={event} themeColor={state.accentColor} badges={state.badges} expanded={state.expanded} />
      {state.expanded && <EventRowDetail event={event} readOnly={state.readOnly} hasQuick={!!state.quickAction}
        onEdit={state.handlers.onEdit} onDelete={state.handlers.onDelete} onUnimap={state.handlers.onUnimap} onQuick={state.handlers.onQuick} quickLabel={state.quickAction?.label} />}
    </div>
  );
}

function EventRowMain({ event, themeColor, badges, expanded }) {
  return (
    <div className={styles.eventMain}>
      <div className={styles.eventStrip} style={{ backgroundColor: themeColor }} />
      <div className={styles.eventTime}>{formatEventTime(event)}</div>
      <div className={styles.eventName}>{event.title}</div>
      <div className={styles.badgesContainer}>{badges.map((badge, i) => <TagBadge key={i} badge={badge} />)}</div>
      <div className={styles.eventChevron}>{expanded ? '▲' : '▼'}</div>
    </div>
  );
}

function EventRowDetail({ event, readOnly, hasQuick, onEdit, onDelete, onUnimap, onQuick, quickLabel }) {
  const typeLabel = event.tag_name || event.tag?.name || getEventType(event);
  const timeLabel = `${formatTimeRange(event)} · ${getDurationLabel(event)}`;
  return (
    <div className={styles.eventDetail}>
      <div className={styles.detailGrid}>
        <DetailRow label="Time" value={timeLabel} />
        <DetailRow label="Type" value={typeLabel} />
        <DetailRow label="Location" value={event.location || '-'} muted={!event.location} full />
        <DetailRow label="Description" value={event.description || '-'} muted={!event.description} full />
      </div>
      <div className={styles.detailActions}>
        {!readOnly && (
          <>
            <DetailButton variant="primary" onClick={onEdit}>Edit</DetailButton>
            <DetailButton variant="danger" onClick={onDelete}>Delete</DetailButton>
          </>
        )}
        <DetailButton onClick={onUnimap}>Get directions</DetailButton>
        {readOnly && hasQuick && <DetailButton onClick={onQuick}>{quickLabel}</DetailButton>}
      </div>
    </div>
  );
}

function useEventRowState(event) {
  const [expanded, setExpanded] = useState(false);
  const { openModal } = useEventModal();
  const dispatch = useCalendarDispatch();
  const confirm = useConfirm();
  const tagContext = useTags();
  const quickAction = useQuickActions(event);
  const accentColor = getEventTheme(event, tagContext).color;
  const badges = getTagBadges(event, accentColor);
  const readOnly = isReadOnlyEvent(event);

  const onDelete = async (e) => {
    e.stopPropagation();
    const yes = await confirm({
      title: "Delete Event", message: `Are you sure you want to delete "${event.title}"?`,
      confirmText: "Delete", cancelText: "Cancel", isDanger: true
    });
    if (yes) dispatch({ type: 'DELETE_EVENT', payload: event.id });
  };

  const handlers = {
    onEdit: (e) => { e.stopPropagation(); openModal(event); },
    onDelete,
    onUnimap: (e) => { e.stopPropagation(); window.open('/map', '_blank', 'noopener,noreferrer'); },
    onQuick: (e) => { e.stopPropagation(); quickAction?.onClick(); }
  };
  return { expanded, setExpanded, accentColor, badges, readOnly, quickAction, handlers };
}
