import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveTag, deleteTagWithConfirmation } from '../../../components/Tags/tagManager/tagManagerActions';

const tags = [
  { id: 1, label: 'Work', color: '#ff0000' },
  { id: 2, label: 'Personal', color: '#00ff00' },
];

describe('saveTag', () => {
  let addTag, updateTag, confirm, resetState;

  beforeEach(() => {
    addTag = vi.fn().mockResolvedValue({});
    updateTag = vi.fn().mockResolvedValue({});
    confirm = vi.fn().mockResolvedValue(true);
    resetState = vi.fn();
  });

  it('calls addTag when no editingId and no duplicate', async () => {
    const data = { label: 'NewTag', color: '#000' };
    const result = await saveTag({ addTag, confirm, data, editingId: null, resetState, tags, updateTag });
    expect(addTag).toHaveBeenCalledWith(data);
    expect(resetState).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('calls updateTag when editingId is provided and no conflict', async () => {
    const data = { label: 'Work Updated', color: '#ff0000' };
    const result = await saveTag({ addTag, confirm, data, editingId: 1, resetState, tags, updateTag });
    expect(updateTag).toHaveBeenCalledWith(1, data);
    expect(result).toBe(true);
  });

  it('handles duplicate by replacing when user confirms', async () => {
    const data = { label: 'Personal', color: '#aaa' };
    const result = await saveTag({ addTag, confirm, data, editingId: null, resetState, tags, updateTag });
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Duplicate Tag Name' }));
    expect(updateTag).toHaveBeenCalledWith(2, data);
    expect(result).toBe(true);
  });

  it('returns false when user cancels duplicate replace', async () => {
    confirm = vi.fn().mockResolvedValue(false);
    const data = { label: 'Personal', color: '#aaa' };
    const result = await saveTag({ addTag, confirm, data, editingId: null, resetState, tags, updateTag });
    expect(updateTag).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('does not treat same tag as duplicate when editingId matches', async () => {
    // editingId=2, duplicate.id=2, so it should NOT call handleDuplicateTag
    const data = { label: 'Personal', color: '#00ff00' };
    const result = await saveTag({ addTag, confirm, data, editingId: 2, resetState, tags, updateTag });
    expect(confirm).not.toHaveBeenCalled();
    expect(updateTag).toHaveBeenCalledWith(2, data);
    expect(result).toBe(true);
  });
});

describe('deleteTagWithConfirmation', () => {
  let deleteTag, confirm, toast;

  beforeEach(() => {
    deleteTag = vi.fn().mockResolvedValue(undefined);
    confirm = vi.fn().mockResolvedValue(true);
    toast = vi.fn();
  });

  it('calls deleteTag and shows success toast when confirmed', async () => {
    const result = await deleteTagWithConfirmation({ confirm, deleteTag, id: 1, tags, toast });
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Delete Tag' }));
    expect(deleteTag).toHaveBeenCalledWith(1);
    expect(toast).toHaveBeenCalledWith('"Work" deleted.');
    expect(result).toBe(true);
  });

  it('returns false without deleting when user cancels confirmation', async () => {
    confirm = vi.fn().mockResolvedValue(false);
    const result = await deleteTagWithConfirmation({ confirm, deleteTag, id: 1, tags, toast });
    expect(deleteTag).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('shows error toast when deleteTag returns false', async () => {
    deleteTag = vi.fn().mockResolvedValue(false);
    const result = await deleteTagWithConfirmation({ confirm, deleteTag, id: 1, tags, toast });
    expect(toast).toHaveBeenCalledWith("Couldn't delete tag.", { variant: 'error' });
    expect(result).toBe(false);
  });

  it('uses fallback label "Tag" when tag is not found', async () => {
    const result = await deleteTagWithConfirmation({ confirm, deleteTag, id: 999, tags, toast });
    expect(toast).toHaveBeenCalledWith('"Tag" deleted.');
    expect(result).toBe(true);
  });

  it('works without toast argument', async () => {
    await expect(
      deleteTagWithConfirmation({ confirm, deleteTag, id: 1, tags, toast: undefined })
    ).resolves.toBe(true);
  });

  it('calls showDeleteError without crashing when toast is undefined and delete fails', async () => {
    deleteTag = vi.fn().mockResolvedValue(false);
    const result = await deleteTagWithConfirmation({ confirm, deleteTag, id: 1, tags, toast: undefined });
    expect(result).toBe(false);
  });
});
