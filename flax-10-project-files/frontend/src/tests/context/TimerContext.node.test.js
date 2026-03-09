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
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };

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

  it('TimerProvider passes values from useTimerLogic and persists task changes', async () => {
    const mod = await importModule();

    const sessionStorageMock = {
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: sessionStorageMock,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: {},
      configurable: true,
    });

    resetState([null, null]);
    stateIndex = 0;

    const tree = mod.TimerProvider({ children: 'child' });

    expect(useTimerLogicMock).toHaveBeenCalledTimes(1);
    const [activeTaskIdArg, setActiveTaskIdArg, activeTaskMetaArg] = useTimerLogicMock.mock.calls[0];
    expect(activeTaskIdArg).toBeNull();
    expect(typeof setActiveTaskIdArg).toBe('function');
    expect(activeTaskMetaArg).toBeNull();

    expect(tree.props.value.isActive).toBe(false);
    expect(tree.props.value.timeLeft).toBe(1500);
    expect(tree.props.value.mode).toBe('work');
    expect(typeof tree.props.value.setActiveTaskId).toBe('function');

    tree.props.value.setActiveTaskId(42, { title: 'Essay', categoryColor: '#112233' });
    expect(stateStore[0]).toBe(42);
    expect(stateStore[1]).toEqual({ title: 'Essay', categoryColor: '#112233' });
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('timerTaskId', '42');
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('timerTaskTitle', 'Essay');
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('timerTaskCategoryColor', '#112233');

    tree.props.value.setActiveTaskId(11, 'not-object');
    expect(stateStore[0]).toBe(11);
    expect(stateStore[1]).toBeNull();

    tree.props.value.setActiveTaskId(null);
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('timerTaskId');
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('timerTaskTitle');
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('timerTaskCategoryColor');
  });

  it('TimerProvider swallows persist errors', async () => {
    const mod = await importModule();

    const brokenStorage = {
      setItem: vi.fn(() => {
        throw new Error('storage error');
      }),
      removeItem: vi.fn(() => {
        throw new Error('storage error');
      }),
    };

    Object.defineProperty(globalThis, 'sessionStorage', {
      value: brokenStorage,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: {},
      configurable: true,
    });

    resetState([null, null]);
    stateIndex = 0;

    const tree = mod.TimerProvider({ children: 'child' });

    expect(() => tree.props.value.setActiveTaskId(1, { title: 'x' })).not.toThrow();
    expect(() => tree.props.value.setActiveTaskId(null)).not.toThrow();
  });
});
