import styles from "./tabs.module.css";

export default function AboutTab({ details }) {
    return (
        <div className={styles.aboutTab}>
            <AboutSection text={details.about} />
        </div>
    );
}

function AboutSection({ text }) {
    if (!text) return <p className={styles.empty}>No about information yet.</p>;
    return <p className={styles.aboutText}>{text}</p>;
}
