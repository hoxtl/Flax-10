import { useState, useEffect, useCallback } from "react";
import { fetchTasks, createTask, updateTask, deleteTask } from "../../../api/taskService";

export default function useTasks(filters = {}) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        fetchTasks(filters)
            .then(setTasks)
            .catch(() => {})
            .finally(() => {
                setLoading(false);
                setInitialLoading(false);
            });
    }, [JSON.stringify(filters)]);

    useEffect(() => { load(); }, [load]);

    const addTask = async (data) => {
        const created = await createTask(data);
        const merged = { ...created, task_list: created.task_list ?? data.task_list };
        setTasks(prev => [merged, ...prev]);
        return merged;
    };

    const editTask = async (id, data) => {
        const updated = await updateTask(id, data);
        setTasks(prev => prev.map(t => t.id === id ? updated : t));
        return updated;
    };

    const removeTask = async (id) => {
        await deleteTask(id);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const toggleComplete = (id, current) => editTask(id, { completed: !current });

    return { tasks, loading, initialLoading, addTask, editTask, removeTask, toggleComplete, reload: load };
}
