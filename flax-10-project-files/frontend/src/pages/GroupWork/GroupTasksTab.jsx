import React, { useState, useEffect } from "react";
import { Check, Hourglass, Circle } from "lucide-react";
import { getAuthHeaders } from "./groupWorkHooks";

const metaStyle = { fontSize: 13, color: "#8f7969" };

function TaskRow({ task, members, onToggle, onUpdate }) {
    const isDone = task.completed;

    // Find assignee
    const assignee = members.find((m) => m.user === task.assigned_to) || null;

    const handleAssigneeChange = (e) => {
        const val = e.target.value;
        onUpdate(task.id, { assigned_to: val ? Number(val) : null });
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
                gridTemplateColumns: "minmax(0, 1fr) 90px 80px 140px",
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
                {assignee ? (
                    <>
                        <div
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
                            }}
                        >
                            {(assignee.user_name || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, color: "#8f7969", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {assignee.user_name}
                        </span>
                    </>
                ) : (
                    <span style={{ fontSize: 13, color: "#cdae99", fontStyle: "italic" }}>Unassigned</span>
                )}
                <select
                    value={task.assigned_to || ""}
                    onChange={handleAssigneeChange}
                    style={{
                        position: "absolute",
                        top: 0, left: 0, width: "100%", height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                    }}
                >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                        <option key={m.id} value={m.user}>
                            {m.user_name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default function GroupTasksTab({ projectId, members }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState("");

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
    };

    const updateTask = async (taskId, patchData) => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, ...patchData } : t))
        );

        await fetch(`/api/tasks/${taskId}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(patchData),
        });
    };

    const toggleTask = (taskId, completed) => {
        updateTask(taskId, { completed });
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // completed tasks at the bottom
        }
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
