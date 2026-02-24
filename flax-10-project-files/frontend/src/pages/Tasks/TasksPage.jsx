import { useState, useMemo } from "react";
import useTasks from "./hooks/useTasks";
import useTaskLists from "./hooks/useTaskLists";
import TaskFeed from "./components/TaskFeed";
import ListSidebar from "./components/ListSidebar";
import CreateTaskModal from "./components/CreateTaskModal";
import CreateListModal from "./components/CreateListModal";
import styles from "./TasksPage.module.css";

function useFilteredTasks(tasks, activeListId, activeFilter) {
    return useMemo(() => {
        const now      = new Date();
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const weekEnd  = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);

        let filtered = activeListId
            ? tasks.filter(t => String(t.task_list) === String(activeListId))
            : tasks;

        if (activeFilter === "overdue")
            return filtered.filter(t => !t.completed && t.due_date && new Date(t.due_date) < now);
        if (activeFilter === "today")
            return filtered.filter(t => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= todayEnd);
        if (activeFilter === "week")
            return filtered.filter(t => t.due_date && new Date(t.due_date) <= weekEnd);
        return filtered;
    }, [tasks, activeListId, activeFilter]);
}

export default function TasksPage() {
    const { lists, loading: listsLoading, addList, removeList, renameList } = useTaskLists();
    const { tasks, addTask, editTask, removeTask, toggleComplete } = useTasks();
    const [activeListId,    setActiveListId]    = useState(null);
    const [activeFilter,    setActiveFilter]    = useState("all");
    const [showTaskModal,   setShowTaskModal]   = useState(false);
    const [showListModal,   setShowListModal]   = useState(false);
    const [archivedLists,   setArchivedLists]   = useState([]);

    const filteredTasks = useFilteredTasks(tasks, activeListId, activeFilter);

    const handleDeleteList = (listId) => {
        const list = lists.find(l => l.id === listId);
        if (list) setArchivedLists(prev => [...prev, list]);
        removeList(listId);
        if (activeListId === listId) { setActiveListId(null); setActiveFilter("all"); }
    };

    const handleUnarchiveList = (listId) => {
        const list = archivedLists.find(l => l.id === listId);
        if (!list) return;
        setArchivedLists(prev => prev.filter(l => l.id !== listId));
        addList({ name: list.name, icon: list.icon, color: list.color });
    };

    const handlePermanentlyDeleteList = (listId) => {
        if (!window.confirm("Permanently delete this list? You won’t be able to restore it.")) return;
        setArchivedLists(prev => prev.filter(l => l.id !== listId));
    };

    if (listsLoading) return <div className={styles.loading}>Loading…</div>;

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
                onToggleComplete={toggleComplete}
                onDeleteTask={removeTask}
                onEditTask={editTask}
                onCreateTask={() => setShowTaskModal(true)}
            />
            {showTaskModal && (
                <CreateTaskModal
                    lists={lists}
                    defaultListId={activeListId}
                    onSave={addTask}
                    onClose={() => setShowTaskModal(false)}
                />
            )}
            {showListModal && (
                <CreateListModal
                    onSave={addList}
                    onClose={() => setShowListModal(false)}
                />
            )}
        </div>
    );
}