import { createContext, useContext, useState, useEffect } from 'react';
import { fetchTags, createTag as apiCreateTag, deleteTag as apiDeleteTag, updateTag as apiUpdateTag } from '../api/tagApi';

const TagContext = createContext(null);

const ICON_MAP = {
    'class': '📚', 'classes': '📚',
    'study': '🧠',
    'task': '✅',
    'travel': '🚌',
    'food': '🍔',
    'other': '⭐',
};

const DEFAULT_ICON = '🏷️';

export function TagProvider({ children }) {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTags();
    }, []);

    async function loadTags() {
        try {
            const data = await fetchTags();
            setTags(data.map(mapBackendTag));
        } catch (err) {
            console.error('Failed to fetch tags:', err);
        } finally {
            setLoading(false);
        }
    }

    const addTag = async (tag) => {
        try {
            const backendTag = { name: tag.label, color: tag.color };
            const created = await apiCreateTag(backendTag);
            setTags((prev) => [...prev, mapBackendTag(created)]);
        } catch (err) {
            console.error('Failed to create tag:', err);
        }
    };

    const deleteTag = async (id) => {
        try {
            await apiDeleteTag(id);
            setTags((prev) => prev.filter((t) => t.id !== id));
        } catch (err) {
            console.error('Failed to delete tag:', err);
        }
    };

    const updateTag = async (id, updates) => {
        try {
            const backendData = { name: updates.label, color: updates.color };
            const updated = await apiUpdateTag(id, backendData);
            setTags((prev) => prev.map((t) => (t.id === id ? mapBackendTag(updated) : t)));
        } catch (err) {
            console.error('Failed to update tag:', err);
        }
    };

    const getTag = (id) => {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        return tags.find((t) => t.id === numId) || tags.find((t) => t.label === 'Other');
    };

    const value = { tags, addTag, deleteTag, updateTag, getTag, loading };

    return (
        <TagContext.Provider value={value}>
            {children}
        </TagContext.Provider>
    );
}

function mapBackendTag(tag) {
    const icon = getIconForTag(tag.name);
    return { id: tag.id, label: tag.name, icon, color: tag.color };
}

function getIconForTag(name) {
    const key = name.toLowerCase();
    return ICON_MAP[key] || DEFAULT_ICON;
}

export function useTags() {
    const context = useContext(TagContext);
    if (!context) throw new Error('useTags must be used within a TagProvider');
    return context;
}
