import TaskCard from "./TaskCard";
import styles from "./TaskFeed.module.css";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

function groupTasks(tasks) {
    const now = new Date();
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
    const overdue = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < now);
    const today = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= todayEnd);
    const week = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) > todayEnd && new Date(t.due_date) <= weekEnd);
    const later = tasks.filter(t => !t.completed && (!t.due_date || new Date(t.due_date) > weekEnd));
    const done = tasks.filter(t => t.completed);
    return { overdue, today, week, later, done };
}

function sortByPriority(tasks) {
    return [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

function TaskGroup({ title, tasks, accent, onToggleComplete, onDeleteTask, onEditTask }) {
    if (tasks.length === 0) return null;
    return (
        <div className={styles.group}>
            <div className={styles.groupHeader}>
                <span className={styles.groupDot} style={{ background: accent }} />
                <span className={styles.groupTitle} style={{ color: accent }}>{title}</span>
                <span className={styles.groupCount}>{tasks.length}</span>
            </div>
            {sortByPriority(tasks).map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleComplete(task.id, task.completed)}
                    onDelete={() => onDeleteTask(task.id)}
                    onEdit={(data) => onEditTask(task.id, data)}
                />
            ))}
        </div>
    );
}

export default function TaskFeed({ tasks, onToggleComplete, onDeleteTask, onEditTask, onAddTask }) {
    const incomplete = tasks.filter(t => !t.completed);
    const { overdue, today, week, later, done } = groupTasks(tasks);

    if (tasks.length === 0) {
        return (
            <div className={styles.feed}>
                <div className={styles.empty}>
                    <p className={styles.emptyTitle}>Nothing here yet</p>
                    <button className={styles.emptyBtn} onClick={onAddTask}>+ Add your first task</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.feed}>
            <div className={styles.feedHeader}>
                <h2 className={styles.feedTitle}>Today</h2>
                <span className={styles.incompleteCount}>{incomplete.length} remaining</span>
            </div>
            <div className={styles.groups}>
                <TaskGroup title="Overdue" tasks={overdue} accent="var(--danger)" onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />
                <TaskGroup title="Today" tasks={today} accent="#f59e0b" onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />
                <TaskGroup title="This week" tasks={week} accent="var(--primary)" onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />
                <TaskGroup title="Later" tasks={later} accent="var(--muted)" onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />
                <TaskGroup title="Completed" tasks={done} accent="var(--muted)" onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />
            </div>
        </div>
    );
}