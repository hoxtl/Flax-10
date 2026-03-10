import React, { useState, useEffect, useRef } from "react";
import { Check, Hourglass, Circle, Trash2, X } from "lucide-react";
import { getAuthHeaders } from "./groupWorkHooks";

const metaStyle = { fontSize: 13, color: "#8f7969" };

function TaskRow({ task, members, onToggle, onUpdate, onDelete }) {
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const popupRef = useRef(null);
    const isDone = task.completed;

    // Close on click outside
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

    // Use assignees_info from backend (array of {id, name})
    const assignees = task.assignees_info || [];

    const toggleAssignee = (userId) => {
        let currentIds = assignees.map(a => a.id);
        if (currentIds.includes(userId)) {
            currentIds = currentIds.filter(id => id !== userId);
        } else {
            currentIds.push(userId);
        }
        onUpdate(task.id, { assigned_to: currentIds });
    };

    const handlePriorityChange = (e) => {
        onUpdate(task.id, { priority: e.target.value });
    };

    const handleDateChange = (e) => {
        const dateStr = e.target.value;
        onUpdate(task.id, { due_date: dateStr ? new Date(dateStr).toISOString() : null });
    };

    // Formatting due date like "1 Mar"
    let parsedDateStr = "";
    let fullDateStr = "";
    if (task.due_date) {
        const d = new Date(task.due_date);
        const day = d.getDate();
        const month = d.toLocaleString('en-US', { month: 'short' });
        parsedDateStr = `${day} ${month}`;
        fullDateStr = d.toISOString().slice(0, 10);
    }

    // Priority Pill Colors
    const getPriorityStyle = (priority) => {
        const p = (priority || "").toLowerCase();
        if (p === "high" || p === "urgent") {
            return { background: "#ffccd5", color: "#a8324e" };
        }
        if (p === "medium") {
            return { background: "#ffe0b2", color: "#bf7b24" };
        }
        return { background: "#f0f0f0", color: "#666" };
    };

    const pStyle = getPriorityStyle(task.priority);

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 90px 80px 140px 40px",
                alignItems: "center",
                borderBottom: "1px solid #f0dfd1",
                padding: "12px 0",
                gap: 12,
                opacity: isDone ? 0.6 : 1,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                    onClick={() => onToggle(task.id, !isDone)}
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: isDone ? "1px solid #a8cfa8" : task.priority === "urgent" || task.priority === "high" ? "1px solid #eadbce" : "1px solid #e2d1c3",
                        background: isDone ? "#d6ebd6" : task.priority === "urgent" || task.priority === "high" ? "#fdead8" : "#f7ede4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        color: isDone ? "#2d6a2d" : "#8f7969",
                    }}
                >
                    {isDone ? (
                        <Check size={16} />
                    ) : task.priority === "urgent" || task.priority === "high" ? (
                        <Hourglass size={14} />
                    ) : (
                        <Circle size={12} />
                    )}
                </button>
                <span
                    style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: isDone ? "#a89b91" : "#3c2a20",
                        textDecoration: isDone ? "line-through" : "none",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {task.title}
                </span>
            </div>

            <div>
                <select
                    value={task.priority || "medium"}
                    onChange={handlePriorityChange}
                    style={{
                        ...pStyle,
                        border: "none",
                        borderRadius: 16,
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        cursor: "pointer",
                        outline: "none",
                        appearance: "none",
                        textAlign: "center",
                        width: "100%",
                    }}
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
            </div>

            <div style={{ position: "relative" }}>
                <input
                    type="date"
                    value={fullDateStr}
                    onChange={handleDateChange}
                    style={{
                        opacity: 0,
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        top: 0, left: 0,
                        cursor: "pointer",
                    }}
                />
                <div style={{ fontSize: 13, color: "#8f7969", textAlign: "center", pointerEvents: "none" }}>
                    {parsedDateStr || "Set Date"}
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
                <div
                    onClick={() => setShowAssignPopup(!showAssignPopup)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: showAssignPopup ? "#eee3d8" : "transparent"
                    }}
                >
                    {assignees.length > 0 ? (
                        <div style={{ display: "flex", marginLeft: 8 }}>
                            {assignees.slice(0, 3).map((a, i) => (
                                <div
                                    key={a.id}
                                    title={a.name}
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: "50%",
                                        background: "#3c2a20",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 10,
                                        fontWeight: "bold",
                                        flexShrink: 0,
                                        marginLeft: i > 0 ? -8 : 0,
                                        border: "2px solid #fffaf4"
                                    }}
                                >
                                    {(a.name || "?").slice(0, 2).toUpperCase()}
                                </div>
                            ))}
                            {assignees.length > 3 && (
                                <div style={{ fontSize: 11, color: "#8f7969", marginLeft: 4, alignSelf: "center" }}>
                                    +{assignees.length - 3}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span style={{ fontSize: 13, color: "#cdae99", fontStyle: "italic" }}>Unassigned</span>
                    )}
                </div>

                {showAssignPopup && (
                    <div
                        ref={popupRef}
                        style={{
                            position: "absolute",
                            top: "100%", left: 0,
                            marginTop: 4,
                            background: "#fff",
                            border: "1px solid #e2d1c3",
                            borderRadius: 8,
                            boxShadow: "0 4px 12px rgba(60,42,32,0.1)",
                            zIndex: 10,
                            minWidth: 160,
                            padding: "8px 0"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 12px 6px" }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#a89b91", textTransform: "uppercase" }}>Assign Members</div>
                            <X size={12} style={{ cursor: "pointer", color: "#a89b91" }} onClick={() => setShowAssignPopup(false)} />
                        </div>
                        {members.map(m => {
                            const isSelected = assignees.some(a => String(a.id) === String(m.user));
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => toggleAssignee(m.user)}
                                    style={{
                                        padding: "8px 12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        cursor: "pointer",
                                        backgroundColor: isSelected ? "#f5eee7" : "transparent",
                                        fontSize: 13,
                                        color: "#3c2a20"
                                    }}
                                >
                                    <span>{m.user_name}</span>
                                    {isSelected && <Check size={14} color="#7b4b2b" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <button
                onClick={() => onDelete(task.id)}
                style={{
                    background: "transparent",
                    border: "none",
                    color: "#c9a790",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                    borderRadius: 6,
                }}
                className="hover-trigger"
                title="Delete task"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}

export default function GroupTasksTab({ projectId, members }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [filterUser, setFilterUser] = useState("");

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tasks/?group_project=${projectId}`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const addTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const payload = {
            title: newTaskTitle,
            group_project: projectId,
            priority: "medium",
        };

        try {
            const res = await fetch(`/api/tasks/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const created = await res.json();
                setTasks((prev) => [...prev, created]);
                setNewTaskTitle("");
            }
        } catch (err) {
            console.error("Network error adding task:", err);
        }
    };

    const updateTask = async (taskId, patchData) => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => {
                if (t.id !== taskId) return t;
                const next = { ...t, ...patchData };

                // If we are updating assigned_to (the IDs), we must also update 
                // assignees_info (the objects with names) for the UI to update immediately.
                if (patchData.assigned_to) {
                    next.assignees_info = patchData.assigned_to.map(uid => {
                        const m = members.find(mem => mem.user === uid);
                        return { id: uid, name: m ? m.user_name : "Unknown" };
                    });
                }

                return next;
            })
        );

        const res = await fetch(`/api/tasks/${taskId}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(patchData),
        });

        if (res.ok) {
            const updated = await res.json();
            // Sync with actual server response to ensure everything is correct
            setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        }
    };

    const toggleTask = (taskId, completed) => {
        updateTask(taskId, { completed });
    };

    const deleteTask = async (taskId) => {
        // Confirmation is usually good for deletion
        if (!window.confirm("Are you sure you want to delete this task?")) return;

        // Optimistic delete
        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        await fetch(`/api/tasks/${taskId}/`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
    };

    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };

    // Filter by Assignee, then Sort by Completed > Urgency > Created Date
    const sortedTasks = [...tasks]
        .filter(t => filterUser ? (t.assignees_info || []).some(a => String(a.id) === String(filterUser)) : true)
        .sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // completed tasks at the bottom
            }
            const wA = priorityWeight[(a.priority || "medium").toLowerCase()] || 0;
            const wB = priorityWeight[(b.priority || "medium").toLowerCase()] || 0;
            if (wA !== wB) return wB - wA; // Urgency desc

            return new Date(a.created_at) - new Date(b.created_at);
        });

    return (
        <div
            style={{
                borderRadius: 12,
                border: "1px solid #f0dfd1",
                background: "#fffaf4",
                padding: "16px 20px",
            }}
        >
            <form onSubmit={addTask} style={{ marginBottom: 16, display: "flex", gap: 10 }}>
                <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new task..."
                    style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #e3d4c6",
                        background: "#fff",
                        fontSize: 14,
                        outline: "none",
                    }}
                />

                <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #e3d4c6",
                        background: "#f7efe7",
                        color: "#3c2a20",
                        fontSize: 13,
                        fontWeight: 500,
                        outline: "none",
                        cursor: "pointer",
                    }}
                >
                    <option value="">All Members</option>
                    {members.map(m => (
                        <option key={m.id} value={m.user}>
                            {m.user_name}
                        </option>
                    ))}
                </select>

                <button
                    type="submit"
                    style={{
                        padding: "10px 20px",
                        borderRadius: 8,
                        border: "none",
                        background: "#9b8b7c",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Add
                </button>
            </form>

            {loading ? (
                <p style={metaStyle}>Loading tasks...</p>
            ) : sortedTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#a89b91", fontSize: 13 }}>
                    No tasks yet. Create one to get started!
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {sortedTasks.map((task) => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            members={members}
                            onToggle={toggleTask}
                            onUpdate={updateTask}
                            onDelete={deleteTask}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
