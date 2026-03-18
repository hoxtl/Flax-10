/**
 * Centralized skeleton components for showing loading states across
 * the society discovery and detail views.
 */
import styles from "./SocietiesPage.module.css";
import detailStyles from "./SocietyDetailPage.module.css";

/** Skeleton for the main societies directory page. */
export function SocietiesSkeleton() {
    return (
        <div className={styles.container}>
            <div className={`${styles.skel} ${styles.skelPageTitle}`} />
            <div className={styles.skelGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={`${styles.skel} ${styles.skelSocCard}`}
                        style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
            </div>
        </div>
    );
}

/** Skeleton for the society detail view. */
export function SocietyDetailSkeleton() {
    return (
        <div className={detailStyles.page}>
            <SkelTopBar />
            <div className={`${detailStyles.skel} ${detailStyles.skelHero}`} />
            <SkelTabs />
            <SkelBody />
        </div>
    );
}

function SkelTopBar() {
    return (
        <div className={detailStyles.skelTopBar}>
            <div className={`${detailStyles.skel} ${detailStyles.skelBackBtn}`} />
        </div>
    );
}

function SkelTabs() {
    return (
        <div className={detailStyles.skelTabRow}>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${detailStyles.skel} ${detailStyles.skelTab}`}
                    style={{ animationDelay: `${i * 0.06}s` }} />
            ))}
        </div>
    );
}

function SkelBody() {
    return (
        <div className={detailStyles.skelBody}>
            <div className={detailStyles.skelMain}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`${detailStyles.skel} ${detailStyles.skelBlock}`}
                        style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
            </div>
            <div className={`${detailStyles.skel} ${detailStyles.skelSidePanel}`} />
        </div>
    );
}
