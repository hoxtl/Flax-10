import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import useTasks from "./hooks/useTasks";
import useTaskLists from "./hooks/useTaskLists";

import TaskFeed from "./components/TaskFeed";
import ListSidebar from "./components/ListSidebar";
import CreateTaskModal from "./components/CreateTaskModal";
import CreateListModal from "./components/CreateListModal";
import { BackToTop } from "../../components/Pagination/Pagination";

import styles from "./TasksPage.module.css";

function useFilteredTasks(tasks, activeListId, activeFilter, filterListIds = []) {
    return useMemo(() => {
        const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        let filtered = tasks;
        if (filterListIds && filterListIds.length > 0) {
            const set = new Set(filterListIds.map(String));
            filtered = tasks.filter(t => set.has(String(t.task_list)));
        } else if (activeListId) {
            filtered = tasks.filter(t => String(t.task_list) === String(activeListId));
        }

        if (activeFilter === "overdue")
            return filtered.filter(t => !t.completed && t.due_date && new Date(t.due_date) < dayStart);
        if (activeFilter === "today")
            return filtered.filter(t => t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= todayEnd);
        return filtered;
    }, [tasks, activeListId, activeFilter, filterListIds]);
}

/** End of today as ISO string so new tasks from Today view show in Today (due_date >= now && <= todayEnd). */
function getTodayEndISO() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
}

export default function TasksPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { lists, archivedLists, loading: listsLoading, addList, removeList, renameList, archiveList, restoreList, permanentlyDeleteList } = useTaskLists();
    const { tasks, initialLoading: tasksInitialLoading, addTask, editTask, removeTask, toggleComplete, reload: reloadTasks } = useTasks();
    const [activeListId,    setActiveListId]    = useState(null);
    const [filterListIds,   setFilterListIds]   = useState([]);
    const [activeFilter,   setActiveFilter]    = useState("all");
    const [showTaskModal,   setShowTaskModal]   = useState(false);
    const [showListModal,   setShowListModal]   = useState(false);
    const [showCreateListFromTask, setShowCreateListFromTask] = useState(false);
    const [lastCreatedListId, setLastCreatedListId] = useState(null);
    const [toastUndo,       setToastUndo]      = useState(null);
    const [toastDelete,     setToastDelete]    = useState(false);
    const openedFullPlanningFromUrl = useRef(false);

    useEffect(() => {
        const listParam = searchParams.get("list");
        if (listParam != null && listParam !== "") setActiveListId(listParam);
    }, [searchParams]);

    /* Open Full Planning modal from URL (e.g. homepage "Plan tomorrow" link) */
    const openParam = searchParams.get("open");
    useEffect(() => {
        if (openParam !== "fullPlanning" || openedFullPlanningFromUrl.current) return;
        openedFullPlanningFromUrl.current = true;
        setShowTaskModal(true);
        const next = new URLSearchParams(searchParams);
        next.delete("open");
        next.delete("due");
        setSearchParams(next, { replace: true });
    }, [openParam, searchParams, setSearchParams]);

    const activeModuleCode = searchParams.get("module") || null;

    const filteredTasks = useFilteredTasks(tasks, activeListId, activeFilter, filterListIds);
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
        if (!window.confirm("Permanently delete this list? You won't be able to restore it.")) return;
        permanentlyDeleteList(listId);
        if (activeListId === listId) { setActiveListId(null); setActiveFilter("all"); }
    };

    const handleArchiveList = async (listId) => {
        await archiveList(listId);
        if (activeListId === listId) { setActiveListId(null); setActiveFilter("all"); }
        reloadTasks();
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
                onSelectList={(id) => { setActiveListId(id); setFilterListIds([]); }}
                onSelectFilter={setActiveFilter}
                onNewList={() => setShowListModal(true)}
                onDeleteList={handleDeleteList}
                onArchiveList={handleArchiveList}
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
                filterListIds={filterListIds}
                onToggleComplete={toggleComplete}
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
                onFilterByList={setFilterListIds}
            />
            {showTaskModal && (
                <CreateTaskModal
                    lists={lists}
                    defaultListId={activeListId}
                    defaultDueDate={defaultDueDateForNewTask}
                    onOpenCreateList={() => setShowCreateListFromTask(true)}
                    newListIdCreated={lastCreatedListId}
                    onSave={async (data) => {
                        const created = await addTask(data);
                        setToastUndo(created ? { taskId: created.id, title: created.title } : null);
                        if (created) setTimeout(() => setToastUndo(null), 5000);
                    }}
                    onClose={() => { setShowTaskModal(false); setLastCreatedListId(null); }}
                />
            )}
            {toastUndo && (
                <div className={styles.toast}>
                    <span>Task added.</span>
                    <button type="button" className={styles.toastUndoBtn} onClick={handleUndoAddTask}>Undo</button>
                    <button type="button" className={styles.toastClose} onClick={() => setToastUndo(null)}>✕</button>
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
            {showCreateListFromTask && (
                <CreateListModal
                    onSave={async (data) => {
                        const created = await addList(data);
                        if (created?.id) setLastCreatedListId(created.id);
                        setShowCreateListFromTask(false);
                    }}
                    onClose={() => setShowCreateListFromTask(false)}
                />
            )}
            <BackToTop />
        </div>
    );
}
