/* Event details popover with dynamic positioning and actions. */
import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, MapPin, Clock, AlignLeft } from 'lucide-react';
import { calculatePopoverPosition, calculateArrowPosition } from './popoverUtils';
import { isAllDayEvent } from '../utils/eventDisplayUtils';
import { formatTimeRange } from '../utils/dateUtils';
import Badge from '../../common/Badge/Badge';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import styles from './EventPopover.module.css';

const EVENT_ACCENTS = { module: "var(--sage)", society: "var(--primary)" };

const makeBadgeStyle = (color) => ({ '--badge-color': color });

function ContextBadge({ event }) {
  if (!event) return null;
  if (event.module_name || event.moduleCode || event.module) {
    const label = event.module_name || event.moduleCode || `Module ${event.module}`;
    return <Badge className={`${styles.contextBadge} ${styles.coloredBadge}`} style={makeBadgeStyle(EVENT_ACCENTS.module)}>{label}</Badge>;
  }
  if (event.society_name || event.society_id) {
    return <Badge className={`${styles.contextBadge} ${styles.coloredBadge}`} style={makeBadgeStyle(EVENT_ACCENTS.society)}>{event.society_name || 'Society Event'}</Badge>;
  }
  return null;
}

function ActionButton({ action, onClose }) {
  const icon = action.label === 'Edit' ? <Pencil size={14} /> : action.label === 'Delete' ? <Trash2 size={14} /> : action.label;
  return (
    <PrimaryButton className={styles.actionBtn} onClick={() => { onClose(); action.onClick(); }}
      title={action.label} variant={action.variant === 'danger' ? 'danger' : 'ghost'} size="small" pill>{icon}</PrimaryButton>
  );
}

function PopoverHeader({ title, tag, actions, onClose, readOnly, event }) {
  return (
    <div className={styles.titleRow}>
      <div>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.badgeRow}>
          <ContextBadge event={event} />
          {tag && <Badge className={`${styles.tagBadge} ${styles.coloredBadge}`} style={makeBadgeStyle(tag.color)}>{tag.label}</Badge>}
        </div>
      </div>
      {!readOnly && <div className={styles.actions}>{actions?.map((act, i) => <ActionButton key={i} action={act} onClose={onClose} />)}</div>}
    </div>
  );
}

function EventDetail({ icon, text }) {
  if (!text) return null;
  return <div className={styles.detailRow}><span className={styles.detailIcon}>{icon}</span><span>{text}</span></div>;
}

function DescriptionDetail({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  return (
    <div className={styles.descriptionRow}>
      <span className={styles.detailIcon} style={{ marginTop: '2px' }}><AlignLeft size={14} /></span>
      <div className={`${styles.descriptionText} ${!expanded ? styles.truncated : ''}`} onClick={() => setExpanded(e => !e)}>{text}</div>
    </div>
  );
}

function usePopoverPosition(popoverRef, anchorRect, event, viewMode) {
  const [position, setPosition] = useState({ top: -9999, left: -9999, placement: 'right' });
  useLayoutEffect(() => {
    if (!popoverRef.current || !anchorRect) return;
    let currentTop = null;
    const update = () => {
      if (!popoverRef.current) return;
      const pos = calculatePopoverPosition(anchorRect, popoverRef.current.offsetWidth, popoverRef.current.offsetHeight, window.innerWidth, window.innerHeight, currentTop, viewMode);
      currentTop = pos.top;
      setPosition(pos);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(popoverRef.current);
    return () => obs.disconnect();
  }, [anchorRect, event, popoverRef, viewMode]);
  return position;
}

function usePopoverCloseEvents(popoverRef, onClose) {
  useEffect(() => {
    const handle = (e) => {
      if (e.type === 'keydown' && e.key === 'Escape') onClose();
      if (e.type === 'mousedown' && popoverRef.current && !popoverRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handle);
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('keydown', handle); };
  }, [onClose, popoverRef]);
}

function EventPopoverContent({ event, tag, actions, onClose, readOnly }) {
  return (
    <div className={styles.popoverContent}>
      <PopoverHeader event={event} title={event.title} tag={tag} actions={actions} onClose={onClose} readOnly={readOnly} />
      <EventDetail icon={<Clock size={14} />} text={formatTimeRange(event.start_time, event.end_time, isAllDayEvent(event))} />
      <EventDetail icon={<MapPin size={14} />} text={event.location} />
      <DescriptionDetail text={event.description} />
    </div>
  );
}

function getArrowClass(placement) {
  const map = { right: styles.popoverArrowRight, left: styles.popoverArrowLeft, top: styles.popoverArrowTop, bottom: styles.popoverArrowBottom, none: styles.popoverArrowNone };
  return map[placement] || styles.popoverArrowNone;
}

function getArrowStyle(pos, anchorRect) {
  const arrowPos = calculateArrowPosition(anchorRect, pos, pos.placement);
  return (pos.placement === 'top' || pos.placement === 'bottom') ? { left: arrowPos } : { top: arrowPos };
}

function PopoverPortal({ popoverRef, pos, arrowStyle, event, tag, actions, onClose, readOnly }) {
  const containerPos = { '--popover-top': `${pos.top}px`, '--popover-left': `${pos.left}px` };
  return createPortal(
    <>
      <div className={styles.popoverOverlay} onMouseDown={onClose} aria-hidden="true" />
      <div ref={popoverRef} className={styles.popoverContainer} style={containerPos}>
        <div className={`${styles.popoverArrow} ${getArrowClass(pos.placement)}`} style={arrowStyle} />
        <EventPopoverContent event={event} tag={tag} actions={actions} onClose={onClose} readOnly={readOnly} />
      </div>
    </>,
    document.body
  );
}

/* Event details popover with dynamic positioning. */
export function EventPopover({ event, anchorRect, onClose, actions, tag, readOnly, viewMode }) {
  const popoverRef = useRef(null);
  const pos = usePopoverPosition(popoverRef, anchorRect, event, viewMode);
  usePopoverCloseEvents(popoverRef, onClose);
  if (!event || !anchorRect) return null;
  return <PopoverPortal popoverRef={popoverRef} pos={pos} arrowStyle={getArrowStyle(pos, anchorRect)} event={event} tag={tag} actions={actions} onClose={onClose} readOnly={readOnly} />;
}
