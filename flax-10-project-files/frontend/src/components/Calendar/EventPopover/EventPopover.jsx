import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, MapPin, Clock, AlignLeft } from 'lucide-react';
import { calculatePopoverPosition, calculateArrowPosition } from './popoverUtils';
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

function formatTimeRange(start, end) {
    if (!start) return '';
    const s = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const e = end ? new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return e ? `${s} - ${e}` : s;
}

function usePopoverPosition(popoverRef, anchorRect, event) {
    const [position, setPosition] = useState({ top: -9999, left: -9999, placement: 'right' });
    useLayoutEffect(() => {
        if (!popoverRef.current || !anchorRect) return;
        let currentTop = null;
        const update = () => {
            if (!popoverRef.current) return;
            const pos = calculatePopoverPosition(anchorRect, popoverRef.current.offsetWidth, popoverRef.current.offsetHeight, window.innerWidth, window.innerHeight, currentTop);
            currentTop = pos.top;
            setPosition(pos);
        };
        update();
        const obs = new ResizeObserver(update);
        obs.observe(popoverRef.current);
        return () => obs.disconnect();
    }, [anchorRect, event]);
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
            <EventDetail icon={<Clock size={14} />} text={formatTimeRange(event.start_time, event.end_time)} />
            <EventDetail icon={<MapPin size={14} />} text={event.location} />
            <DescriptionDetail text={event.description} />
        </div>
    );
}

export function EventPopover({ event, anchorRect, onClose, actions, tag, readOnly }) {
    const popoverRef = useRef(null);
    const pos = usePopoverPosition(popoverRef, anchorRect, event);
    usePopoverCloseEvents(popoverRef, onClose);

    if (!event || !anchorRect) return null;
    const arrowTop = calculateArrowPosition(anchorRect, pos.top);
    const arrowCls = pos.placement === 'right' ? styles.popoverArrowRight : pos.placement === 'left' ? styles.popoverArrowLeft : styles.popoverArrowNone;

    const content = (
        <>
            <div className={styles.popoverOverlay} onMouseDown={onClose} />
            <div ref={popoverRef} className={styles.popoverContainer} style={{ top: pos.top, left: pos.left }}>
                <div className={`${styles.popoverArrow} ${arrowCls}`} style={{ top: arrowTop }} />
                <EventPopoverContent event={event} tag={tag} actions={actions} onClose={onClose} readOnly={readOnly} />
            </div>
        </>
    );

    return createPortal(content, document.body);
}
