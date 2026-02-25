import { useState, useEffect, useCallback } from "react";
import { fetchTaskLists, fetchArchivedTaskLists, createTaskList, deleteTaskList, updateTaskList } from "../../../api/taskService";

export default function useTaskLists() {
    const [lists, setLists] = useState([]);
    const [archivedLists, setArchivedLists] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        fetchTaskLists()
            .then((data) => {
                const merged = (data || []).map((list, idx) => {
                    const stored = typeof window !== "undefined" && list.id ? localStorage.getItem("listColor:" + list.id) : null;
                    return { ...list, color: list.color || stored || undefined };
                });
                setLists(merged);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const loadArchived = useCallback(() => {
        fetchArchivedTaskLists()
            .then((data) => {
                const merged = (data || []).map((list) => {
                    const stored = typeof window !== "undefined" && list.id ? localStorage.getItem("listColor:" + list.id) : null;
                    return { ...list, color: list.color || stored || undefined };
                });
                setArchivedLists(merged);
            })
            .catch(() => {});
    }, []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { loadArchived(); }, [loadArchived]);

    const addList = async (data) => {
        const created = await createTaskList(data);
        if (created?.id && data.color) {
            try { localStorage.setItem("listColor:" + created.id, data.color); } catch (_) {}
            setLists(prev => prev.concat([{ ...created, color: data.color }]));
            return { ...created, color: data.color };
        }
        setLists(prev => [...prev, created]);
        return created;
    };

    const renameList = async (id, data) => {
        const updated = await updateTaskList(id, typeof data === "string" ? { name: data } : data);
        setLists(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
        return updated;
    };

    const removeList = async (id) => {
        await updateTaskList(id, { archived: true });
        setLists(prev => prev.filter(l => l.id !== id));
        loadArchived();
    };

    const restoreList = async (id) => {
        await updateTaskList(id, { archived: false });
        load();
        loadArchived();
    };

    const permanentlyDeleteList = async (id) => {
        await deleteTaskList(id);
        setArchivedLists(prev => prev.filter(l => l.id !== id));
    };

    return { lists, archivedLists, loading, addList, removeList, renameList, restoreList, permanentlyDeleteList, reload: load, reloadArchived: loadArchived };
}