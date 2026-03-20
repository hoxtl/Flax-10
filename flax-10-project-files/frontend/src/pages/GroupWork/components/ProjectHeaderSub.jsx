import React from "react";
import { Trash2 } from "lucide-react";
import BackButton from "./BackButton";
import styles from "./ProjectHeader.module.css";

export default function ProjectHeaderActions({ onBack, onDelete }) {
    return (
        <div className={styles.topActions}>
            <BackButton onClick={onBack} />
            <button className={styles.deleteBtn} onClick={onDelete}>
                <Trash2 size={14} />
                Delete project
            </button>
        </div>
    );
}

export function ProjectHeaderTitle({ name, onPatch }) {
    const onBlur = e => { 
        const v = e.target.value.trim(); 
        if (v && v !== name) onPatch({ name: v }); 
    };
    
    return (
        <input 
            defaultValue={name} 
            onBlur={onBlur} 
            className={styles.nameInput} 
            placeholder="Project Name"
        />
    );
}
