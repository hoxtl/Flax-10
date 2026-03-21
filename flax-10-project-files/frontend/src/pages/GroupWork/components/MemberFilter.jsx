/*
 * Hover-activated multi-select member filter.
 */

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName } from "./memberAvatarUtils";
import FilterButton from "../../../components/common/FilterButton/FilterButton";
import styles from "./MemberFilter.module.css";

function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

function MemberItem({ member, checked, onToggle }) {
  return (
    <div className={styles.item} onClick={() => onToggle(String(member.user))}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(String(member.user))}
        className={styles.checkbox}
        onClick={(e) => e.stopPropagation()}
      />
      <MemberAvatar member={member} size={22} />
      <span className={styles.itemLabel}>{getDisplayName(member)}</span>
    </div>
  );
}

function DropdownContent({ members, selectedUsers, onToggle }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={styles.dropdown}
      onClick={(e) => e.stopPropagation()}
    >
      {members.length === 0 ? (
        <p className={styles.empty}>No members</p>
      ) : (
        members.map((member) => (
          <MemberItem
            key={member.user ?? member.id}
            member={member}
            checked={selectedUsers.includes(String(member.user))}
            onToggle={onToggle}
          />
        ))
      )}
    </Motion.div>
  );
}

export default function MemberFilter({ members = [], selectedUsers = [], onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setIsOpen(false));

  return (
    <div
      ref={ref}
      className={styles.wrapper}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <FilterButton
        activeCount={selectedUsers.length}
        isOpen={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      />
      <AnimatePresence>
        {isOpen && (
          <DropdownContent
            members={members}
            selectedUsers={selectedUsers}
            onToggle={onToggle}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
