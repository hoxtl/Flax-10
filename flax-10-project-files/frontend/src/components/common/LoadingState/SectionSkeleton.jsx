import styles from "./SectionSkeleton.module.css";
import SkeletonBlock from "./SkeletonBlock";

export default function SectionSkeleton({
    label = "Loading section",
    rows = 3,
    showHeader = true,
    showButton = true,
}) {
    return (
        <div className={styles.wrap} aria-busy="true" aria-label={label}>
            {showHeader && (
                <div className={styles.header}>
                    <SkeletonBlock className={styles.title} />
                    <SkeletonBlock className={styles.subtitle} />
                </div>
            )}
            <div className={styles.body}>
                {Array.from({ length: rows }).map((_, index) => (
                    <SkeletonBlock key={index} className={styles.row} />
                ))}
            </div>
            {showButton && <SkeletonBlock className={styles.button} />}
        </div>
    );
}
