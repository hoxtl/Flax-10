import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('notificationSound', () => {
    const createMocks = () => {
        const mockOscillator = {
            connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
            frequency: { value: 0 }, type: ''
        };
        const mockGain = {
            connect: vi.fn(),
            gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
        };
        const mockContext = {
            createOscillator: vi.fn(() => mockOscillator),
            createGain: vi.fn(() => mockGain),
            destination: {}, currentTime: 0
        };
        return { mockOscillator, mockGain, mockContext };
    };

    beforeEach(() => { vi.resetModules(); });
    afterEach(() => { delete global.AudioContext; delete global.webkitAudioContext; });

    it('creates AudioContext and plays chime tones', async () => {
        const { mockContext, mockOscillator } = createMocks();
        global.AudioContext = vi.fn(function() { return mockContext; });

        const { playNotificationSound } = await import('../../../components/notifications/utils/notificationSound');
        playNotificationSound();

        expect(global.AudioContext).toHaveBeenCalledTimes(1);
        expect(mockContext.createOscillator).toHaveBeenCalledTimes(2);
        expect(mockOscillator.start).toHaveBeenCalledTimes(2);
        expect(mockOscillator.stop).toHaveBeenCalledTimes(2);
    });

    it('reuses existing AudioContext on subsequent calls', async () => {
        const { mockContext } = createMocks();
        global.AudioContext = vi.fn(function() { return mockContext; });

        const { playNotificationSound } = await import('../../../components/notifications/utils/notificationSound');
        playNotificationSound();
        playNotificationSound();
        expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });

    it('handles AudioContext creation errors gracefully', async () => {
        global.AudioContext = vi.fn(function() { throw new Error('Not supported'); });

        const { playNotificationSound } = await import('../../../components/notifications/utils/notificationSound');
        expect(() => playNotificationSound()).not.toThrow();
    });

    it('connects oscillator to gain and gain to destination', async () => {
        const { mockContext, mockOscillator, mockGain } = createMocks();
        global.AudioContext = vi.fn(function() { return mockContext; });

        const { playNotificationSound } = await import('../../../components/notifications/utils/notificationSound');
        playNotificationSound();

        expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
        expect(mockGain.connect).toHaveBeenCalledWith(mockContext.destination);
    });

    it('uses webkitAudioContext as fallback', async () => {
        const { mockContext } = createMocks();
        global.webkitAudioContext = vi.fn(function() { return mockContext; });
        delete global.AudioContext;

        const { playNotificationSound } = await import('../../../components/notifications/utils/notificationSound');
        playNotificationSound();
        expect(global.webkitAudioContext).toHaveBeenCalled();
    });
});
