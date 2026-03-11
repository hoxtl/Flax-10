import React from "react";
import { getUserColor } from "./TaskAssigneePopup";
import styles from "./TaskAvatarStack.module.css";

export default function TaskAvatarStack({ assignees, max = 3, size = 20 }) {
    if (!assignees || assignees.length === 0) return null;

    const visible = assignees.slice(0, max);
    const remaining = assignees.length - max;

    return (
        <div className={styles.stack}>
            {visible.map((a, i) => (
                <div
                    key={a.id}
                    className={styles.avatar}
                    style={{
                        width: size,
                        height: size,
                        background: getUserColor(a.id),
                        marginLeft: i > 0 ? -(size * 0.3) : 0,
                        zIndex: max - i
                    }}
                    title={a.name}
                >
                    {(a.name || "?").slice(0, 2).toUpperCase()}
                </div>
            ))}
            {remaining > 0 && (
                <span className={styles.more} style={{ fontSize: size * 0.45 }}>
                    +{remaining}
                </span>
            )}
        </div>
    );
}
