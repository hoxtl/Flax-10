import styles from "./PageSkeleton.module.css";

function ShimmerBlock({ className = "", style }) {
    const classNames = className ? `${styles.skel} ${className}` : styles.skel;
    return <div className={classNames} style={style} />;
}

export default function PageSkeleton({
    label = "Loading page",
    showAction = false,
    showSearch = false,
    cardCount = 6,
    cardHeight = "180px",
    columns = 3,
}) {
    return (
        <div className={styles.container} aria-busy="true">
            <span className={styles.srOnly}>{label}</span>
            <div className={styles.header}>
                <ShimmerBlock className={styles.title} />
                {showAction && <ShimmerBlock className={styles.action} />}
            </div>
            {showSearch && <ShimmerBlock className={styles.search} />}
            <div className={styles.grid} style={{ "--page-skeleton-columns": columns }}>
                {Array.from({ length: cardCount }).map((_, index) => (
                    <ShimmerBlock
                        key={index}
                        className={styles.card}
                        style={{ height: cardHeight, animationDelay: `${index * 0.08}s` }}
                    />
                ))}
            </div>
        </div>
    );
}
