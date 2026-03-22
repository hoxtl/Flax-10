/*
 * GroupWork tasks tab with list, timeline, and board views.
 */

import { useEffect, useState } from "react";
import { CalendarIcon, List, Plus, Square } from "lucide-react";
import PrimaryButton from "../../components/Common/PrimaryButton/PrimaryButton";
import { SegmentedControl } from "../../components/Common/SegmentedControl/SegmentedControl.jsx";
import { useToast } from "../../context/ToastContext";
import { getAuthHeaders } from "./hooks/groupWorkHooks";
import AddTaskModal from "./components/AddTaskModal";
import MemberFilter from "./components/MemberFilter";
import TaskBoardView from "./components/TaskBoardView";
import TaskListView from "./components/TaskListView";
import TaskTimelineView from "./components/TaskTimelineView";
import styles from "./GroupTasksTab.module.css";
import { calcCompletionSegments } from "./utils/taskStatsUtils";
import { sortTasks } from "./utils/taskUtils";

function TaskViewSwitcher({ currentView, setTaskView }) {
    const views = [
        { value: "list", icon: List, label: "List" },
        { value: "timeline", icon: CalendarIcon, label: "Timeline" },
        { value: "board", icon: Square, label: "Kanban" },
    ];
    return <SegmentedControl className={styles.viewToggleControl} options={views} value={currentView} onChange={setTaskView} />;
}

function TaskContent({ members, onAddCol, onDelete, onToggle, onUpdate, taskView, tasks }) {
    if (taskView === "list") return <TaskListView tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />;
    if (taskView === "timeline") return <TaskTimelineView tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />;
    if (taskView === "board") return <TaskBoardView tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAddCol} />;
    return null;
}

function TaskTabHeader({ filterUsers, members, openAddModal, setTaskView, taskView, toggleFilter }) {
    return (
        <div className={styles.headerRow}>
            <TaskViewSwitcher currentView={taskView} setTaskView={setTaskView} />
            <div className={styles.headerActions}>
                <PrimaryButton pill size="small" className={styles.addBtn} onClick={openAddModal}>
                    <Plus size={15} strokeWidth={2.5} />
                    Add new task
                </PrimaryButton>
                <MemberFilter members={members} selectedUsers={filterUsers} onToggle={toggleFilter} />
            </div>
        </div>
    );
}

function TaskTabBody({ loading, members, onAddCol, onDelete, onToggle, onUpdate, taskView, tasks }) {
    if (loading) return <p className={styles.loadingText}>Loading tasks...</p>;
    return <TaskContent taskView={taskView} tasks={tasks} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} onAddCol={onAddCol} />;
}

function TaskAddDialog({ members, onAdd, onClose, show }) {
    if (!show) return null;
    return <AddTaskModal members={members} onAdd={onAdd} onClose={onClose} />;
}

function createTaskBody(projectId, title, { due_date, assigned_to, status } = {}) {
    const body = { title, group_project: projectId, priority: "medium", status: status || "todo" };
    if (due_date) body.due_date = due_date;
    if (assigned_to?.length) body.assigned_to = assigned_to;
    return body;
}

async function saveNewTask(projectId, title, options, setTasks) {
    if (!title) return;
    const res = await fetch("/api/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(createTaskBody(projectId, title, options)),
    });
    if (!res.ok) return;
    const created = await res.json();
    setTasks((prev) => [...prev, created]);
}

function useFetchTasks(projectId) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/tasks/?group_project=${projectId}`, { headers: getAuthHeaders() })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                setTasks(data);
                setLoading(false);
            });
    }, [projectId]);

    return { tasks, setTasks, loading };
}

function useTaskActions(setTasks) {
    const updateTask = async (taskId, patchData) => {
        const res = await fetch(`/api/tasks/${taskId}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(patchData),
        });
        if (!res.ok) return;
        const updated = await res.json();
        setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    };

    const deleteTask = async (taskId) => {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        await fetch(`/api/tasks/${taskId}/`, { method: "DELETE", headers: getAuthHeaders() });
    };

    return { updateTask, deleteTask };
}

function useTasks(projectId, members, onStatsUpdate) {
    const { tasks, setTasks, loading } = useFetchTasks(projectId);
    const { updateTask, deleteTask } = useTaskActions(setTasks);
    useEffect(() => { onStatsUpdate?.(calcCompletionSegments(tasks, members)); }, [members, onStatsUpdate, tasks]);
    const addTask = (title, options = {}) => saveNewTask(projectId, title, options, setTasks);
    return { tasks, loading, addTask, updateTask, deleteTask };
}

function useTaskTabState(tasks, filterUsers) {
    const filtered = filterUsers.length
        ? tasks.filter((task) => (task.assignees_info || []).some((assignee) => filterUsers.includes(String(assignee.id))))
        : tasks;
    return sortTasks(filtered);
}

function useGroupTasksTabModel(members, onStatsUpdate, projectId, showToast) {
    const { tasks, loading, addTask, updateTask, deleteTask } = useTasks(projectId, members, onStatsUpdate);
    const [filterUsers, setFilterUsers] = useState([]);
    const [taskView, setTaskView] = useState("list");
    const [showAddModal, setShowAddModal] = useState(false);
    const sortedTasks = useTaskTabState(tasks, filterUsers);
    const toggleFilter = (userId) =>
        setFilterUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
    const handleToggle = async (id, completed) => {
        await updateTask(id, { completed });
        if (completed) showToast("Task completed!", { icon: "🎉", variant: "success" });
    };
    const handleDelete = async (id) => {
        await deleteTask(id);
        showToast("Task deleted", { variant: "error", icon: "🗑️" });
    };
    const handleAdd = ({ title, due_date, assigned_to }) => addTask(title, { due_date, assigned_to });
    const handleAddColumnTask = (title, status) => addTask(title, { status });
    return { filterUsers, handleAdd, handleAddColumnTask, handleDelete, handleToggle, loading, setShowAddModal, setTaskView, showAddModal, sortedTasks, taskView, toggleFilter, updateTask };
}

function GroupTasksTabLayout({ members, model }) {
    return (
        <div style={{ marginTop: 24 }}>
            <TaskTabHeader filterUsers={model.filterUsers} members={members} openAddModal={() => model.setShowAddModal(true)} setTaskView={model.setTaskView} taskView={model.taskView} toggleFilter={model.toggleFilter} />
            <TaskTabBody loading={model.loading} members={members} onAddCol={model.handleAddColumnTask} onDelete={model.handleDelete} onToggle={model.handleToggle} onUpdate={model.updateTask} taskView={model.taskView} tasks={model.sortedTasks} />
            <TaskAddDialog members={members} onAdd={model.handleAdd} onClose={() => model.setShowAddModal(false)} show={model.showAddModal} />
        </div>
    );
}

export default function GroupTasksTab({ projectId, members = [], onStatsUpdate }) {
    const showToast = useToast();
    const model = useGroupTasksTabModel(members, onStatsUpdate, projectId, showToast);
    return <GroupTasksTabLayout members={members} model={model} />;
}
