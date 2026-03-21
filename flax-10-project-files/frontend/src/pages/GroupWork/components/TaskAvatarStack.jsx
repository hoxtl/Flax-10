/**
 * TaskAvatarStack — shows a stacked row of member avatars (photo or initials).
 * Uses the shared MemberAvatar component.
 */
import MemberAvatar from "./MemberAvatar";
import { getDisplayName, openMemberProfile } from "./memberAvatarUtils";
import styles from "./TaskAvatarStack.module.css";

function OverflowBadge({ count, size }) {
    return (
        <span className={styles.more} style={{ fontSize: size * 0.45 }}>
            +{count}
        </span>
    );
}

export default function TaskAvatarStack({ assignees, max = 3, size = 20 }) {
    if (!assignees || assignees.length === 0) return null;
    const visible = assignees.slice(0, max);
    const remaining = assignees.length - max;
    return (
        <div className={styles.stack}>
            {visible.map((a, i) => (
                <div key={a.id} style={{ marginLeft: i > 0 ? -(size * 0.3) : 0, zIndex: max - i }}>
                    <button
                        type="button"
                        className={styles.avatarButton}
                        title={getDisplayName(a)}
                        aria-label={`Open ${getDisplayName(a)} profile`}
                        onClick={(event) => openMemberProfile(event, a)}
                    >
                        <MemberAvatar member={a} size={size} />
                    </button>
                </div>
            ))}
            {remaining > 0 && <OverflowBadge count={remaining} size={size} />}
        </div>
    );
}
