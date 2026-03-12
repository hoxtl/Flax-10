import * as api from '../../../api/societyApi';

export const useSocietyTags = (id, society, setSociety) => {
    const addTag = async (data) => {
        const tag = await api.createSocietyTag(id, data);
        setSociety(prev => ({ ...prev, tags: [...prev.tags, tag] }));
        return tag;
    };

    const updateTag = async (tagId, data) => {
        const updated = await api.updateSocietyTag(id, tagId, data);
        setSociety(prev => ({
            ...prev,
            tags: prev.tags.map(t => t.id === tagId ? updated : t)
        }));
        return updated;
    };

    const deleteTag = async (tagId) => {
        await api.deleteSocietyTag(id, tagId);
        setSociety(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t.id !== tagId)
        }));
    };

    return { addTag, updateTag, deleteTag };
};
