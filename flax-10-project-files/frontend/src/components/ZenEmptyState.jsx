import styles from "./ZenEmptyState.module.css";

function SproutSvg({ className, ...props }) {
    return (
        <svg className={className} width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
            <path d="M28 44V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <path d="M28 24c-8 0-14 6-12 12 2-4 6-6 12-6z" fill="currentColor" opacity="0.85" />
            <path d="M28 24c8 0 14 6 12 12-2-4-6-6-12-6z" fill="currentColor" opacity="0.7" />
            <path d="M28 20c-3 0-5 2-4 5 1-2 3-3 4-3s3 1 4 3c1-3-1-5-4-5z" fill="currentColor" opacity="0.9" />
            <ellipse cx="28" cy="46" rx="8" ry="3" fill="currentColor" opacity="0.5" />
        </svg>
    );
}

export default function ZenEmptyState({ text = "All caught up! Time for a break?", children, className, calm }) {
    return (
        <div className={`${styles.wrap} ${className || ""}`}>
            <SproutSvg className={styles.icon} />
            <p className={`${styles.text} ${calm ? styles.textCalm : ""}`}>{text}</p>
            {children && <div className={styles.action}>{children}</div>}
        </div>
    );
}
