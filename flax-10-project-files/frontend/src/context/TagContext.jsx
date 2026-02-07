import { createContext, useContext, useState, useEffect } from 'react';

const TagContext = createContext(null);

const DEFAULT_TAGS = [
    { id: 'class', label: 'Class', icon: '📚', color: '#A78BFA' },
    { id: 'study', label: 'Study', icon: '🧠', color: '#34D399' },
    { id: 'task', label: 'Task', icon: '✅', color: '#FBBF24' },
    { id: 'travel', label: 'Travel', icon: '🚌', color: '#60A5FA' },
    { id: 'other', label: 'Other', icon: '⭐', color: '#94A3B8' },
];

export function TagProvider({ children }) {
    const [tags, setTags] = useState(() => {
        const saved = localStorage.getItem('calendar_tags');
        return saved ? JSON.parse(saved) : DEFAULT_TAGS;
    });

    useEffect(() => {
        localStorage.setItem('calendar_tags', JSON.stringify(tags));
    }, [tags]);

    const addTag = (tag) => {
        const newTag = { ...tag, id: tag.id || crypto.randomUUID() };
        setTags((prev) => [...prev, newTag]);
    };

    const updateTag = (id, updates) => {
        setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    };

    const deleteTag = (id) => {
        setTags((prev) => prev.filter((t) => t.id !== id));
    };

    const getTag = (id) => tags.find((t) => t.id === id) || tags.find((t) => t.id === 'other');

    return (
        <TagContext.Provider value={{ tags, addTag, updateTag, deleteTag, getTag }}>
            {children}
        </TagContext.Provider>
    );
}

export function useTags() {
    const context = useContext(TagContext);
    if (!context) {
        throw new Error('useTags must be used within a TagProvider');
    }
    return context;
}
