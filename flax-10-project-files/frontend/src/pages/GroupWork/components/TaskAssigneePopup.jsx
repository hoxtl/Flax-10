/**
 * TaskAssigneePopup — animated dropdown to assign/unassign group members to a task.
 * Uses MemberAvatar for consistent avatar rendering.
 */
import React, { useRef, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MemberAvatar, { getDisplayName } from "./MemberAvatar";
import { getUserColor } from "../utils/priorityUtils";
import styles from "./TaskAssigneePopup.module.css";

function usePopupPosition(isOpen, triggerRef, onClose) {
    const popupRef = useRef(null);
    const [calcPos, setCalcPos] = useState("bottom");

    useEffect(() => {
        const handleClickOutside = e => { if (popupRef.current && !popupRef.current.contains(e.target)) onClose(); };
        if (!isOpen) return () => document.removeEventListener("mousedown", handleClickOutside);
        document.addEventListener("mousedown", handleClickOutside);
        if (triggerRef?.current) {
            const { bottom, top } = triggerRef.current.getBoundingClientRect();
            setCalcPos((window.innerHeight - bottom < 250 && top > 250) ? "top" : "bottom");
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose, triggerRef]);

    return { popupRef, calcPos };
}

function MemberRow({ member, isSelected, onToggle }) {
    const color = getUserColor(member.user);
    return (
        <div onClick={e => { e.stopPropagation(); onToggle(member.user); }} className={`${styles.assignItem} ${isSelected ? styles.assignItemSelected : ""}`}>
            <div className={styles.assignItemLeft}>
                <MemberAvatar member={member} size={20} />
                <span>{getDisplayName(member)}</span>
            </div>
            {isSelected && <Check size={14} color={color} strokeWidth={3} />}
        </div>
    );
}

function AnimatedPopup({ isOpen, isTop, children, popupRef }) {
    const motionProps = { initial: { opacity: 0, scale: 0.95, y: isTop ? 10 : -10 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: isTop ? 10 : -10 }, transition: { duration: 0.15, ease: "easeOut" } };
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div ref={popupRef} className={styles.assignPopupBoard} {...motionProps} style={{ originY: isTop ? 1 : 0, ...(isTop ? { top: "auto", bottom: "100%", marginBottom: 8, marginTop: 0 } : {}) }}>
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function TaskAssigneePopup({ isOpen, onClose, members, assignees, onToggleAssignee, triggerRef }) {
    const { popupRef, calcPos } = usePopupPosition(isOpen, triggerRef, onClose);
    return (
        <AnimatedPopup isOpen={isOpen} isTop={calcPos === "top"} popupRef={popupRef}>
            <div className={styles.assignPopupHeader}>
                <span className={styles.assignPopupTitle}>Assign Members</span>
                <span className={styles.closePopupBtn} onClick={onClose}><X size={12} /></span>
            </div>
            {members.map(m => (
                <MemberRow key={m.id} member={m} isSelected={assignees.some(a => String(a.id) === String(m.user))} onToggle={onToggleAssignee} />
            ))}
        </AnimatedPopup>
    );
}
