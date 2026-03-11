import React, { useRef, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./TaskAssigneePopup.module.css";

const USER_COLORS = [
    "#7B6751", "#C0714E", "#7BB38E", "#9A8CB0",
    "#7B9BAD", "#C4A46D", "#8A7060", "#b08c4b"
];

export const getUserColor = (userId) => {
    if (!userId) return USER_COLORS[0];
    const idStr = String(userId);
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export default function TaskAssigneePopup({
    isOpen,
    onClose,
    members,
    assignees,
    onToggleAssignee,
    triggerRef,
    position = "bottom" // Default fallback, but dynamically calculated internally
}) {
    const popupRef = useRef(null);
    const [calcPos, setCalcPos] = useState(position);

    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);

            // Calculate position when opening
            if (triggerRef?.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const estimatedPopupHeight = 250;
                setCalcPos((spaceBelow < estimatedPopupHeight && rect.top > estimatedPopupHeight) ? "top" : "bottom");
            }
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose, triggerRef]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={popupRef}
                    className={styles.assignPopupBoard}
                    initial={{ opacity: 0, scale: 0.95, y: calcPos === "top" ? 10 : -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: calcPos === "top" ? 10 : -10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={{
                        originY: calcPos === "top" ? 1 : 0,
                        ...(calcPos === "top" ? { top: "auto", bottom: "100%", marginBottom: "8px", marginTop: 0 } : {})
                    }}
                >
                    <div className={styles.assignPopupHeader}>
                        <span className={styles.assignPopupTitle}>Assign Members</span>
                        <span className={styles.closePopupBtn} onClick={onClose}>
                            <X size={12} />
                        </span>
                    </div>
                    {members.map(m => {
                        const isSelected = assignees.some(a => String(a.id) === String(m.user));
                        const userCol = getUserColor(m.user);
                        return (
                            <div
                                key={m.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleAssignee(m.user);
                                }}
                                className={`${styles.assignItem} ${isSelected ? styles.assignItemSelected : ""}`}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: userCol }} />
                                    <span>{m.user_name}</span>
                                </div>
                                {isSelected && <Check size={14} color={userCol} strokeWidth={3} />}
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
