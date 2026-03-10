import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, MapPin, Clock, AlignLeft } from 'lucide-react';
import { calculatePopoverPosition, calculateArrowPosition } from './popoverUtils';
import { isAllDayEvent } from '../utils/eventDisplayUtils';
import { formatTimeRange } from '../utils/dateUtils';
import styles from './EventPopover.module.css';

const EVENT_ACCENTS = { module: "#7B9BAD", society: "#C4906A" };

function ContextBadge({ event }) {
    if (!event) return null;
    if (event.module_name || event.moduleCode || event.module) {
        const label = event.module_name || event.moduleCode || `Module ${event.module}`;
        return <span className={styles.contextBadge} style={{ backgroundColor: EVENT_ACCENTS.module }}>{label}</span>;
    }
    if (event.society_name || event.society_id) {
        const label = event.society_name || 'Society Event';
        return <span className={styles.contextBadge} style={{ backgroundColor: EVENT_ACCENTS.society }}>{label}</span>;
    }
    return null;
}

function PopoverHeader({ title, tag, actions, onClose, readOnly, event }) {
    return (
        <div className={styles.titleRow}>
            <div>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.badgeRow}>
                    <ContextBadge event={event} />
                    {tag && <span className={styles.tagBadge} style={{ backgroundColor: tag.color }}>{tag.label}</span>}
                </div>
            </div>
            {!readOnly && (
                <div className={styles.actions}>
                    {actions?.map((act, i) => (
                        <button key={i} className={styles.actionBtn} onClick={() => { onClose(); act.onClick(); }} title={act.label}
                            style={act.variant === 'danger' ? { color: 'var(--danger, #dc3545)' } : {}}>
                            {act.label === 'Edit' ? <Pencil size={14} /> : act.label === 'Delete' ? <Trash2 size={14} /> : act.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function EventDetail({ icon, text }) {
    if (!text) return null;
    return (
        <div className={styles.detailRow}>
            <span className={styles.detailIcon}>{icon}</span>
            <span>{text}</span>
        </div>
    );
}

function DescriptionDetail({ text }) {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;
    return (
        <div className={styles.descriptionRow}>
            <span className={styles.detailIcon} style={{ marginTop: '2px' }}><AlignLeft size={14} /></span>
            <div className={`${styles.descriptionText} ${!expanded ? styles.truncated : ''}`} onClick={() => setExpanded(e => !e)}>
                {text}
            </div>
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
    }, [anchorRect, event, viewMode]);
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
    }, [onClose]);
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

export function EventPopover({ event, anchorRect, onClose, actions, tag, readOnly, viewMode }) {
    const popoverRef = useRef(null);
    const pos = usePopoverPosition(popoverRef, anchorRect, event, viewMode);
    usePopoverCloseEvents(popoverRef, onClose);

    if (!event || !anchorRect) return null;
    const arrowPos = calculateArrowPosition(anchorRect, pos, pos.placement);

    const arrowClsMap = {
        right: styles.popoverArrowRight,
        left: styles.popoverArrowLeft,
        top: styles.popoverArrowTop,
        bottom: styles.popoverArrowBottom,
        none: styles.popoverArrowNone
    };
    const arrowCls = arrowClsMap[pos.placement] || styles.popoverArrowNone;
    const isVertical = pos.placement === 'top' || pos.placement === 'bottom';
    const arrowStyle = isVertical ? { left: arrowPos } : { top: arrowPos };

    const content = (
        <>
            <div className={styles.popoverOverlay} onMouseDown={onClose} />
            <div ref={popoverRef} className={styles.popoverContainer} style={{ top: pos.top, left: pos.left }}>
                <div className={`${styles.popoverArrow} ${arrowCls}`} style={arrowStyle} />
                <EventPopoverContent event={event} tag={tag} actions={actions} onClose={onClose} readOnly={readOnly} />
            </div>
        </>
    );

    return createPortal(content, document.body);
}
