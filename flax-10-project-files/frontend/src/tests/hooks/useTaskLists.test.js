import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTaskLists from '../../pages/Tasks/hooks/useTaskLists';

vi.mock('../../api/taskApi', () => ({
    fetchTaskLists: vi.fn(),
    fetchArchivedTaskLists: vi.fn(),
    createTaskList: vi.fn(),
    updateTaskList: vi.fn(),
    deleteTaskList: vi.fn(),
}));

import { fetchTaskLists, fetchArchivedTaskLists, createTaskList, updateTaskList, deleteTaskList } from '../../api/taskApi';

describe('useTaskLists', () => {
    beforeEach(() => {
        fetchTaskLists.mockResolvedValue([
            { id: 1, name: 'Work', color: null },
            { id: 2, name: 'Personal', color: '#ff0' },
        ]);
        fetchArchivedTaskLists.mockResolvedValue([
            { id: 10, name: 'Old List', color: null },
        ]);
        createTaskList.mockResolvedValue({ id: 3, name: 'New List', color: null });
        updateTaskList.mockResolvedValue({ id: 1, name: 'Work Updated' });
        deleteTaskList.mockResolvedValue();
    });

    it('loads task lists on mount', async () => {
        const { result } = renderHook(() => useTaskLists());
        expect(result.current.loading).toBe(true);
        await act(async () => {});
        expect(result.current.loading).toBe(false);
        expect(result.current.lists).toHaveLength(2);
    });

    it('loads archived lists on mount', async () => {
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        expect(result.current.archivedLists).toHaveLength(1);
        expect(result.current.archivedLists[0].id).toBe(10);
    });

    it('handles fetch error gracefully', async () => {
        fetchTaskLists.mockRejectedValueOnce(new Error('Network error'));
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        expect(result.current.lists).toEqual([]);
    });

    it('addList adds new list and returns it', async () => {
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        let added;
        await act(async () => {
            added = await result.current.addList({ name: 'New List' });
        });
        expect(added.id).toBe(3);
        expect(result.current.lists.some(l => l.id === 3)).toBe(true);
    });

    it('addList merges color into returned list when color is provided', async () => {
        createTaskList.mockResolvedValueOnce({ id: 5, name: 'Colored List', color: null });
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        let added;
        await act(async () => {
            added = await result.current.addList({ name: 'Colored List', color: '#abc' });
        });
        expect(added.color).toBe('#abc');
        expect(result.current.lists.find(l => l.id === 5)?.color).toBe('#abc');
    });

    it('renameList updates list in state', async () => {
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        await act(async () => {
            await result.current.renameList(1, 'Work Updated');
        });
        expect(updateTaskList).toHaveBeenCalledWith(1, { name: 'Work Updated' });
    });

    it('renameList with object data passes it directly', async () => {
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        await act(async () => {
            await result.current.renameList(1, { name: 'New Name', color: '#f00' });
        });
        expect(updateTaskList).toHaveBeenCalledWith(1, { name: 'New Name', color: '#f00' });
    });

    it('removeList archives the list and reloads archived', async () => {
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        await act(async () => {
            await result.current.removeList(1);
        });
        expect(updateTaskList).toHaveBeenCalledWith(1, { archived: true });
        expect(result.current.lists.find(l => l.id === 1)).toBeUndefined();
    });

    it('restoreList unarchives and reloads lists', async () => {
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        await act(async () => {
            await result.current.restoreList(10);
        });
        expect(updateTaskList).toHaveBeenCalledWith(10, { archived: false });
    });

    it('permanentlyDeleteList deletes and removes from archivedLists', async () => {
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        await act(async () => {
            await result.current.permanentlyDeleteList(10);
        });
        expect(deleteTaskList).toHaveBeenCalledWith(10);
        expect(result.current.archivedLists.find(l => l.id === 10)).toBeUndefined();
    });

    it('merges localStorage color into list', async () => {
        localStorage.setItem('listColor:1', '#123456');
        fetchTaskLists.mockResolvedValueOnce([{ id: 1, name: 'Work', color: null }]);
        const { result } = renderHook(() => useTaskLists());
        await act(async () => {});
        const list = result.current.lists.find(l => l.id === 1);
        expect(list.color).toBe('#123456');
        localStorage.removeItem('listColor:1');
    });
});
