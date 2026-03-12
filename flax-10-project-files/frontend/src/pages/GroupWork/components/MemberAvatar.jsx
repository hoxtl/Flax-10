/**
 * MemberAvatar — shows a user's profile photo, or initials (first+last) with a color background.
 * Reusable across TaskAvatarStack and TaskAssigneePopup.
 */
import { getUserColor } from "../utils/priorityUtils";
import styles from "./MemberAvatar.module.css";

function getInitials(member) {
    if (member.first_name && member.last_name)
        return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    const name = member.user_name || member.name || member.first_name || "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.[0] || "?").toUpperCase();
}

function getDisplayName(member) {
    if (member.first_name)
        return `${member.first_name} ${member.last_name || ""}`.trim();
    return member.user_name || member.name || "";
}

export function getPhotoUrl(member) {
    return member.profile_photo_url || member.profile_photo || member.avatar || null;
}

export default function MemberAvatar({ member, size = 24 }) {
    const photoUrl = getPhotoUrl(member);
    const sizeStyle = { width: size, height: size };
    const name = getDisplayName(member);

    if (photoUrl) {
        return <img src={photoUrl} alt={name} className={styles.avatar} style={sizeStyle} />;
    }
    return (
        <div
            className={styles.avatar}
            style={{ ...sizeStyle, background: getUserColor(member.user ?? member.id) }}
        >
            {getInitials(member)}
        </div>
    );
}

export { getDisplayName, getInitials };
