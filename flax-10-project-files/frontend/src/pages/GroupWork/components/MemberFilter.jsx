/*
 * Hover-activated multi-select member filter.
 */

import { useState, useRef } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import FilterButton from "../../../components/common/FilterButton/FilterButton";
import { useClickOutside } from "../../../components/common/hooks/useClickOutside";
import SelectableMemberRow from "./SelectableMemberRow";
import styles from "./MemberFilter.module.css";

function useMemberFilter() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useClickOutside(ref, () => setIsOpen(false));
    return { isOpen, setIsOpen, ref };
}

function MemberItem({ member, checked, onToggle }) {
  return (
    <SelectableMemberRow
      member={member}
      checked={checked}
      onToggle={onToggle}
      classNames={{ row: styles.item, checkbox: styles.checkbox, label: styles.itemLabel }}
      avatarSize={22}
    />
  );
}

function DropdownContent({ members, selectedUsers, onToggle }) {
    return (
        <Motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }} className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
            {members.length === 0 ? (
                <p className={styles.empty}>No members</p>
            ) : (
                members.map((member) => <MemberItem key={member.user ?? member.id} member={member} checked={selectedUsers.includes(String(member.user))} onToggle={onToggle} />)
            )}
        </Motion.div>
    );
}

export default function MemberFilter({ members = [], selectedUsers = [], onToggle }) {
    const { isOpen, setIsOpen, ref } = useMemberFilter();
    return (
        <div ref={ref} className={styles.wrapper} onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <FilterButton activeCount={selectedUsers.length} isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />
            <AnimatePresence>
                {isOpen && <DropdownContent members={members} selectedUsers={selectedUsers} onToggle={onToggle} />}
            </AnimatePresence>
        </div>
    );
}
