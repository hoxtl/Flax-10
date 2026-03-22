import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeadlineModal } from '../../components/Modules/hooks/useDeadlineModal';

const getDeadlinesMock = vi.fn();
const createDeadlineMock = vi.fn();
const updateDeadlineMock = vi.fn();
const deleteDeadlineMock = vi.fn();

vi.mock('../../api/calendar/deadlineApi', () => ({
  getDeadlines: (...args) => getDeadlinesMock(...args),
  createDeadline: (...args) => createDeadlineMock(...args),
  updateDeadline: (...args) => updateDeadlineMock(...args),
  deleteDeadline: (...args) => deleteDeadlineMock(...args),
}));

describe('useDeadlineModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDeadlinesMock.mockResolvedValue([{ id: 1, title: 'CW' }]);
    createDeadlineMock.mockResolvedValue({ id: 2, title: 'Exam' });
    updateDeadlineMock.mockResolvedValue({ id: 1, title: 'CW updated' });
    deleteDeadlineMock.mockResolvedValue({});
  });

  it('loads deadlines and supports create/edit UI state transitions', async () => {
    const { result } = renderHook(() => useDeadlineModal(5, false));

    await waitFor(() => expect(result.current.deadlines).toEqual([{ id: 1, title: 'CW' }]));
    expect(result.current.showForm).toBe(false);

    act(() => result.current.openCreate());
    expect(result.current.showForm).toBe(true);
    expect(result.current.editing).toBeNull();

    act(() => result.current.openEdit({ id: 1, title: 'CW' }));
    expect(result.current.editing).toEqual({ id: 1, title: 'CW' });

    act(() => result.current.close());
    expect(result.current.showForm).toBe(false);
    expect(result.current.editing).toBeNull();
  });

  it('submits new deadline with end_due_date normalized to null', async () => {
    const { result } = renderHook(() => useDeadlineModal(7, true));

    await waitFor(() => expect(getDeadlinesMock).toHaveBeenCalledWith(7));

    await act(async () => {
      await result.current.handleSubmit({ title: 'Exam', end_due_date: '' });
    });

    expect(createDeadlineMock).toHaveBeenCalledWith(7, { title: 'Exam', end_due_date: null });
    expect(result.current.deadlines).toEqual([{ id: 1, title: 'CW' }, { id: 2, title: 'Exam' }]);
    expect(result.current.showForm).toBe(false);
  });

  it('submits edit deadline and updates list', async () => {
    const { result } = renderHook(() => useDeadlineModal(7, false));

    await waitFor(() => expect(result.current.deadlines.length).toBe(1));
    act(() => result.current.openEdit({ id: 1, title: 'CW' }));

    await act(async () => {
      await result.current.handleSubmit({ title: 'CW updated', end_due_date: '2026-03-11' });
    });

    expect(updateDeadlineMock).toHaveBeenCalledWith(7, 1, { title: 'CW updated', end_due_date: '2026-03-11' });
    expect(result.current.deadlines).toEqual([{ id: 1, title: 'CW updated' }]);
  });

  it('deletes deadline and removes from list', async () => {
    const { result } = renderHook(() => useDeadlineModal(9, false));

    await waitFor(() => expect(result.current.deadlines.length).toBe(1));
    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(deleteDeadlineMock).toHaveBeenCalledWith(9, 1);
    expect(result.current.deadlines).toEqual([]);
  });
});
