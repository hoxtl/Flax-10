import React from "react";
import { getUserColor } from "./TaskAssigneePopup";
import styles from "./TaskAvatarStack.module.css";

function MemberAvatar({ assignee, size }) {
    // Supports profile_photo_url from the backend serialiser, or any avatar-like field
    const photoUrl = assignee.profile_photo_url || assignee.profile_photo || assignee.avatar;
    const initial = assignee.first_name && assignee.last_name
        ? `${assignee.first_name[0]}${assignee.last_name[0]}`.toUpperCase()
        : (assignee.first_name?.[0] || assignee.name?.[0] || assignee.user_name?.[0] || "?").toUpperCase();
    const bg = getUserColor(assignee.id);

    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={assignee.name || assignee.user_name || ""}
                className={styles.avatar}
                style={{ width: size, height: size }}
                title={assignee.name || assignee.user_name || ""}
            />
        );
    }
    return (
        <div
            className={styles.avatar}
            style={{ width: size, height: size, background: bg }}
            title={assignee.name || assignee.user_name || ""}
        >
            {initial}
        </div>
    );
}

export default function TaskAvatarStack({ assignees, max = 3, size = 20 }) {
    if (!assignees || assignees.length === 0) return null;

    const visible = assignees.slice(0, max);
    const remaining = assignees.length - max;

    return (
        <div className={styles.stack}>
            {visible.map((a, i) => (
                <div
                    key={a.id}
                    style={{ marginLeft: i > 0 ? -(size * 0.3) : 0, zIndex: max - i }}
                >
                    <MemberAvatar assignee={a} size={size} />
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
