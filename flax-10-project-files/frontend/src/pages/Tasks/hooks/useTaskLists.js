import { useState, useEffect, useCallback } from "react";
import { fetchTaskLists, createTaskList, deleteTaskList, updateTaskList } from "../../../api/taskService";

export default function useTaskLists() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        fetchTaskLists()
            .then(setLists)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const addList = async (data) => {
        const created = await createTaskList(data);
        setLists(prev => [...prev, created]);
        return created;
    };

    const renameList = async (id, data) => {
        const updated = await updateTaskList(id, typeof data === "string" ? { name: data } : data);
        setLists(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
        return updated;
    };

    const removeList = async (id) => {
        await deleteTaskList(id);
        setLists(prev => prev.filter(l => l.id !== id));
    };

    return { lists, loading, addList, removeList, renameList, reload: load };
}