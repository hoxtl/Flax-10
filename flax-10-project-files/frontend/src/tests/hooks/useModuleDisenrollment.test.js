import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModuleDisenrollment } from '../../components/Modules/hooks/useModuleDisenrollment';

const addNotificationMock = vi.hoisted(() => vi.fn());
const disenrolByModuleIdMock = vi.hoisted(() => vi.fn());

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ addNotification: addNotificationMock }),
}));

vi.mock('../../api/moduleApi', () => ({
  disenrolByModuleId: (...args) => disenrolByModuleIdMock(...args),
}));

describe('useModuleDisenrollment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disenrolls and notifies success', async () => {
    disenrolByModuleIdMock.mockResolvedValueOnce({});
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useModuleDisenrollment());

    await result.current.disenrollFromModule(42, onSuccess);

    expect(disenrolByModuleIdMock).toHaveBeenCalledWith(42);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(addNotificationMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'Successfully left the module!' }));
  });

  it('notifies error on failure', async () => {
    disenrolByModuleIdMock.mockRejectedValueOnce(new Error('failed'));
    const { result } = renderHook(() => useModuleDisenrollment());

    await result.current.disenrollFromModule(42);

    expect(addNotificationMock).toHaveBeenLastCalledWith(expect.objectContaining({ message: 'failed' }));
  });

  it('handles success without onSuccess callback', async () => {
    disenrolByModuleIdMock.mockResolvedValueOnce({});
    const { result } = renderHook(() => useModuleDisenrollment());
    await result.current.disenrollFromModule(8);
    expect(disenrolByModuleIdMock).toHaveBeenCalledWith(8);
  });
});
