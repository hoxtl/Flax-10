import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTasks, updateTask } from "../../api/taskService";
import styles from "./TodayTasks.module.css";

const PRIORITY_COLOURS = {
    urgent: "var(--danger)",
    high: "#f59e0b",
    medium: "var(--primary)",
    low: "var(--muted)",
};

function useTodayTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const now = new Date();
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        fetchTasks()
            .then(data => {
                const relevant = data.filter(t => {
                    if (t.completed) return false;
                    if (!t.due_date) return false;
                    const due = new Date(t.due_date);
                    return due <= todayEnd;
                }).sort((a, b) => {
                    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
                    return p[a.priority] - p[b.priority];
                }).slice(0, 5);
                setTasks(relevant);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const toggleComplete = async (id) => {
        await updateTask(id, { completed: true });
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return { tasks, loading, toggleComplete };
}

function TaskRow({ task, onToggle }) {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
    return (
        <div className={styles.row}>
            <button className={styles.checkbox} onClick={() => onToggle(task.id)} />
            <div className={styles.info}>
                <span className={styles.title}>{task.title}</span>
                <div className={styles.meta}>
                    <span style={{ color: PRIORITY_COLOURS[task.priority] }} className={styles.priority}>
                        ● {task.priority}
                    </span>
                    {task.module_code && <span className={styles.module}>{task.module_code}</span>}
                    {isOverdue && <span className={styles.overdue}>Overdue</span>}
                </div>
            </div>
        </div>
    );
}

export default function TodayTasks() {
    const { tasks, loading, toggleComplete } = useTodayTasks();
    const navigate = useNavigate();

    if (loading || tasks.length === 0) return null;

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.dot} />
                    <span className={styles.label}>Due Today</span>
                    <span className={styles.count}>{tasks.length}</span>
                </div>
                <button className={styles.viewAll} onClick={() => navigate("/tasks")}>
                    View all →
                </button>
            </div>
            <div className={styles.list}>
                {tasks.map(task => (
                    <TaskRow key={task.id} task={task} onToggle={toggleComplete} />
                ))}
            </div>
        </div>
    );
}