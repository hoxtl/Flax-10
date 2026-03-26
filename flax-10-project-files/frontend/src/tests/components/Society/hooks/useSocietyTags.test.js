import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocietyTags } from '../../../../components/Society/hooks/useSocietyTags';
import * as api from '../../../../api/societyApi';

vi.mock('../../../../api/societyApi', () => ({
    createSocietyTag: vi.fn(),
    updateSocietyTag: vi.fn(),
    deleteSocietyTag: vi.fn()
}));

describe('useSocietyTags', () => {
    const mockId = 1;
    let mockSoc, setSociety;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSoc = { id: 1, tags: [{ id: 10, name: 'T1' }] };
        setSociety = vi.fn((updater) => {
            if (typeof updater === 'function') {
                mockSoc = updater(mockSoc);
            }
        });
    });

    function renderTagsHook() {
        return renderHook(() => useSocietyTags(mockId, mockSoc, setSociety));
    }

    async function updateTag(tagId, payload) {
        const { result } = renderTagsHook();
        await act(async () => {
            await result.current.updateTag(tagId, payload);
        });
    }

    it('addTag calls api and updates state', async () => {
        const newTag = { id: 11, name: 'T2' };
        api.createSocietyTag.mockResolvedValue(newTag);
        const { result } = renderTagsHook();
        
        await act(async () => {
            const res = await result.current.addTag({ name: 'T2' });
            expect(res).toEqual(newTag);
        });
        expect(api.createSocietyTag).toHaveBeenCalledWith(mockId, { name: 'T2' });
        expect(setSociety).toHaveBeenCalled();
        expect(mockSoc.tags).toHaveLength(2);
    });

    it('updateTag calls api and updates state', async () => {
        const updatedTag = { id: 10, name: 'T1-Up' };
        api.updateSocietyTag.mockResolvedValue(updatedTag);
        await updateTag(10, { name: 'T1-Up' });
        expect(api.updateSocietyTag).toHaveBeenCalledWith(mockId, 10, { name: 'T1-Up' });
        expect(mockSoc.tags[0].name).toBe('T1-Up');
    });

    it('updateTag coverage for non-matching id', async () => {
        const updatedTag = { id: 10, name: 'T1-Up' };
        api.updateSocietyTag.mockResolvedValue(updatedTag);
        mockSoc = { id: 1, tags: [{ id: 10, name: 'T1' }, { id: 11, name: 'T2' }] };
        await updateTag(10, { name: 'T1-Up' });
        expect(mockSoc.tags[1].id).toBe(11); // T2 remains unchanged
    });

    it('deleteTag calls api and updates state', async () => {
        api.deleteSocietyTag.mockResolvedValue({});
        const { result } = renderTagsHook();
        
        await act(async () => {
            await result.current.deleteTag(10);
        });
        expect(api.deleteSocietyTag).toHaveBeenCalledWith(mockId, 10);
        expect(mockSoc.tags).toHaveLength(0);
    });
});
