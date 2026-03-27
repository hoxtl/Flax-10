/*
 * GroupWork tasks tab with list, timeline, and board views.
 */

import { useState } from "react";
import { List, CalendarIcon, Square, Plus } from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import SearchBar from "../../../components/common/search_bar/SearchBar";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import { SegmentedControl } from "../../../components/common/segmented_control/SegmentedControl.jsx";
import MemberFilter from "./MemberFilter";
import AddTaskModal from "./AddTaskModal";
import TaskListView from "./TaskListView";
import TaskTimelineView from "./TaskTimelineView";
import TaskBoardView from "./TaskBoardView";
import styles from "../styles/GroupTasksTab.module.css";
import { useGroupTasksTabState } from "../hooks/useGroupTasksTabState";

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

function useGroupTaskHandlers(showToast, taskActions, setFilterUsers) {
    const handleToggle = async (id, completed) => {
        await taskActions.updateTask(id, { completed });
        if (completed) showToast("Task completed!", { icon: "🎉", variant: "success" });
    };
    const handleDelete = (id) => {
        taskActions.deleteTask(id);
        showToast("Task deleted", {
            variant: "success",
            actionLabel: "Undo",
            onAction: () => taskActions.undoDelete(id),
        });
    };
    const handleAdd = async ({ title, due_date, assigned_to }) => taskActions.addTask(title, { due_date, assigned_to });
    const toggleFilter = (userId) => setFilterUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    return { handleToggle, handleDelete, handleAdd, toggleFilter };
}

function TasksTabHeader({ searchTerm, setSearchTerm, taskView, setTaskView, members, filterUsers, onToggle, onAddClick }) {
    return (
        <div className={styles.headerRow}>
            <TaskViewSwitcher currentView={taskView} setTaskView={setTaskView} />
            <div className={styles.headerActions}>
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search tasks..." className={styles.taskSearch} />
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
    const { taskActions, filterUsers, setFilterUsers, searchTerm, setSearchTerm, taskView, setTaskView, showAddModal, setShowAddModal, sortedTasks } = useGroupTasksTabState(projectId, members, onStatsUpdate);
    const handlers = useGroupTaskHandlers(showToast, taskActions, setFilterUsers);
    return (
        <div className={styles.tabBody}>
            <TasksTabHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} taskView={taskView} setTaskView={setTaskView} members={members} filterUsers={filterUsers} onToggle={handlers.toggleFilter} onAddClick={() => setShowAddModal(true)} />
            {taskActions.loading ? <p className={styles.loadingText}>Loading tasks...</p> : (
                <TaskContent taskView={taskView} tasks={sortedTasks} members={members} onToggle={handlers.handleToggle} onUpdate={taskActions.updateTask} onDelete={handlers.handleDelete} onAddCol={(t, s) => taskActions.addTask(t, { status: s })} />
            )}
            {showAddModal && <AddTaskModal members={members} onAdd={handlers.handleAdd} onClose={() => setShowAddModal(false)} />}
        </div>
    );
}
