import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTagManagerModal from '../../../../components/tags/tag_manager/useTagManagerModal';

const mockTags = [
  { id: 1, label: 'Work', color: '#ff0000' },
  { id: 2, label: 'other', color: '#00ff00' },
];

const mockAddTag = vi.fn();
const mockUpdateTag = vi.fn();
const mockDeleteTag = vi.fn();
const mockConfirm = vi.fn().mockResolvedValue(true);
const mockToast = vi.fn();

vi.mock('../../../../context/TagContext', () => ({
  useTags: vi.fn(() => ({
    tags: mockTags,
    addTag: mockAddTag,
    updateTag: mockUpdateTag,
    deleteTag: mockDeleteTag,
  })),
}));

vi.mock('../../../../context/ConfirmContext', () => ({
  useConfirm: vi.fn(() => mockConfirm),
}));

vi.mock('../../../../context/ToastContext', () => ({
  useToast: vi.fn(() => mockToast),
}));

import { useTags } from '../../../../context/TagContext';

describe('useTagManagerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTags.mockReturnValue({
      tags: mockTags,
      addTag: mockAddTag,
      updateTag: mockUpdateTag,
      deleteTag: mockDeleteTag,
    });
  });

  it('initializes with null editingId and false isAdding', () => {
    const { result } = renderHook(() => useTagManagerModal());
    expect(result.current.editingId).toBeNull();
    expect(result.current.isAdding).toBe(false);
  });

  it('exposes tags from context', () => {
    const { result } = renderHook(() => useTagManagerModal());
    expect(result.current.tags).toEqual(mockTags);
  });

  it('setEditingId updates editingId', () => {
    const { result } = renderHook(() => useTagManagerModal());
    act(() => {
      result.current.setEditingId(1);
    });
    expect(result.current.editingId).toBe(1);
  });

  it('setIsAdding updates isAdding', () => {
    const { result } = renderHook(() => useTagManagerModal());
    act(() => {
      result.current.setIsAdding(true);
    });
    expect(result.current.isAdding).toBe(true);
  });

  it('resetState sets editingId to null and isAdding to false', () => {
    const { result } = renderHook(() => useTagManagerModal());
    act(() => {
      result.current.setEditingId(1);
      result.current.setIsAdding(true);
    });
    act(() => {
      result.current.resetState();
    });
    expect(result.current.editingId).toBeNull();
    expect(result.current.isAdding).toBe(false);
  });

  it('onDelete calls deleteTagWithConfirmation', async () => {
    mockDeleteTag.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTagManagerModal());
    await act(async () => {
      await result.current.onDelete(1);
    });
    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteTag).toHaveBeenCalledWith(1);
  });

  it('onSave calls saveTag for new tag (no editingId)', async () => {
    mockAddTag.mockResolvedValue({});
    const { result } = renderHook(() => useTagManagerModal());
    const data = { label: 'NewTag', color: '#aaa' };
    await act(async () => {
      await result.current.onSave(data);
    });
    expect(mockAddTag).toHaveBeenCalledWith(data);
  });

  it('onSave calls saveTag with editingId for existing tag', async () => {
    mockUpdateTag.mockResolvedValue({});
    const { result } = renderHook(() => useTagManagerModal());
    act(() => {
      result.current.setEditingId(1);
    });
    const data = { label: 'Work Updated', color: '#ff0000' };
    await act(async () => {
      await result.current.onSave(data);
    });
    expect(mockUpdateTag).toHaveBeenCalledWith(1, data);
  });
});
