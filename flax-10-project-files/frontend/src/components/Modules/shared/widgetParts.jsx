/*
 * Shared widget primitives for module dashboard panels.
 */

import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

/* Shared panel header for module dashboard widgets. */
export function WidgetHeader({ icon, title, count, styles }) {
    const HeaderIcon = icon;
    return (
        <div className={styles.widgetHeader}>
            <div className={styles.widgetIconWrap}>
                <HeaderIcon size={17} strokeWidth={1.85} aria-hidden />
            </div>
            <span className={styles.widgetTitle}>{title}</span>
            {count > 0 ? <span className={styles.widgetCount}>{count}</span> : null}
        </div>
    );
}

/* Shared expand and collapse button for module dashboard widgets. */
export function ShowMoreButton({ expanded, hiddenCount, onToggle, styles }) {
    return (
        <Motion.button type="button" className={styles.showMoreBtn} onClick={onToggle} whileTap={{ scale: 0.98 }}>
            {expanded
                ? <><ChevronUp size={14} strokeWidth={2.5} aria-hidden /> Show less</>
                : <><ChevronDown size={14} strokeWidth={2.5} aria-hidden /> + {hiddenCount} more</>}
        </Motion.button>
    );
}
