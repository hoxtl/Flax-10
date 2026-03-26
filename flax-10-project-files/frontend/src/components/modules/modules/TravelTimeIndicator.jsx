import styles from './TravelTimeIndicator.module.css';


export default function TravelTimeIndicator({ duration }) {
    if (!duration) return null;

    return (
        <div className={styles.travelTimeCard}>
        <span className={styles.travelIcon}>🚇</span>
        <div className={styles.travelContent}>
            <span className={styles.travelLabel}>Travel time from home</span>
            <span className={styles.travelDuration}>{duration} min via TfL</span>
        </div>
        </div>
    );
}