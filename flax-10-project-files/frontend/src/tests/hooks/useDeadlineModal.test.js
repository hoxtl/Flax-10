import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeadlineModal } from '../../components/modules/hooks/useDeadlineModal';

const getDeadlinesMock = vi.fn();
const createDeadlineMock = vi.fn();
const updateDeadlineMock = vi.fn();
const deleteDeadlineMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('../../api/deadlineApi', () => ({
  getDeadlines: (...args) => getDeadlinesMock(...args),
  createDeadline: (...args) => createDeadlineMock(...args),
  updateDeadline: (...args) => updateDeadlineMock(...args),
  deleteDeadline: (...args) => deleteDeadlineMock(...args),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => showToastMock,
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

  it('starts with the form open when creating from a launcher flow', async () => {
    const { result } = renderHook(() => useDeadlineModal(5, true));

    expect(result.current.showForm).toBe(true);
    await waitFor(() => expect(result.current.deadlines).toEqual([{ id: 1, title: 'CW' }]));
  });

  it('submits new deadline with end_due_date normalized to null', async () => {
    const { result } = renderHook(() => useDeadlineModal(7, true));

    await waitFor(() => expect(getDeadlinesMock).toHaveBeenCalledWith(7));

    await act(async () => {
      await result.current.handleSubmit({ title: 'Exam', end_due_date: '' });
    });

    expect(createDeadlineMock).toHaveBeenCalledWith(7, { title: 'Exam', end_due_date: null });
    expect(showToastMock).toHaveBeenCalledWith('Deadline added.', { variant: 'success' });
    expect(result.current.deadlines).toEqual([{ id: 1, title: 'CW' }, { id: 2, title: 'Exam' }]);
    expect(result.current.showForm).toBe(false);
  });

  it('submits edit deadline and updates list', async () => {
    getDeadlinesMock.mockResolvedValueOnce([{ id: 1, title: 'CW' }, { id: 3, title: 'Exam' }]);
    const { result } = renderHook(() => useDeadlineModal(7, false));

    await waitFor(() => expect(result.current.deadlines.length).toBe(2));
    act(() => result.current.openEdit({ id: 1, title: 'CW' }));

    await act(async () => {
      await result.current.handleSubmit({ title: 'CW updated', end_due_date: '2026-03-11' });
    });

    expect(updateDeadlineMock).toHaveBeenCalledWith(7, 1, { title: 'CW updated', end_due_date: '2026-03-11' });
    expect(showToastMock).toHaveBeenCalledWith('Deadline updated.', { variant: 'success' });
    expect(result.current.deadlines).toEqual([{ id: 1, title: 'CW updated' }, { id: 3, title: 'Exam' }]);
  });

  it('deletes deadline and removes from list', async () => {
    const { result } = renderHook(() => useDeadlineModal(9, false));

    await waitFor(() => expect(result.current.deadlines.length).toBe(1));
    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(deleteDeadlineMock).toHaveBeenCalledWith(9, 1);
    expect(showToastMock).toHaveBeenCalledWith('Deadline deleted.', { variant: 'success' });
    expect(result.current.deadlines).toEqual([]);
  });
});
