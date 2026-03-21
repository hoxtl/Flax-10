import React, { useState, useEffect } from "react";
import { List, CalendarIcon, Square, ChevronDown } from "lucide-react";
import { getAuthHeaders } from "./groupWorkHooks";
import { useConfirm } from "../../context/ConfirmContext";
import AnimatedDropdown from "../../components/common/AnimatedDropdown/AnimatedDropdown";
import TaskListView from "./components/TaskListView";
import TaskTimelineView from "./components/TaskTimelineView";
import TaskBoardView from "./components/TaskBoardView";
import { calcCompletionSegments } from "./utils/taskStatsUtils";
import { sortTasks } from "./utils/taskUtils";
import styles from "./GroupTasksTab.module.css";

// --- Sub-components ---

function TaskFilter({ filterUser, setFilterUser, members }) {
    const options = [{ value: "", label: "All Members" }, ...members.map(m => ({ value: String(m.user), label: m.user_name }))];
    const selectedName = filterUser ? members.find(m => String(m.user) === String(filterUser))?.user_name : "All Members";

    return (
        <div className={styles.filterWrapper}>
            <AnimatedDropdown value={filterUser} onChange={setFilterUser} placeholder="All Members" options={options}
                usePortal={true}
                customTrigger={
                    <div className={styles.filterCustomTrigger}>
                        <span>{selectedName}</span>
                        <div className={styles.filterCustomArrow}><ChevronDown size={14} /></div>
                    </div>
                }
            />
        </div>
    );
}

function AddTaskForm({ newTaskTitle, setNewTaskTitle, filterUser, setFilterUser, members, onAdd }) {
    return (
        <form onSubmit={onAdd} className={styles.addTaskForm}>
            <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add a new task..." className={styles.taskInput} />
            <button type="submit" className={styles.addBtn}>Add</button>
            <TaskFilter filterUser={filterUser} setFilterUser={setFilterUser} members={members} />
        </form>
    );
}

function TaskViewSwitcher({ currentView, setTaskView }) {
    const views = [
        { id: "list", icon: <List size={14} />, label: "List" },
        { id: "timeline", icon: <CalendarIcon size={14} />, label: "Timeline" },
        { id: "board", icon: <Square size={14} />, label: "Board" },
    ];
    return (
        <div className={styles.viewToggleGroup}>
            {views.map(v => (
                <button key={v.id} onClick={() => setTaskView(v.id)} className={`${styles.viewToggleBtn} ${currentView === v.id ? styles.viewToggleBtnActive : ""}`}>
                    {v.icon} {v.label}
                </button>
            ))}
        </div>
    );
}

function TaskContent({ taskView, tasks, members, onToggle, onUpdate, onDelete, onAddCol }) {
    if (taskView === "list") return <TaskListView tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />;
    if (taskView === "timeline") return <TaskTimelineView tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} />;
    if (taskView === "board") return <TaskBoardView tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAddCol} />;
    return null;
}

// --- Logic Hook ---

function useFetchTasks(projectId) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch(`/api/tasks/?group_project=${projectId}`, { headers: getAuthHeaders() })
            .then(res => res.ok ? res.json() : [])
            .then(data => { setTasks(data); setLoading(false); });
    }, [projectId]);
    return { tasks, setTasks, loading };
}


// Actually let's do a better split
function useTaskActions(setTasks, confirm) {
    const updateTask = async (taskId, patchData) => {
        const res = await fetch(`/api/tasks/${taskId}/`, {
            method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(patchData),
        });
        if (res.ok) { const updated = await res.json(); setTasks(prev => prev.map(t => t.id === taskId ? updated : t)); }
    };
    const deleteTask = async (taskId) => {
        const isConfirmed = await confirm({ title: "Delete Task", message: "Delete this task permanently?", confirmText: "Delete", isDanger: true });
        if (isConfirmed) {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            await fetch(`/api/tasks/${taskId}/`, { method: "DELETE", headers: getAuthHeaders() });
        }
    };
    return { updateTask, deleteTask };
}

function useTasks(projectId, members, onStatsUpdate, confirm) {
    const { tasks, setTasks, loading } = useFetchTasks(projectId);
    const { updateTask, deleteTask } = useTaskActions(setTasks, confirm);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    useEffect(() => { onStatsUpdate?.(calcCompletionSegments(tasks, members)); }, [tasks, members, onStatsUpdate]);

    const addTask = async (e, directTitle, directStatus) => {
        e?.preventDefault?.();
        const title = directTitle || newTaskTitle.trim();
        if (!title) return;
        const res = await fetch(`/api/tasks/`, {
            method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ title, group_project: projectId, priority: "medium", status: directStatus || "todo" }),
        });
        if (res.ok) { const created = await res.json(); setTasks(prev => [...prev, created]); setNewTaskTitle(""); }
    };

    return { tasks, loading, newTaskTitle, setNewTaskTitle, addTask, updateTask, deleteTask };
}

// --- Main Component ---

function useTaskTabState(tasks, filterUser) {
    const filtered = tasks.filter(t => filterUser ? (t.assignees_info || []).some(a => String(a.id) === String(filterUser)) : true);
    return sortTasks(filtered);
}

export default function GroupTasksTab({ projectId, members = [], onStatsUpdate }) {
    const confirm = useConfirm();
    const { tasks, loading, newTaskTitle, setNewTaskTitle, addTask, updateTask, deleteTask } = useTasks(projectId, members, onStatsUpdate, confirm);
    const [filterUser, setFilterUser] = useState("");
    const [taskView, setTaskView] = useState("list");
    const sortedTasks = useTaskTabState(tasks, filterUser);

    return (
        <div style={{ marginTop: 24 }}>
            <div className={styles.headerRow}>
                <AddTaskForm newTaskTitle={newTaskTitle} setNewTaskTitle={setNewTaskTitle} filterUser={filterUser} setFilterUser={setFilterUser} members={members} onAdd={addTask} />
                <TaskViewSwitcher currentView={taskView} setTaskView={setTaskView} />
            </div>
            {loading ? <p className={styles.loadingText}>Loading tasks...</p> : (
                <TaskContent taskView={taskView} tasks={sortedTasks} members={members} onToggle={(id, c) => updateTask(id, { completed: c })} onUpdate={updateTask} onDelete={deleteTask} onAddCol={(t, s) => addTask(null, t, s)} />
            )}
        </div>
    );
}
