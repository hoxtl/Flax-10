import React, { useMemo, useState, useRef, useEffect } from "react";
import { Check, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import styles from "./TaskBoardView.module.css";

const USER_COLORS = [
    "#7B6751", "#C0714E", "#7BB38E", "#9A8CB0",
    "#7B9BAD", "#C4A46D", "#8A7060", "#b08c4b"
];

const getUserColor = (userId) => {
    if (!userId) return USER_COLORS[0];
    const idStr = String(userId);
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

function BoardCard({ t, isDone, pColor, onUpdate, onDelete, members, handleDragStart }) {
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const [popupPos, setPopupPos] = useState("bottom");
    const popupRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowAssignPopup(false);
            }
        }
        if (showAssignPopup) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAssignPopup]);

    const handleTogglePopup = (e) => {
        e.stopPropagation();
        if (!showAssignPopup) {
            // Measure before opening
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const estimatedPopupHeight = 250;
                if (spaceBelow < estimatedPopupHeight && rect.top > estimatedPopupHeight) {
                    setPopupPos("top");
                } else {
                    setPopupPos("bottom");
                }
            }
        }
        setShowAssignPopup(v => !v);
    };

    const toggleAssignee = (userId) => {
        const assignees = t.assignees_info || [];
        let currentIds = assignees.map(a => a.id);
        if (currentIds.includes(userId)) {
            currentIds = currentIds.filter(id => id !== userId);
        } else {
            currentIds.push(userId);
        }
        onUpdate(t.id, { assigned_to: currentIds });
    };

    const handleContextMenu = (e) => {
        e.preventDefault(); // Prevent standard browser right-click menu
        if (!showAssignPopup) {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                if (spaceBelow < 250 && rect.top > 250) setPopupPos("top");
                else setPopupPos("bottom");
            }
        }
        setShowAssignPopup(true);
    };

    let fullDateStr = "";
    if (t.due_date) {
        const d = new Date(t.due_date);
        fullDateStr = d.toISOString().slice(0, 10);
    }

    const assignees = t.assignees_info || [];

    return (
        <div
            className={`${styles.boardCard} ${isDone ? styles.boardCardDone : ""} ${showAssignPopup ? styles.boardCardActive : ""}`}
            draggable
            onDragStart={(e) => handleDragStart(e, t.id)}
            onContextMenu={handleContextMenu}
        >
            <div className={styles.cardHeader}>
                <select
                    value={(t.priority || "medium").toLowerCase()}
                    onChange={(e) => onUpdate(t.id, { priority: e.target.value })}
                    className={styles.prioritySelect}
                    style={{ background: pColor.bg, color: pColor.text }}
                    title="Change priority"
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="urgent">URGENT</option>
                    <option value="high">HIGH</option>
                    <option value="medium">MEDIUM</option>
                    <option value="low">LOW</option>
                </select>
                <div className={styles.cardActions}>
                    <button
                        onClick={() => onDelete(t.id)}
                        className={styles.iconBtnDelete}
                        title="Delete task"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className={styles.cardTitle}>{t.title}</div>

            <div className={styles.cardFooter} style={{ position: 'relative' }}>
                <div className={styles.cardDate}>
                    <DateTimePicker
                        value={fullDateStr}
                        onChange={(val) => onUpdate(t.id, { due_date: val ? new Date(val).toISOString() : null })}
                        placeholder="No due date"
                        dateOnly={true}
                        triggerClassName={styles.dateLabelInteractive}
                        hideIcon={true}
                    />
                </div>
                <div
                    ref={triggerRef}
                    className={styles.avatarStack}
                    onClick={handleTogglePopup}
                    style={{ cursor: "pointer" }}
                >
                    {assignees.slice(0, 3).map((a, i) => (
                        <div
                            key={a.id}
                            className={styles.avatarMini}
                            style={{
                                marginLeft: i > 0 ? -6 : 0,
                                background: getUserColor(a.id)
                            }}
                            title={a.name}
                        >
                            {(a.name || "?").slice(0, 2).toUpperCase()}
                        </div>
                    ))}
                    {assignees.length > 3 && (
                        <div className={styles.avatarMini} style={{ marginLeft: -6, fontSize: 8 }}>
                            +{(assignees.length - 3)}
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {showAssignPopup && (
                        <motion.div
                            ref={popupRef}
                            className={styles.assignPopupBoard}
                            initial={{ opacity: 0, scale: 0.95, y: popupPos === "top" ? 10 : -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: popupPos === "top" ? 10 : -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            style={{
                                originY: popupPos === "top" ? 1 : 0,
                                ...(popupPos === "top" ? { top: "auto", bottom: "100%", marginBottom: "8px", marginTop: 0 } : {})
                            }}
                        >
                            <div className={styles.assignPopupHeader}>
                                <span className={styles.assignPopupTitle}>Assign Members</span>
                                <span className={styles.closePopupBtn} onClick={() => setShowAssignPopup(false)}>
                                    <X size={12} />
                                </span>
                            </div>
                            {members.map(m => {
                                const isSelected = assignees.some(a => String(a.id) === String(m.user));
                                const userCol = getUserColor(m.user);
                                return (
                                    <div
                                        key={m.id}
                                        onClick={() => toggleAssignee(m.user)}
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
            </div>
        </div>
    );
}

export default function TaskBoardView({ tasks, members, onToggle, onUpdate, onDelete, onAdd }) {
    const [addingToCol, setAddingToCol] = React.useState(null);
    const [newCardTitle, setNewCardTitle] = React.useState("");

    const columns = useMemo(() => {
        const todo = [];
        const inProgress = [];
        const done = [];

        tasks.forEach(t => {
            const stat = t.status || (t.completed ? "done" : "todo");
            if (stat === "done") {
                done.push(t);
            } else if (stat === "in_progress") {
                inProgress.push(t);
            } else {
                todo.push(t);
            }
        });

        return [
            { id: "todo", title: "To Do", tasks: todo, color: "#8a7a6a", bg: "#f2ede5", dotCol: "#c0a080" },
            { id: "in_progress", title: "In Progress", tasks: inProgress, color: "#547da3", bg: "#e6eff5", dotCol: "#80b2d6" },
            { id: "done", title: "Done", tasks: done, color: "#6b8a6a", bg: "#e8f2e5", dotCol: "#8bc28a" }
        ];
    }, [tasks]);

    const priorityColors = {
        urgent: { bg: "#f9a8c9", text: "#9b2257" },
        high: { bg: "#fcd5a8", text: "#9b5a22" },
        medium: { bg: "#f5e6a3", text: "#7a6a1a" },
        low: { bg: "#b8e8c8", text: "#1a6a3a" },
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleAddSubmit = (e, colId) => {
        e.preventDefault();
        if (newCardTitle.trim()) {
            onAdd(newCardTitle.trim(), colId);
        }
        setAddingToCol(null);
        setNewCardTitle("");
    };

    const handleKeyDown = (e, colId) => {
        if (e.key === "Enter" && !e.shiftKey) {
            handleAddSubmit(e, colId);
        }
        if (e.key === "Escape") {
            setAddingToCol(null);
            setNewCardTitle("");
        }
    };

    const handleDrop = (e, colId) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
            onUpdate(Number(taskId), { status: colId });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("text/plain", String(taskId));
    };

    return (
        <div className={styles.boardContainer}>
            {columns.map(col => (
                <div
                    key={col.id}
                    className={styles.column}
                    style={{ background: col.bg }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className={styles.colHeader} style={{ color: col.color }}>
                        <div className={styles.colTitleWrapper}>
                            <div className={styles.colDot} style={{ background: col.dotCol }} />
                            <h3 className={styles.colTitle}>{col.title}</h3>
                        </div>
                        <span className={styles.taskCount}>{col.tasks.length}</span>
                    </div>

                    <div className={styles.cardList}>
                        {col.tasks.map(t => {
                            const pColor = priorityColors[(t.priority || "medium").toLowerCase()] || priorityColors.medium;
                            const isDone = (t.status === "done" || t.completed);
                            return (
                                <BoardCard
                                    key={t.id}
                                    t={t}
                                    isDone={isDone}
                                    pColor={pColor}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                    members={members}
                                    handleDragStart={handleDragStart}
                                />
                            );
                        })}
                        {col.tasks.length === 0 && (
                            <div className={styles.emptyCol}>No tasks</div>
                        )}
                        {addingToCol === col.id ? (
                            <div className={styles.addCardInputWrapper}>
                                <textarea
                                    autoFocus
                                    value={newCardTitle}
                                    onChange={(e) => setNewCardTitle(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, col.id)}
                                    onBlur={(e) => handleAddSubmit(e, col.id)}
                                    className={styles.addCardInput}
                                    placeholder="Enter title..."
                                    rows={2}
                                />
                            </div>
                        ) : (
                            <button
                                className={styles.addCardBtn}
                                onClick={() => setAddingToCol(col.id)}
                            >
                                + Add card
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
