import { describe, it, expect, vi, afterEach } from 'vitest';
import { playCompletionChime } from '../../lib/sounds';

describe('playCompletionChime', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('calls Audio constructor with a URL string', () => {
        const play = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('Audio', vi.fn(() => ({ volume: 0, play })));
        playCompletionChime();
        expect(Audio).toHaveBeenCalledWith(expect.any(String));
    });

    it('does not throw when Audio constructor throws', () => {
        vi.stubGlobal('Audio', vi.fn(() => { throw new Error('no audio'); }));
        expect(() => playCompletionChime()).not.toThrow();
    });

    it('does not throw if play() fails synchronously', () => {
        const play = vi.fn(() => { throw new Error('blocked'); });
        vi.stubGlobal('Audio', vi.fn(() => ({ volume: 0, play })));
        expect(() => playCompletionChime()).not.toThrow();
    });

    it('does not throw when play() returns a rejected promise', () => {
        const play = vi.fn().mockRejectedValue(new Error('play blocked'));
        vi.stubGlobal('Audio', vi.fn(() => ({ volume: 0, play })));
        expect(() => playCompletionChime()).not.toThrow();
    });

    it('sets explicit volume and tolerates missing catchable play return', () => {
        const play = vi.fn(() => undefined);
        const audioObj = { volume: 0, play };
        vi.stubGlobal('Audio', vi.fn(function AudioMock() { return audioObj; }));
        expect(() => playCompletionChime(0.8)).not.toThrow();
        expect(audioObj.volume).toBe(0.8);
    });
});
