/*
 * GroupWork tasks tab with list, timeline, and board views.
 */

import { useState, useEffect } from "react";
import { List, CalendarIcon, Square, Plus } from "lucide-react";
import { getAuthHeaders } from "./hooks/groupWorkHooks";
import { useToast } from "../../context/ToastContext";
import PrimaryButton from "../../components/common/PrimaryButton/PrimaryButton";
import { SegmentedControl } from "../../components/common/SegmentedControl/SegmentedControl.jsx";
import MemberFilter from "./components/MemberFilter";
import AddTaskModal from "./components/AddTaskModal";
import TaskListView from "./components/TaskListView";
import TaskTimelineView from "./components/TaskTimelineView";
import TaskBoardView from "./components/TaskBoardView";
import { calcCompletionSegments } from "./utils/taskStatsUtils";
import { sortTasks } from "./utils/taskUtils";
import styles from "./GroupTasksTab.module.css";

function TaskViewSwitcher({ currentView, setTaskView }) {
    const views = [
        { value: "list", icon: List, label: "List" },
        { value: "timeline", icon: CalendarIcon, label: "Timeline" },
        { value: "board", icon: Square, label: "Kanban" },
    ];
    return <SegmentedControl className={styles.viewToggleControl} options={views} value={currentView} onChange={setTaskView} />;
}

function TaskContent({ taskView, tasks, members, onToggle, onUpdate, onDelete, onAddCol }) {
    if (taskView === "list") return <TaskListView tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />;
    if (taskView === "timeline") return <TaskTimelineView tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />;
    if (taskView === "board") return <TaskBoardView tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAddCol} />;
    return null;
}

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

function useTaskActions(setTasks) {
    const updateTask = async (taskId, patchData) => {
        const res = await fetch(`/api/tasks/${taskId}/`, {
            method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(patchData),
        });
        if (res.ok) { const updated = await res.json(); setTasks(prev => prev.map(t => t.id === taskId ? updated : t)); }
    };
    const deleteTask = async (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        await fetch(`/api/tasks/${taskId}/`, { method: "DELETE", headers: getAuthHeaders() });
    };
    return { updateTask, deleteTask };
}

function useTasks(projectId, members, onStatsUpdate) {
    const { tasks, setTasks, loading } = useFetchTasks(projectId);
    const { updateTask, deleteTask } = useTaskActions(setTasks);
    useEffect(() => { onStatsUpdate?.(calcCompletionSegments(tasks, members)); }, [tasks, members, onStatsUpdate]);

    const addTask = async (title, { due_date, assigned_to, status } = {}) => {
        if (!title) return;
        const body = { title, group_project: projectId, priority: "medium", status: status || "todo" };
        if (due_date) body.due_date = due_date;
        if (assigned_to?.length) body.assigned_to = assigned_to;
        const res = await fetch(`/api/tasks/`, {
            method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(body),
        });
        if (res.ok) { const created = await res.json(); setTasks(prev => [...prev, created]); }
    };

    return { tasks, loading, addTask, updateTask, deleteTask };
}

function useTaskTabState(tasks, filterUsers) {
    const filtered = filterUsers.length > 0
        ? tasks.filter(t => (t.assignees_info || []).some(a => filterUsers.includes(String(a.id))))
        : tasks;
    return sortTasks(filtered);
}

function useGroupTaskHandlers(showToast, taskActions, setFilterUsers) {
    const handleToggle = async (id, completed) => {
        await taskActions.updateTask(id, { completed });
        if (completed) showToast("Task completed!", { icon: "🎉", variant: "success" });
    };
    const handleDelete = async (id) => {
        await taskActions.deleteTask(id);
        showToast("Task deleted", { variant: "error", icon: "🗑️" });
    };
    const handleAdd = async ({ title, due_date, assigned_to }) => taskActions.addTask(title, { due_date, assigned_to });
    const toggleFilter = (userId) => setFilterUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    return { handleToggle, handleDelete, handleAdd, toggleFilter };
}

function TasksTabHeader({ taskView, setTaskView, members, filterUsers, onToggle, onAddClick }) {
    return (
        <div className={styles.headerRow}>
            <TaskViewSwitcher currentView={taskView} setTaskView={setTaskView} />
            <div className={styles.headerActions}>
                <PrimaryButton pill size="small" className={styles.addBtn} onClick={onAddClick}>
                    <Plus size={15} strokeWidth={2.5} />
                    Add new task
                </PrimaryButton>
                <MemberFilter members={members} selectedUsers={filterUsers} onToggle={onToggle} />
            </div>
        </div>
    );
}

/** Tasks tab with list, timeline, and board views for a group project. */
export default function GroupTasksTab({ projectId, members = [], onStatsUpdate }) {
    const showToast = useToast();
    const taskActions = useTasks(projectId, members, onStatsUpdate);
    const [filterUsers, setFilterUsers] = useState([]);
    const [taskView, setTaskView] = useState("list");
    const [showAddModal, setShowAddModal] = useState(false);
    const sortedTasks = useTaskTabState(taskActions.tasks, filterUsers);
    const handlers = useGroupTaskHandlers(showToast, taskActions, setFilterUsers);
    return (
        <div className={styles.tabBody}>
            <TasksTabHeader taskView={taskView} setTaskView={setTaskView} members={members} filterUsers={filterUsers} onToggle={handlers.toggleFilter} onAddClick={() => setShowAddModal(true)} />
            {taskActions.loading ? <p className={styles.loadingText}>Loading tasks...</p> : (
                <TaskContent taskView={taskView} tasks={sortedTasks} members={members} onToggle={handlers.handleToggle} onUpdate={taskActions.updateTask} onDelete={handlers.handleDelete} onAddCol={(t, s) => taskActions.addTask(t, { status: s })} />
            )}
            {showAddModal && <AddTaskModal members={members} onAdd={handlers.handleAdd} onClose={() => setShowAddModal(false)} />}
        </div>
    );
}
