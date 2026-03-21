/*
 * useSocietyTags manages tag CRUD for society detail views.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import * as api from '../../../api/societyApi';

const appendTag = (setSociety, tag) =>
    setSociety(prev => ({ ...prev, tags: [...prev.tags, tag] }));

const replaceTag = (setSociety, tagId, updated) =>
    setSociety(prev => ({
        ...prev,
        tags: prev.tags.map(t => t.id === tagId ? updated : t)
    }));

const removeTag = (setSociety, tagId) =>
    setSociety(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t.id !== tagId)
    }));

const makeAddTag = (id, setSociety) =>
    async (data) => {
        const tag = await api.createSocietyTag(id, data);
        appendTag(setSociety, tag);
        return tag;
    };

const makeUpdateTag = (id, setSociety) =>
    async (tagId, data) => {
        const updated = await api.updateSocietyTag(id, tagId, data);
        replaceTag(setSociety, tagId, updated);
        return updated;
    };

const makeDeleteTag = (id, setSociety) =>
    async (tagId) => {
        await api.deleteSocietyTag(id, tagId);
        removeTag(setSociety, tagId);
    };

export const useSocietyTags = (id, society, setSociety) => ({
    addTag: makeAddTag(id, setSociety),
    updateTag: makeUpdateTag(id, setSociety),
    deleteTag: makeDeleteTag(id, setSociety),
});
