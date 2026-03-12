/**
 * TaskAssigneePopup — animated dropdown to assign/unassign group members to a task.
 * Uses MemberAvatar for consistent avatar rendering.
 */
import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MemberAvatar, { getDisplayName } from "./MemberAvatar";
import { getUserColor } from "../utils/priorityUtils";
import styles from "./TaskAssigneePopup.module.css";

function usePopupPosition(isOpen, triggerRef, onClose) {
    const popupRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 200 });
    const [calcPos, setCalcPos] = useState("bottom");

    useEffect(() => {
        const handleClickOutside = e => {
            if (popupRef.current && !popupRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)) {
                onClose();
            }
        };

        const updatePosition = () => {
            if (triggerRef?.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const popupHeight = 250;
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                const showTop = spaceBelow < popupHeight && spaceAbove > spaceBelow;
                
                setCalcPos(showTop ? "top" : "bottom");
                setCoords({
                    top: showTop ? rect.top - 8 : rect.bottom + 8,
                    left: Math.min(rect.left, window.innerWidth - 210), // Ensure it stays on screen
                    width: 200
                });
            }
        };

        if (isOpen) {
            updatePosition();
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", updatePosition, true);
            window.addEventListener("resize", updatePosition);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen, onClose, triggerRef]);

    return { popupRef, calcPos, coords };
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

function AnimatedPopup({ isOpen, isTop, children, popupRef, coords }) {
    const motionProps = {
        initial: { opacity: 0, scale: 0.95, y: isTop ? 10 : -10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: isTop ? 10 : -10 },
        transition: { duration: 0.15, ease: "easeOut" }
    };

    const style = {
        position: "fixed",
        top: isTop ? "auto" : coords.top,
        bottom: isTop ? window.innerHeight - coords.top : "auto",
        left: coords.left,
        width: coords.width,
        zIndex: 9999,
        originY: isTop ? 1 : 0
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div ref={popupRef} className={styles.assignPopupBoard} {...motionProps} style={style}>
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function TaskAssigneePopup({ isOpen, onClose, members, assignees, onToggleAssignee, triggerRef }) {
    const { popupRef, calcPos, coords } = usePopupPosition(isOpen, triggerRef, onClose);
    
    const popupContent = (
        <AnimatedPopup isOpen={isOpen} isTop={calcPos === "top"} popupRef={popupRef} coords={coords}>
            <div className={styles.assignPopupHeader}>
                <span className={styles.assignPopupTitle}>Assign Members</span>
                <span className={styles.closePopupBtn} onClick={onClose}><X size={12} /></span>
            </div>
            <div className={styles.scrollArea}>
                {members.map(m => (
                    <MemberRow key={m.id} member={m} isSelected={assignees.some(a => String(a.id) === String(m.user))} onToggle={onToggleAssignee} />
                ))}
            </div>
        </AnimatedPopup>
    );

    return createPortal(popupContent, document.body);
}
