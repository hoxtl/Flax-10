/*
 * A selectable row showing a member avatar and name with a checkbox.
 */

import MemberAvatar from "./MemberAvatar";
import { getDisplayName } from "../utils/memberAvatarUtils";

export default function SelectableMemberRow({ member, checked, onToggle, classNames = {}, avatarSize = 24, inputIdPrefix = "member-filter" }) {
  const id = String(member.user ?? member.id ?? "");
  const inputId = `${inputIdPrefix}-${id}`;
  return (
    <label className={classNames.row} htmlFor={inputId}>
      <input
        id={inputId}
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
