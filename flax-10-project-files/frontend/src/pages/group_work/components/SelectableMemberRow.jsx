/*
 * A selectable row showing a member avatar and name with a checkbox.
 */

import MemberAvatar from "./MemberAvatar";
import { getDisplayName } from "../utils/memberAvatarUtils";

export default function SelectableMemberRow({ member, checked, onToggle, classNames = {}, avatarSize = 24 }) {
  const id = String(member.user ?? member.id ?? "");
  return (
    <label className={classNames.row} htmlFor={`member-filter-${id}`}>
      <input
        id={`member-filter-${id}`}
        type="checkbox"
        className={classNames.checkbox}
        checked={checked}
        onChange={() => onToggle(id)}
      />
      <MemberAvatar member={member} size={avatarSize} />
      <span className={classNames.label}>{getDisplayName(member)}</span>
    </label>
  );
}
