import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSocieties } from '../../../../components/Society/hooks/useSocieties';
import * as api from '../../../../api/societyApi';

vi.mock('../../../../api/societyApi', () => ({
    fetchSocieties: vi.fn(),
    createSociety: vi.fn(),
    addCollaborator: vi.fn(),
    requestRatification: vi.fn(),
}));

describe('useSocieties', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('fetches societies on mount', async () => {
        api.fetchSocieties.mockResolvedValue([{ id: 1, name: 'Soc1' }]);
        const { result } = renderHook(() => useSocieties());
        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.societies).toEqual([{ id: 1, name: 'Soc1' }]);
    });

    it('sets error on fetch failure', async () => {
        api.fetchSocieties.mockRejectedValue(new Error('Network error'));
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Network error');
    });

    it('handleCreate creates society and adds to list with admin flags', async () => {
        api.fetchSocieties.mockResolvedValue([]);
        api.createSociety.mockResolvedValue({ id: 2, name: 'NewSoc' });
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        let newSoc;
        await act(async () => { newSoc = await result.current.handleCreate({ name: 'NewSoc' }); });
        expect(api.createSociety).toHaveBeenCalledWith({ name: 'NewSoc' });
        expect(result.current.societies).toContainEqual({ id: 2, name: 'NewSoc', is_admin: true, role: 'admin' });
        expect(newSoc.id).toBe(2);
        expect(newSoc.is_admin).toBe(true);
    });

    it('handleCreate adds collaborators when provided', async () => {
        api.fetchSocieties.mockResolvedValue([]);
        api.createSociety.mockResolvedValue({ id: 3, name: 'WithCollab' });
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleCreate({
                name: 'WithCollab',
                collaborators: [{ username: 'user1', role: 'editor' }]
            });
        });
        expect(api.addCollaborator).toHaveBeenCalledWith(3, 'user1', 'editor');
    });

    it('handleCreate requests ratification when flag is set', async () => {
        api.fetchSocieties.mockResolvedValue([]);
        api.createSociety.mockResolvedValue({ id: 4, name: 'Ratify' });
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleCreate({ name: 'Ratify', requestRatification: true });
        });
        expect(api.requestRatification).toHaveBeenCalledWith(4);
    });

    it('updateSocietyLocally updates a society in the list', async () => {
        api.fetchSocieties.mockResolvedValue([{ id: 5, name: 'Old', bio: 'OldBio' }]);
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        act(() => { result.current.updateSocietyLocally(5, { bio: 'NewBio' }); });
        expect(result.current.societies[0].bio).toBe('NewBio');
    });

    it('updateSocietyLocally leaves non-matching societies unchanged', async () => {
        api.fetchSocieties.mockResolvedValue([
            { id: 5, name: 'ToUpdate' },
            { id: 6, name: 'NoChange' }
        ]);
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        act(() => { result.current.updateSocietyLocally(5, { name: 'Updated' }); });
        expect(result.current.societies[0].name).toBe('Updated');
        expect(result.current.societies[1].name).toBe('NoChange');
    });

    it('refresh reloads societies', async () => {
        api.fetchSocieties.mockResolvedValue([{ id: 1, name: 'First' }]);
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        api.fetchSocieties.mockResolvedValue([{ id: 1, name: 'First' }, { id: 2, name: 'Second' }]);
        await act(async () => { result.current.refresh(); });
        await waitFor(() => expect(result.current.societies).toHaveLength(2));
    });

    it('removeSociety removes a society from the list', async () => {
        api.fetchSocieties.mockResolvedValue([
            { id: 1, name: 'Keep' },
            { id: 2, name: 'Remove' }
        ]);
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        act(() => { result.current.removeSociety(2); });
        expect(result.current.societies).toHaveLength(1);
        expect(result.current.societies[0].id).toBe(1);
    });

    it('removeSociety leaves other societies unchanged', async () => {
        api.fetchSocieties.mockResolvedValue([
            { id: 1, name: 'First' },
            { id: 2, name: 'Second' },
            { id: 3, name: 'Third' }
        ]);
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        act(() => { result.current.removeSociety(2); });
        expect(result.current.societies).toHaveLength(2);
        expect(result.current.societies.map(s => s.name)).toEqual(['First', 'Third']);
    });
});
