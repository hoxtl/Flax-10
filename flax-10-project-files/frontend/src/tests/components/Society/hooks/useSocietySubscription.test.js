import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocietySubscription } from '../../../../components/Society/hooks/useSocietySubscription';

vi.mock('../../../../api/societyApi', () => ({
    toggleSubscription: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../../context/ConfirmContext', () => ({
    useConfirm: vi.fn(() => vi.fn(() => Promise.resolve(true))),
}));

import { toggleSubscription as apiToggle } from '../../../../api/societyApi';
import { useConfirm } from '../../../../context/ConfirmContext';

describe('useSocietySubscription', () => {
    const updateLocalSociety = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useConfirm.mockReturnValue(vi.fn(() => Promise.resolve(true)));
    });

    it('returns isSubscribed from society', () => {
        const { result } = renderHook(() =>
            useSocietySubscription(1, { is_subscribed: true }, updateLocalSociety)
        );
        expect(result.current.isSubscribed).toBe(true);
    });

    it('returns isSubscribed false when society not subscribed', () => {
        const { result } = renderHook(() =>
            useSocietySubscription(1, { is_subscribed: false }, updateLocalSociety)
        );
        expect(result.current.isSubscribed).toBe(false);
    });

    it('defaults isSubscribed to false when society is null', () => {
        const { result } = renderHook(() =>
            useSocietySubscription(1, null, updateLocalSociety)
        );
        expect(result.current.isSubscribed).toBe(false);
    });

    it('subscribe calls api and updateLocalSociety', async () => {
        const { result } = renderHook(() =>
            useSocietySubscription(1, { is_subscribed: false }, updateLocalSociety)
        );
        await act(async () => {
            await result.current.toggleSubscription();
        });
        expect(apiToggle).toHaveBeenCalledWith(1, true);
        expect(updateLocalSociety).toHaveBeenCalledWith({ is_subscribed: true });
    });

    it('confirmUnsubscribe when user confirms calls api and updateLocalSociety', async () => {
        const confirm = vi.fn(() => Promise.resolve(true));
        useConfirm.mockReturnValue(confirm);
        const { result } = renderHook(() =>
            useSocietySubscription(2, { is_subscribed: true, name: 'Chess Club' }, updateLocalSociety)
        );
        await act(async () => {
            await result.current.toggleSubscription();
        });
        expect(confirm).toHaveBeenCalledWith({
            title: 'Turn off notifications?',
            message: 'Are you sure you want to turn off notifications for Chess Club?',
        });
        expect(apiToggle).toHaveBeenCalledWith(2, false);
        expect(updateLocalSociety).toHaveBeenCalledWith({ is_subscribed: false });
    });

    it('confirmUnsubscribe when user cancels does not call api', async () => {
        const confirm = vi.fn(() => Promise.resolve(false));
        useConfirm.mockReturnValue(confirm);
        const { result } = renderHook(() =>
            useSocietySubscription(2, { is_subscribed: true, name: 'Chess' }, updateLocalSociety)
        );
        await act(async () => {
            await result.current.toggleSubscription();
        });
        expect(apiToggle).not.toHaveBeenCalled();
        expect(updateLocalSociety).not.toHaveBeenCalled();
    });
});
