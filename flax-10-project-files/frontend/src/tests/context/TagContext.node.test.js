import { beforeEach, describe, expect, it, vi } from 'vitest';

const getTagsMock = vi.fn();
const createTagMock = vi.fn();
const deleteTagMock = vi.fn();
const updateTagMock = vi.fn();

let contextValue;
let stateStore = [];
let stateIndex = 0;
const useContextMock = vi.fn();
const useEffectMock = vi.fn();

const resetState = (preset = []) => {
  stateStore = [...preset];
  stateIndex = 0;
};

const useStateMock = vi.fn((initial) => {
  const currentIndex = stateIndex;
  if (!(currentIndex in stateStore)) {
    stateStore[currentIndex] = typeof initial === 'function' ? initial() : initial;
  }

  const setter = (next) => {
    const prev = stateStore[currentIndex];
    stateStore[currentIndex] = typeof next === 'function' ? next(prev) : next;
  };

  stateIndex += 1;
  return [stateStore[currentIndex], setter];
});

vi.mock('react', () => ({
  createContext: vi.fn(() => {
    contextValue = { Provider: 'MockTagProvider' };
    return contextValue;
  }),
  useContext: (...args) => useContextMock(...args),
  useState: (...args) => useStateMock(...args),
  useEffect: (...args) => useEffectMock(...args),
}));

vi.mock('../../api/tags/tagApi', () => ({
  getTags: (...args) => getTagsMock(...args),
  createTag: (...args) => createTagMock(...args),
  deleteTag: (...args) => deleteTagMock(...args),
  updateTag: (...args) => updateTagMock(...args),
}));

const importModule = async () => {
  vi.resetModules();
  return import('../../context/TagContext');
};

const getValueFromProvider = (mod, presetStates = [[], true], runEffect = false) => {
  resetState(presetStates);
  stateIndex = 0;
  useEffectMock.mockImplementation((cb) => {
    if (runEffect) cb();
  });

  const tree = mod.TagProvider({ children: 'x' });
  return tree.props.value;
};

