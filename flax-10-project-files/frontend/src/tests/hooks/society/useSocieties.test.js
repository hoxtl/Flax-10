import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSocieties } from '../../../components/society/hooks/useSocieties';

vi.mock('../../../api/societyApi', () => ({
    fetchSocieties: vi.fn(),
    createSociety: vi.fn(),
    addCollaborator: vi.fn(),
    requestRatification: vi.fn(),
}));

import { fetchSocieties, createSociety, addCollaborator, requestRatification } from '../../../api/societyApi';

const mockSocieties = [
    { id: 1, name: 'Chess Club' },
    { id: 2, name: 'Drama Society' },
];

describe('useSocieties', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchSocieties.mockResolvedValue(mockSocieties);
        createSociety.mockResolvedValue({ id: 3, name: 'New Society' });
        addCollaborator.mockResolvedValue({});
        requestRatification.mockResolvedValue({});
    });

    async function renderLoadedHook() {
        const hook = renderHook(() => useSocieties());
        await waitFor(() => expect(hook.result.current.loading).toBe(false));
        return hook;
    }

    it('starts with loading=true', () => {
        fetchSocieties.mockImplementationOnce(() => new Promise(() => {}));
        const { result, unmount } = renderHook(() => useSocieties());
        expect(result.current.loading).toBe(true);
        unmount();
    });

    it('loads societies on mount', async () => {
        const { result } = await renderLoadedHook();
        expect(result.current.societies).toEqual(mockSocieties);
    });

    it('sets error on fetch failure', async () => {
        fetchSocieties.mockRejectedValueOnce(new Error('Network error'));
        const { result } = renderHook(() => useSocieties());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Network error');
    });

    it('refresh reloads societies', async () => {
        const { result } = await renderLoadedHook();
        const newSocieties = [{ id: 3, name: 'Art Club' }];
        fetchSocieties.mockResolvedValueOnce(newSocieties);
        await act(async () => { await result.current.refresh(); });
        expect(result.current.societies).toEqual(newSocieties);
    });

    it('handleCreate creates a new society', async () => {
        const { result } = await renderLoadedHook();
        await act(async () => {
            await result.current.handleCreate({ name: 'New Society', collaborators: [] });
        });
        expect(createSociety).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Society' }));
    });

    it('handleCreate adds society to list', async () => {
        const { result } = await renderLoadedHook();
        await act(async () => {
            await result.current.handleCreate({ name: 'New Society', collaborators: [] });
        });
        expect(result.current.societies).toHaveLength(mockSocieties.length + 1);
    });

    it('handleCreate adds collaborators', async () => {
        const { result } = await renderLoadedHook();
        const collaborators = [{ username: 'alice', role: 'editor' }];
        await act(async () => {
            await result.current.handleCreate({ name: 'New Society', collaborators });
        });
        expect(addCollaborator).toHaveBeenCalledWith(3, 'alice', 'editor');
    });

    it('handleCreate requests ratification when flag is set', async () => {
        const { result } = await renderLoadedHook();
        await act(async () => {
            await result.current.handleCreate({
                name: 'New Society',
                collaborators: [],
                requestRatification: true,
            });
        });
        expect(requestRatification).toHaveBeenCalledWith(3);
    });

    it('does not request ratification when flag is false', async () => {
        const { result } = await renderLoadedHook();
        await act(async () => {
            await result.current.handleCreate({
                name: 'New Society',
                collaborators: [],
                requestRatification: false,
            });
        });
        expect(requestRatification).not.toHaveBeenCalled();
    });

    it('handleCreate converts camelCase keys to snake_case', async () => {
        const { result } = await renderLoadedHook();
        await act(async () => {
            await result.current.handleCreate({ societyName: 'Test', collaborators: [] });
        });
        expect(createSociety).toHaveBeenCalledWith(expect.objectContaining({ society_name: 'Test' }));
    });
});
