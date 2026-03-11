import React, { useState, useEffect, useRef } from "react";
import { Check, Trash2, X, ChevronDown, List, CalendarIcon, Square } from "lucide-react";
import { getAuthHeaders } from "./groupWorkHooks";
import { useConfirm } from "../../context/ConfirmContext";
import DateTimePicker from "../../components/common/inputs/DateTimePicker";
import AnimatedDropdown from "../../components/ui/AnimatedDropdown";
import TaskListView from "./components/TaskListView";
import TaskTimelineView from "./components/TaskTimelineView";
import TaskBoardView from "./components/TaskBoardView";
import styles from "./GroupTasksTab.module.css";

export default function GroupTasksTab({ projectId, members, onStatsUpdate }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [filterUser, setFilterUser] = useState("");
    const [taskView, setTaskView] = useState("list");
    const confirm = useConfirm();

    const views = [
        { id: "list", icon: <List size={14} />, label: "List" },
        { id: "timeline", icon: <CalendarIcon size={14} />, label: "Timeline" },
        { id: "board", icon: <Square size={14} />, label: "Board" },
    ];

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

    // Calculate completion metrics and pass them up
    useEffect(() => {
        if (!onStatsUpdate) return;
        const total = tasks.length;
        if (total === 0) {
            onStatsUpdate({ percent: 0, completed: 0, total: 0, segments: [] });
            return;
        }

        const completedArr = tasks.filter(t => t.completed || t.status === "done");
        const completed = completedArr.length;
        const percent = Math.round((completed / total) * 100);

        const userCounts = {};
        let unassignedCount = 0;

        completedArr.forEach(t => {
            const assignees = t.assignees_info || [];
            if (assignees.length === 0) {
                unassignedCount++;
            } else {
                assignees.forEach(a => {
                    if (!userCounts[a.id]) {
                        userCounts[a.id] = { count: 0, name: a.name, id: a.id };
                    }
                    userCounts[a.id].count += (1 / assignees.length);
                });
            }
        });

        const segments = Object.values(userCounts).map(u => ({
            ...u,
            percentage: (u.count / total) * 100,
            tooltip: `${u.name} (${Math.round(u.count)} tasks)`
        }));

        if (unassignedCount > 0) {
            segments.push({
                id: 'unassigned',
                name: 'Unassigned',
                count: unassignedCount,
                percentage: (unassignedCount / total) * 100,
                tooltip: `Unassigned (${unassignedCount} tasks)`
            });
        }

        onStatsUpdate({ percent, completed, total, segments });
    }, [tasks, onStatsUpdate]);

    const handleAddTaskToCol = (title, status) => {
        addTask(new Event("submit"), title, status);
    };

    const addTask = async (e, directTitle = null, directStatus = null) => {
        if (e && e.preventDefault) e.preventDefault();

        const title = directTitle || newTaskTitle.trim();
        if (!title) return;

        const payload = {
            title: title,
            group_project: projectId,
            priority: "medium",
            status: directStatus || "todo"
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
                if (!directTitle) setNewTaskTitle("");
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

                // Keep completed boolean synced with status if one changes explicitly
                if (patchData.status !== undefined) {
                    next.completed = patchData.status === "done";
                } else if (patchData.completed !== undefined) {
                    next.status = patchData.completed ? "done" : "todo";
                }

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
            setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        }
    };

    const toggleTask = (taskId, completed) => {
        updateTask(taskId, { completed });
    };

    const deleteTask = async (taskId) => {
        const isConfirmed = await confirm({
            title: "Delete Task",
            message: "Are you sure you want to delete this task? This action cannot be undone.",
            confirmText: "Delete",
            isDanger: true,
        });
        if (!isConfirmed) return;

        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        await fetch(`/api/tasks/${taskId}/`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
    };

    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };

    const sortedTasks = [...tasks]
        .filter(t => filterUser ? (t.assignees_info || []).some(a => String(a.id) === String(filterUser)) : true)
        .sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            const wA = priorityWeight[(a.priority || "medium").toLowerCase()] || 0;
            const wB = priorityWeight[(b.priority || "medium").toLowerCase()] || 0;
            if (wA !== wB) return wB - wA;
            return new Date(a.created_at) - new Date(b.created_at);
        });

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <form onSubmit={addTask} className={styles.addTaskForm}>
                    <input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add a new task..."
                        className={styles.taskInput}
                    />

                    <div className={styles.filterWrapper}>
                        <AnimatedDropdown
                            value={filterUser}
                            onChange={(val) => setFilterUser(val)}
                            placeholder="All Members"
                            options={[
                                { value: "", label: "All Members" },
                                ...members.map(m => ({ value: String(m.user), label: m.user_name }))
                            ]}
                            customTrigger={
                                <div className={styles.filterCustomTrigger}>
                                    <span>{filterUser ? members.find(m => String(m.user) === String(filterUser))?.user_name : "All Members"}</span>
                                    <div className={styles.filterCustomArrow}>
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            }
                        />
                    </div>

                    <button type="submit" className={styles.addBtn}>
                        Add
                    </button>
                </form>

                <div className={styles.viewToggleGroup}>
                    {views.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setTaskView(v.id)}
                            className={`${styles.viewToggleBtn} ${taskView === v.id ? styles.viewToggleBtnActive : ""}`}
                        >
                            {v.icon} {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <p className={styles.loadingText}>Loading tasks...</p>
            ) : (
                <>
                    {taskView === "list" && (
                        <TaskListView
                            tasks={sortedTasks}
                            members={members}
                            onToggle={toggleTask}
                            onUpdate={updateTask}
                            onDelete={deleteTask}
                        />
                    )}
                    {taskView === "timeline" && (
                        <TaskTimelineView
                            tasks={sortedTasks}
                            members={members}
                            onToggle={toggleTask}
                            onUpdate={updateTask}
                        />
                    )}
                    {taskView === "board" && (
                        <TaskBoardView
                            tasks={sortedTasks}
                            members={members}
                            onToggle={toggleTask}
                            onUpdate={updateTask}
                            onDelete={deleteTask}
                            onAdd={handleAddTaskToCol}
                        />
                    )}
                </>
            )}
        </div>
    );
}
