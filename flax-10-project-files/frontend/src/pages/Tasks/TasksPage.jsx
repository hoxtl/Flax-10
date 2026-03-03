import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import useTasks from "./hooks/useTasks";
import useTaskLists from "./hooks/useTaskLists";

import TaskFeed from "./components/TaskFeed";
import ListSidebar from "./components/ListSidebar";
import CreateTaskModal from "./components/CreateTaskModal";
import CreateListModal from "./components/CreateListModal";
import { BackToTop } from "../../components/Pagination/Pagination";

import styles from "./TasksPage.module.css";

function useFilteredTasks(tasks, activeListId, activeFilter) {
    return useMemo(() => {
        const now      = new Date();
        const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const weekEnd  = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);

        let filtered = activeListId
            ? tasks.filter(t => String(t.task_list) === String(activeListId))
            : tasks;

        if (activeFilter === "overdue")
            return filtered.filter(t => !t.completed && t.due_date && new Date(t.due_date) < dayStart);
        if (activeFilter === "today")
            return filtered.filter(t => t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= todayEnd);
        if (activeFilter === "week")
            return filtered.filter(t => t.due_date && new Date(t.due_date) <= weekEnd);
        return filtered;
    }, [tasks, activeListId, activeFilter]);
}

/** End of today as ISO string so new tasks from Today view show in Today (due_date >= now && <= todayEnd). */
function getTodayEndISO() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
}

export default function TasksPage() {
    const [searchParams] = useSearchParams();
    const { lists, archivedLists, loading: listsLoading, addList, removeList, renameList, restoreList, permanentlyDeleteList } = useTaskLists();
    const { tasks, initialLoading: tasksInitialLoading, addTask, editTask, removeTask, toggleComplete, reload: reloadTasks } = useTasks();
    const [activeListId,    setActiveListId]    = useState(null);
    const [activeFilter,   setActiveFilter]    = useState("all");
    const [showTaskModal,   setShowTaskModal]   = useState(false);
    const [showListModal,   setShowListModal]   = useState(false);
    const [toastUndo,       setToastUndo]      = useState(null);
    const [toastDelete,     setToastDelete]    = useState(false);
    const [completionToast, setCompletionToast] = useState(null);

    useEffect(() => {
        const listParam = searchParams.get("list");
        if (listParam != null && listParam !== "") setActiveListId(listParam);
    }, [searchParams]);

    useEffect(() => {
        if (!completionToast) return;
        const t = setTimeout(() => setCompletionToast(null), 3000);
        return () => clearTimeout(t);
    }, [completionToast]);

    const activeModuleCode = searchParams.get("module") || null;

    const filteredTasks = useFilteredTasks(tasks, activeListId, activeFilter);
    const defaultDueDateForNewTask = activeFilter === "today" ? getTodayEndISO() : null;

    const handleUndoAddTask = () => {
        if (!toastUndo) return;
        removeTask(toastUndo.taskId);
        setToastUndo(null);
    };

    const handleDeleteTask = (taskId) => {
        removeTask(taskId);
        setToastDelete(true);
        setTimeout(() => setToastDelete(false), 3500);
    };

    const handleDeleteList = (listId) => {
        removeList(listId);
        if (activeListId === listId) { setActiveListId(null); setActiveFilter("all"); }
    };

    const handleUnarchiveList = async (listId) => {
        await restoreList(listId);
        reloadTasks();
    };

    const handlePermanentlyDeleteList = async (listId) => {
        if (!window.confirm("Permanently delete this list? You won’t be able to restore it.")) return;
        await permanentlyDeleteList(listId);
    };

    if (listsLoading || tasksInitialLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingSpinner} aria-hidden />
                <p className={styles.loadingText}>Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <ListSidebar
                lists={lists}
                tasks={tasks}
                activeListId={activeListId}
                activeFilter={activeFilter}
                onSelectList={setActiveListId}
                onSelectFilter={setActiveFilter}
                onNewList={() => setShowListModal(true)}
                onDeleteList={handleDeleteList}
                onRenameList={renameList}
                onUnarchiveList={handleUnarchiveList}
                onPermanentlyDeleteList={handlePermanentlyDeleteList}
                archivedLists={archivedLists}
            />
            <TaskFeed
                tasks={filteredTasks}
                lists={lists}
                activeFilter={activeFilter}
                activeListId={activeListId}
                activeModuleCode={activeModuleCode}
                defaultDueDateForNewTask={defaultDueDateForNewTask}
                onToggleComplete={toggleComplete}
                onTaskCompleted={(task) => {
                    setCompletionToast({ taskId: task.id, completed: true });
                }}
                onDeleteTask={handleDeleteTask}
                onEditTask={editTask}
                onCreateTask={() => setShowTaskModal(true)}
                onAddTask={async (data) => {
                    const created = await addTask(data);
                    if (created) {
                        setToastUndo({ taskId: created.id, title: created.title });
                        setTimeout(() => setToastUndo(null), 5000);
                    }
                }}
            />
            {showTaskModal && (
                <CreateTaskModal
                    lists={lists}
                    defaultListId={activeListId}
                    defaultDueDate={defaultDueDateForNewTask}
                    onCreateList={addList}
                    onSave={async (data) => {
                        const created = await addTask(data);
                        setToastUndo(created ? { taskId: created.id, title: created.title } : null);
                        if (created) setTimeout(() => setToastUndo(null), 5000);
                    }}
                    onClose={() => setShowTaskModal(false)}
                />
            )}
            {toastUndo && (
                <div className={styles.toast}>
                    <span>Task added.</span>
                    <button type="button" className={styles.toastUndoBtn} onClick={handleUndoAddTask}>Undo</button>
                    <button type="button" className={styles.toastClose} onClick={() => setToastUndo(null)}>✕</button>
                </div>
            )}
            {completionToast && (
                <div className={styles.toastCompletion}>
                    <span>Task completed ✓</span>
                    <button type="button" className={styles.toastUndoBtn} onClick={() => { toggleComplete(completionToast.taskId, true); setCompletionToast(null); }}>Undo</button>
                    <button type="button" className={styles.toastClose} onClick={() => setCompletionToast(null)}>✕</button>
                </div>
            )}
            {toastDelete && (
                <div className={`${styles.toast} ${styles.toastDelete}`}>
                    <span>🗑 Task deleted.</span>
                    <button type="button" className={styles.toastClose} onClick={() => setToastDelete(false)}>✕</button>
                </div>
            )}
            {showListModal && (
                <CreateListModal
                    onSave={addList}
                    onClose={() => setShowListModal(false)}
                />
            )}
            <BackToTop />
        </div>
    );
}
