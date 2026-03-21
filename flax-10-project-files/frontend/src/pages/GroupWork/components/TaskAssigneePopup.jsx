/*
 * GroupWork task assignee popup.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName } from "./memberAvatarUtils";
import { getUserColor } from "../utils/priorityUtils";
import { createPopupCoords, shouldShowPopupAbove } from "../utils/taskAssigneeUtils";
import styles from "./TaskAssigneePopup.module.css";

function usePopupPosition(isOpen, triggerRef, onClose) {
  const popupRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 200 });
  const [calcPos, setCalcPos] = useState("bottom");
  useEffect(() => attachPopupListeners(isOpen, triggerRef, popupRef, setCoords, setCalcPos, onClose), [isOpen, onClose, triggerRef]);
  return { popupRef, calcPos, coords };
}

function attachPopupListeners(isOpen, triggerRef, popupRef, setCoords, setCalcPos, onClose) {
  if (!isOpen) return undefined;
  const updatePosition = () => syncPopupPosition(triggerRef, setCoords, setCalcPos);
  const handleClickOutside = (event) => closePopupFromOutside(event, popupRef, triggerRef, onClose);
  updatePosition();
  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("scroll", updatePosition, true);
  window.addEventListener("resize", updatePosition);
  return () => detachPopupListeners(handleClickOutside, updatePosition);
}

function syncPopupPosition(triggerRef, setCoords, setCalcPos) {
  if (!triggerRef?.current) return;
  const rect = triggerRef.current.getBoundingClientRect();
  const showTop = shouldShowPopupAbove(rect);
  setCalcPos(showTop ? "top" : "bottom");
  setCoords(createPopupCoords(rect, showTop));
}

function closePopupFromOutside(event, popupRef, triggerRef, onClose) {
  if (popupRef.current?.contains(event.target)) return;
  if (triggerRef.current?.contains(event.target)) return;
  onClose();
}

function detachPopupListeners(handleClickOutside, updatePosition) {
  document.removeEventListener("mousedown", handleClickOutside);
  window.removeEventListener("scroll", updatePosition, true);
  window.removeEventListener("resize", updatePosition);
}

function MemberRow({ member, isSelected, onToggle }) {
  return (
    <div onClick={(event) => handleToggle(event, member.user, onToggle)} className={`${styles.assignItem} ${isSelected ? styles.assignItemSelected : ""}`}>
      <div className={styles.assignItemLeft}>
        <MemberAvatar member={member} size={20} />
        <span>{getDisplayName(member)}</span>
      </div>
      {isSelected && <Check size={14} color={getUserColor(member.user)} strokeWidth={3} />}
    </div>
  );
}

function handleToggle(event, userId, onToggle) {
  event.stopPropagation();
  onToggle(userId);
}

function PopupShell({ isTop, popupRef, coords, children }) {
  return <div ref={popupRef} className={styles.assignPopupBoard} style={getPopupStyle(isTop, coords)}>{children}</div>;
}

function getPopupStyle(isTop, coords) {
  return {
    position: "fixed",
    top: isTop ? "auto" : coords.top,
    bottom: isTop ? window.innerHeight - coords.top : "auto",
    left: coords.left,
    width: coords.width,
    zIndex: 9999,
  };
}

export default function TaskAssigneePopup({ isOpen, onClose, members, assignees, onToggleAssignee, triggerRef }) {
  const { popupRef, calcPos, coords } = usePopupPosition(isOpen, triggerRef, onClose);
  if (!isOpen) return null;
  return createPortal(<PopupShell isTop={calcPos === "top"} popupRef={popupRef} coords={coords}><PopupContent members={members} assignees={assignees} onClose={onClose} onToggleAssignee={onToggleAssignee} /></PopupShell>, document.body);
}

function PopupContent({ members, assignees, onClose, onToggleAssignee }) {
  return (
    <>
      <div className={styles.assignPopupHeader}>
        <span className={styles.assignPopupTitle}>Assign Members</span>
        <span className={styles.closePopupBtn} onClick={onClose}><X size={12} /></span>
      </div>
      <div className={styles.scrollArea}>
        {members.map((member) => <MemberRow key={member.id} member={member} isSelected={assignees.some((assignee) => String(assignee.id) === String(member.user))} onToggle={onToggleAssignee} />)}
      </div>
    </>
  );
}
