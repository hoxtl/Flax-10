import { useState } from "react";
import styles from "./tabs.module.css";

export default function AboutTab({ details, editMode, onUpdate }) {
    if (editMode) return <AboutEditor text={details.about} onUpdate={onUpdate} />;
    return <AboutDisplay text={details.about} />;
}

function AboutDisplay({ text }) {
    if (!text) return <p className={styles.empty}>No about information yet.</p>;
    return <p className={styles.aboutText}>{text}</p>;
}

function AboutEditor({ text, onUpdate }) {
    const [val, setVal] = useState(text || "");
    const isDirty = val !== (text || "");

    return (
        <div className={styles.editorContainer}>
            <textarea className={styles.aboutInput} value={val}
                onChange={e => setVal(e.target.value)} placeholder="Write about your society..." />
            <div className={styles.editorActions}>
                <button className={styles.cancelBtn} onClick={() => onUpdate?.(text)}>Cancel</button>
                <button className={styles.saveBtn} onClick={() => onUpdate?.(val)} disabled={!isDirty}>
                    {isDirty ? "Save Changes" : "Saved"}
                </button>
            </div>
        </div>
    );
}
