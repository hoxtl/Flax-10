import { createContext, useContext, useState, useEffect } from 'react';
import { getTags, createTag as apiCreateTag, deleteTag as apiDeleteTag, updateTag as apiUpdateTag } from '../api/tagApi';

const TagContext = createContext(null);
const NONE_TAG = { id: 'none', label: 'None', icon: '🏷️', color: 'var(--color-tag-none)' };

export function TagProvider({ children }) {
    const { tags, setTags, loading, refreshTags } = useTagLoader();
    const actions = useTagActions(setTags);
    const getters = useTagGetters(tags);

    const value = { tags, loading, refreshTags, ...actions, ...getters };

    return (
        <TagContext.Provider value={value}>
            {children}
        </TagContext.Provider>
    );
}

function useTagLoader() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshTags = async () => {
        try {
            const data = await getTags();
            setTags(data.map(mapBackendTag));
        } catch {}
    };

    useEffect(() => {
        loadInitialTags(setTags, setLoading);
    }, []);

    return { tags, setTags, loading, refreshTags };
}

async function loadInitialTags(setTags, setLoading) {
    try {
        const data = await getTags();
        setTags(data.map(mapBackendTag));
    } catch {
    } finally {
        setLoading(false);
    }
}

function useTagActions(setTags) {
    const addTag = (tag) => createTagAction(tag, setTags);
    const deleteTag = (id) => deleteTagAction(id, setTags);
    const updateTag = (id, updates) => updateTagAction(id, updates, setTags);

    return { addTag, deleteTag, updateTag };
}

function useTagGetters(tags) {
    const getTag = (id) => findTag(id, tags);
    const getTagByName = (name) => findTagByName(name, tags);
    return { getTag, getTagByName };
}

async function createTagAction(tag, setTags) {
    try {
        const data = { name: tag.label, color: tag.color, icon: tag.icon || '🏷️' };
        const created = await apiCreateTag(data);
        setTags((prev) => [...prev, mapBackendTag(created)]);
    } catch {}
}

async function deleteTagAction(id, setTags) {
    try {
        await apiDeleteTag(id);
        setTags((prev) => prev.filter((t) => t.id !== id));
        return true;
<<<<<<< HEAD
    } catch {
=======
    } catch (err) {
        console.error('Failed to delete tag:', err);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        return false;
    }
}

async function updateTagAction(id, updates, setTags) {
    try {
        const backendData = { name: updates.label, color: updates.color, icon: updates.icon };
        const updated = await apiUpdateTag(id, backendData);
        setTags((prev) => prev.map((t) => (t.id === id ? mapBackendTag(updated) : t)));
    } catch {}
}

function findTag(id, tags) {
    if (id === undefined || id === null) return NONE_TAG;
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return tags.find((t) => t.id === numId) || findOtherTag(tags);
}

function findTagByName(name, tags) {
    if (!name) return NONE_TAG;
    const lower = name.toLowerCase();
    return tags.find(t => t.label.toLowerCase() === lower) || findOtherTag(tags);
}

function findOtherTag(tags) {
    return tags.find(t => t.label.toLowerCase() === 'other') || NONE_TAG;
}

function mapBackendTag(tag) {
    let icon = tag.icon || '🏷️';
    if (tag.name === 'Other' && icon === '🏷️') icon = '⭐';
    return { id: tag.id, label: tag.name, icon, color: tag.color };
}

export function useTags() {
    const context = useContext(TagContext);
    if (!context) {
        return { tags: [], loading: false, getTag: () => null, addTag: () => { }, deleteTag: () => { }, updateTag: () => { }, refreshTags: async () => { } };
    }
    return context;
}
