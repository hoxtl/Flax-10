/**
 * Unit tests for TimerContext provider and persistence helpers.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useTimerLogicMock = vi.fn();
let stateStore = [];
let stateIndex = 0;
const useContextMock = vi.fn();

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
  createContext: vi.fn(() => ({ Provider: 'MockTimerProvider' })),
  useContext: (...args) => useContextMock(...args),
  useState: (...args) => useStateMock(...args),
}));

vi.mock('../../components/Timer/hooks/useTimerLogic', () => ({
  useTimerLogic: (...args) => useTimerLogicMock(...args),
}));

const importModule = async () => {
  vi.resetModules();
  return import('../../context/TimerContext');
};

const createMockStorage = () => ({ setItem: vi.fn(), removeItem: vi.fn() });
const createBrokenStorage = () => ({
  setItem: vi.fn(() => {
    throw new Error('storage error');
  }),
  removeItem: vi.fn(() => {
    throw new Error('storage error');
  }),
});

const mountTimerProvider = async (sessionStorageMock) => {
  const mod = await importModule();
  resetState([null, null]);
  Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock, configurable: true });
  Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
  return { mod, tree: mod.TimerProvider({ children: 'child' }) };
};

describe('TimerContext (node)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    useTimerLogicMock.mockReturnValue({
      isActive: false,
      timeLeft: 1500,
      mode: 'work',
    });
  });

  it('throws outside provider and returns context when present', async () => {
    const mod = await importModule();

    useContextMock.mockReturnValueOnce(undefined);
    expect(() => mod.useTimerContext()).toThrow('useTimerContext must be used within TimerProvider');

    const provided = { isActive: true };
    useContextMock.mockReturnValueOnce(provided);
    expect(mod.useTimerContext()).toBe(provided);
  });

  it('persistTimerTask no-ops when window or storage is unavailable', async () => {
    const mod = await importModule();
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };

    mod.persistTimerTask(1, { title: 'x' }, { hasWindow: false, storage });
    mod.persistTimerTask(1, { title: 'x' }, { hasWindow: true, storage: null });

    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('persistTimerTask writes and clears keys through explicit storage', async () => {
    const mod = await importModule();
    const storage = createMockStorage();

    mod.persistTimerTask(7, { title: 'Task A', categoryColor: '#00ff00' }, { hasWindow: true, storage });

    expect(storage.setItem).toHaveBeenCalledWith('timerTaskId', '7');
    expect(storage.setItem).toHaveBeenCalledWith('timerTaskTitle', 'Task A');
    expect(storage.setItem).toHaveBeenCalledWith('timerTaskCategoryColor', '#00ff00');

    storage.setItem.mockClear();
    mod.persistTimerTask(8, {}, { hasWindow: true, storage });
    expect(storage.setItem).toHaveBeenCalledWith('timerTaskId', '8');
    expect(storage.setItem).not.toHaveBeenCalledWith('timerTaskTitle', expect.anything());
    expect(storage.setItem).not.toHaveBeenCalledWith('timerTaskCategoryColor', expect.anything());

    mod.persistTimerTask(null, null, { hasWindow: true, storage });
    expect(storage.removeItem).toHaveBeenCalledWith('timerTaskId');
    expect(storage.removeItem).toHaveBeenCalledWith('timerTaskTitle');
    expect(storage.removeItem).toHaveBeenCalledWith('timerTaskCategoryColor');
  });

  it('passes values from useTimerLogic', async () => {
    const { tree } = await mountTimerProvider(createMockStorage());

    expect(useTimerLogicMock).toHaveBeenCalledTimes(1);
    const [activeTaskIdArg, setActiveTaskIdArg, activeTaskMetaArg] = useTimerLogicMock.mock.calls[0];
    expect(activeTaskIdArg).toBeNull();
    expect(typeof setActiveTaskIdArg).toBe('function');
    expect(activeTaskMetaArg).toBeNull();

    expect(tree.props.value.isActive).toBe(false);
    expect(tree.props.value.timeLeft).toBe(1500);
    expect(tree.props.value.mode).toBe('work');
    expect(typeof tree.props.value.setActiveTaskId).toBe('function');
  });

  it('exposes timer values from useTimerLogic', async () => {
    const { tree } = await mountTimerProvider(createMockStorage());
    expect(tree.props.value.isActive).toBe(false);
    expect(tree.props.value.timeLeft).toBe(1500);
    expect(tree.props.value.mode).toBe('work');
  });

  it('persists task updates through sessionStorage', async () => {
    const { tree } = await mountTimerProvider(createMockStorage());
    tree.props.value.setActiveTaskId(42, { title: 'Essay', categoryColor: '#112233' });
    tree.props.value.setActiveTaskId(11, 'not-object');
    tree.props.value.setActiveTaskId(null);
    expect(stateStore[0]).toBeNull();
    expect(stateStore[1]).toBeNull();
    expect(globalThis.sessionStorage.setItem).toHaveBeenCalledWith('timerTaskId', '42');
    expect(globalThis.sessionStorage.setItem).toHaveBeenCalledWith('timerTaskTitle', 'Essay');
    expect(globalThis.sessionStorage.setItem).toHaveBeenCalledWith('timerTaskCategoryColor', '#112233');
    expect(globalThis.sessionStorage.removeItem).toHaveBeenCalledWith('timerTaskId');
    expect(globalThis.sessionStorage.removeItem).toHaveBeenCalledWith('timerTaskTitle');
    expect(globalThis.sessionStorage.removeItem).toHaveBeenCalledWith('timerTaskCategoryColor');
  });

  it('swallows persist errors when saving and clearing', async () => {
    const { tree } = await mountTimerProvider(createBrokenStorage());
    expect(() => tree.props.value.setActiveTaskId(1, { title: 'x' })).not.toThrow();
    expect(() => tree.props.value.setActiveTaskId(null)).not.toThrow();
  });
});