describe('TagContext (node)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    useEffectMock.mockImplementation(() => {});
    getTagsMock.mockResolvedValue([
      { id: 1, name: 'Class', color: '#111111' },
      { id: 2, name: 'Other', color: '#222222' },
    ]);
  });

  it('returns safe fallbacks when used outside provider', async () => {
    const mod = await importModule();
    useContextMock.mockReturnValueOnce(null);

    const result = mod.useTags();

    expect(result.tags).toEqual([]);
    expect(result.loading).toBe(false);
    expect(result.getTag()).toBeNull();
    expect(() => result.addTag({ label: 'x', color: '#000000' })).not.toThrow();
    expect(() => result.updateTag(1, { label: 'x', color: '#000000' })).not.toThrow();
    expect(() => result.deleteTag(1)).not.toThrow();
    expect(() => result.refreshTags()).not.toThrow();
  });

  it('returns context object when inside provider', async () => {
    const mod = await importModule();
    const provided = { tags: [{ id: 9 }], loading: true };
    useContextMock.mockReturnValueOnce(provided);

    expect(mod.useTags()).toBe(provided);
  });

  it('exposes getter behaviour for id and name variants', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(
      mod,
      [
        [
          { id: 1, label: 'Class', icon: '📚', color: '#111111' },
          { id: 2, label: 'Other', icon: '⭐', color: '#222222' },
        ],
        false,
      ],
      false
    );

    expect(value.getTag(1).label).toBe('Class');
    expect(value.getTag('1').label).toBe('Class');
    expect(value.getTag(undefined).label).toBe('None');
    expect(value.getTag(null).label).toBe('None');
    expect(value.getTag(999).label).toBe('Other');

    expect(value.getTagByName('class').label).toBe('Class');
    expect(value.getTagByName('missing').label).toBe('Other');
    expect(value.getTagByName('').label).toBe('None');
  });

  it('falls back to None when no "Other" tag exists', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(
      mod,
      [[{ id: 1, label: 'Class', icon: '📚', color: '#111111' }], false],
      false
    );

    expect(value.getTag(999).label).toBe('None');
    expect(value.getTagByName('missing').label).toBe('None');
  });

  it('loads initial tags and toggles loading off on success', async () => {
    const mod = await importModule();
    getValueFromProvider(mod, [[], true], true);

    await Promise.resolve();
    await Promise.resolve();

    expect(getTagsMock).toHaveBeenCalledTimes(1);
    expect(stateStore[0]).toEqual([
      { id: 1, label: 'Class', icon: '🏷️', color: '#111111' },
      { id: 2, label: 'Other', icon: '⭐', color: '#222222' },
    ]);
    expect(stateStore[1]).toBe(false);
  });

  it('logs initial-load errors and still toggles loading off', async () => {
    const mod = await importModule();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagsMock.mockRejectedValueOnce(new Error('load failed'));

    getValueFromProvider(mod, [[], true], true);
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch tags:', expect.any(Error));
    expect(stateStore[1]).toBe(false);
    consoleSpy.mockRestore();
  });

  it('refreshTags updates tags and maps default icon', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(mod, [[], false], false);
    getTagsMock.mockResolvedValueOnce([{ id: 10, name: 'Refreshed', color: '#abcdef' }]);

    await value.refreshTags();

    expect(stateStore[0]).toEqual([
      { id: 10, label: 'Refreshed', icon: '🏷️', color: '#abcdef' },
    ]);
  });

  it('refreshTags logs error on failure', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(mod, [[], false], false);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagsMock.mockRejectedValueOnce(new Error('refresh failed'));

    await value.refreshTags();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch tags:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('addTag creates and appends mapped tag data', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(mod, [[], false], false);
    createTagMock.mockResolvedValueOnce({ id: 3, name: 'Other', color: '#123456' });

    await value.addTag({ label: 'Other', color: '#123456' });

    expect(createTagMock).toHaveBeenCalledWith({
      name: 'Other',
      color: '#123456',
      icon: '🏷️',
    });
    expect(stateStore[0]).toEqual([
      { id: 3, label: 'Other', icon: '⭐', color: '#123456' },
    ]);
  });

  it('addTag logs errors', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(mod, [[], false], false);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createTagMock.mockRejectedValueOnce(new Error('create failed'));

    await value.addTag({ label: 'x', color: '#000000' });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to create tag:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('deleteTag removes existing item', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(
      mod,
      [[{ id: 5, label: 'ToDelete', icon: '🏷️', color: '#eee' }], false],
      false
    );

    await value.deleteTag(5);

    expect(deleteTagMock).toHaveBeenCalledWith(5);
    expect(stateStore[0]).toEqual([]);
  });

  it('deleteTag logs errors', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(mod, [[], false], false);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    deleteTagMock.mockRejectedValueOnce(new Error('delete failed'));

    await value.deleteTag(5);

    expect(consoleSpy).toHaveBeenCalledWith('Failed to delete tag:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('updateTag updates matching tag and maps icon', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(
      mod,
      [[
        { id: 5, label: 'Before', icon: '🏷️', color: '#111111' },
        { id: 8, label: 'Keep', icon: '📌', color: '#222222' },
      ], false],
      false
    );

    updateTagMock.mockResolvedValueOnce({ id: 5, name: 'After', color: '#ffffff', icon: '✅' });

    await value.updateTag(5, { label: 'After', color: '#ffffff', icon: '✅' });

    expect(updateTagMock).toHaveBeenCalledWith(5, {
      name: 'After',
      color: '#ffffff',
      icon: '✅',
    });
    expect(stateStore[0]).toEqual([
      { id: 5, label: 'After', icon: '✅', color: '#ffffff' },
      { id: 8, label: 'Keep', icon: '📌', color: '#222222' },
    ]);
  });

  it('updateTag logs errors', async () => {
    const mod = await importModule();
    const value = getValueFromProvider(mod, [[], false], false);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    updateTagMock.mockRejectedValueOnce(new Error('update failed'));

    await value.updateTag(7, { label: 'x', color: '#000000', icon: 'x' });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to update tag:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
