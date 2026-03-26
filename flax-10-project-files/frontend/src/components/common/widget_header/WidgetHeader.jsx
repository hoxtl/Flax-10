/*
 * Reusable widget header with icon, title, meta, count, and actions.
 */

import styles from "./WidgetHeader.module.css";

function HeaderIcon({ Icon }) {
  if (!Icon) return null;
  return <div className={styles.iconWrap} aria-hidden><Icon size={17} strokeWidth={1.85} /></div>;
}

function HeaderCopy({ title, titleClassName, meta, metaClassName }) {
  return (
    <div className={styles.copy}>
      <div className={styles.titleRow}>
        <span className={[styles.title, titleClassName].filter(Boolean).join(" ")}>{title}</span>
        {meta ? <span className={[styles.meta, metaClassName].filter(Boolean).join(" ")}>{meta}</span> : null}
      </div>
    </div>
  );
}

function HeaderTrailing({ actions, count, countClassName, hasCount }) {
  if (!actions && !hasCount) return null;
  return (
    <div className={styles.trailing}>
      {actions}
      {hasCount ? <span className={[styles.count, countClassName].filter(Boolean).join(" ")}>{count}</span> : null}
    </div>
  );
}

export default function WidgetHeader({ actions = null, className = "", count = null, countClassName = "", divider = true, icon: Icon, meta = null, metaClassName = "", title, titleClassName = "" }) {
  const hasCount = count !== null && count !== undefined && count !== false;
  return (
    <div className={[styles.header, divider ? styles.divider : "", className].filter(Boolean).join(" ")}>
      <div className={styles.leading}>
        <HeaderIcon Icon={Icon} />
        <HeaderCopy title={title} titleClassName={titleClassName} meta={meta} metaClassName={metaClassName} />
      </div>
      <HeaderTrailing actions={actions} count={count} countClassName={countClassName} hasCount={hasCount} />
    </div>
  );
}
