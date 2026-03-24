/*
 * Shared widget primitives for module dashboard panels.
 */

import ExpandablePillButton from "../../Common/ExpandablePillButton/ExpandablePillButton";

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
        <ExpandablePillButton
            className={styles?.showMoreBtn}
            collapsedLabel={`+ ${hiddenCount} more`}
            expanded={expanded}
            onToggle={onToggle}
        />
    );
}
