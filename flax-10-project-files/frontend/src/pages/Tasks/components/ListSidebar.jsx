import styles from "./ListSidebar.module.css";

const CATEGORY_COLOURS = {
    uni: "#3b82f6",
    society: "#8b5cf6",
    personal: "#f59e0b",
    private: "#6b7280",
};

const CATEGORY_ICONS = {
    uni: "📘", society: "🟣", personal: "🟡", private: "🔒",
};

const FILTERS = [
    { id: "all", label: "All tasks" },
    { id: "overdue", label: "Overdue", accent: "var(--danger)" },
    { id: "today", label: "Due today", accent: "#f59e0b" },
    { id: "week", label: "This week" },
];

function FilterItem({ filter, active, tasks, onSelect }) {
    const count = tasks.filter(t => {
        const now = new Date();
        const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
        const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
        if (filter.id === "overdue") return !t.completed && t.due_date && new Date(t.due_date) < now;
        if (filter.id === "today") return t.due_date && new Date(t.due_date) <= todayEnd;
        if (filter.id === "week") return t.due_date && new Date(t.due_date) <= weekEnd;
        return true;
    }).length;

    return (
        <button className={`${styles.filterItem} ${active ? styles.active : ""}`} onClick={onSelect}>
            <span style={{ color: filter.accent || "var(--muted)" }}>{filter.label}</span>
            {count > 0 && <span className={styles.badge}>{count}</span>}
        </button>
    );
}

function ListItem({ list, active, taskCount, onSelect, onDelete }) {
    return (
        <div className={`${styles.listItem} ${active ? styles.active : ""}`} onClick={onSelect}>
            <span className={styles.dot} style={{ background: CATEGORY_COLOURS[list.category] }} />
            <span className={styles.listIcon}>{CATEGORY_ICONS[list.category]}</span>
            <span className={styles.listName}>{list.name}</span>
            <span className={styles.listCount}>{taskCount}</span>
        </div>
    );
}

export default function ListSidebar({ lists, tasks, activeListId, activeFilter, onSelectList, onSelectFilter, onNewList, onDeleteList, onAddTask }) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.section}>
                <span className={styles.sectionLabel}>Filters</span>
                {FILTERS.map(f => (
                    <FilterItem
                        key={f.id}
                        filter={f}
                        active={!activeListId && activeFilter === f.id}
                        tasks={tasks}
                        onSelect={() => { onSelectList(null); onSelectFilter(f.id); }}
                    />
                ))}
            </div>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Lists</span>
                    <button className={styles.newListBtn} onClick={onNewList}>+</button>
                </div>
                {lists.map(list => (
                    <ListItem
                        key={list.id}
                        list={list}
                        active={activeListId === list.id}
                        taskCount={tasks.filter(t => t.task_list === list.id && !t.completed).length}
                        onSelect={() => { onSelectList(list.id); onSelectFilter("all"); }}
                        onDelete={() => onDeleteList(list.id)}
                    />
                ))}
                {lists.length === 0 && <p className={styles.emptyLists}>No lists yet</p>}
            </div>
            <button className={styles.addTaskBtn} onClick={onAddTask}>+ Add Task</button>
        </aside>
    );
}