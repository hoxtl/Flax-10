/*
 * Shared selectable member row used by GroupWork pickers.
 */

import MemberAvatar from "./MemberAvatar";
import { getDisplayName } from "../utils/memberAvatarUtils";

function toUserId(member) {
  return String(member.user ?? member.id);
}

export default function SelectableMemberRow({ member, checked, onToggle, classNames, avatarSize }) {
  const userId = toUserId(member);
  return (
    <div className={classNames.row} onClick={() => onToggle(userId)}>
      <input type="checkbox" checked={checked} onChange={() => onToggle(userId)} className={classNames.checkbox} onClick={(event) => event.stopPropagation()} />
      <MemberAvatar member={member} size={avatarSize} />
      <span className={classNames.label}>{getDisplayName(member)}</span>
    </div>
  );
}
