import styles from "./WidgetHeader.module.css";

export default function WidgetHeader({
  actions = null,
  className = "",
  count = null,
  countClassName = "",
  divider = true,
  icon: Icon,
  meta = null,
  metaClassName = "",
  title,
  titleClassName = "",
}) {
  const hasCount = count !== null && count !== undefined && count !== false;
  return (
    <div className={[styles.header, divider ? styles.divider : "", className].filter(Boolean).join(" ")}>
      <div className={styles.leading}>
        {Icon ? (
          <div className={styles.iconWrap} aria-hidden>
            <Icon size={17} strokeWidth={1.85} />
          </div>
        ) : null}
        <div className={styles.copy}>
          <div className={styles.titleRow}>
            <span className={[styles.title, titleClassName].filter(Boolean).join(" ")}>{title}</span>
            {meta ? <span className={[styles.meta, metaClassName].filter(Boolean).join(" ")}>{meta}</span> : null}
          </div>
        </div>
      </div>
      {(actions || hasCount) ? (
        <div className={styles.trailing}>
          {actions}
          {hasCount ? <span className={[styles.count, countClassName].filter(Boolean).join(" ")}>{count}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
