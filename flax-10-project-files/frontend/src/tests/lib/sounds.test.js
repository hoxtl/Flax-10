import { describe, it, expect, vi, afterEach } from 'vitest';
import { playCompletionChime } from '../../lib/sounds';

describe('playCompletionChime', () => {
    function stubAudio(implementation) {
        const AudioMock = vi.fn(function AudioMock(...args) {
            return implementation(...args);
        });
        vi.stubGlobal('Audio', AudioMock);
        return AudioMock;
    }

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('calls Audio constructor with a URL string', () => {
        const play = vi.fn().mockResolvedValue(undefined);
        stubAudio(() => ({ volume: 0, play }));
        playCompletionChime();
        expect(Audio).toHaveBeenCalledWith(expect.any(String));
    });

    it('does not throw when Audio constructor throws', () => {
        stubAudio(() => { throw new Error('no audio'); });
        expect(() => playCompletionChime()).not.toThrow();
    });

    it('does not throw if play() fails synchronously', () => {
        const play = vi.fn(() => { throw new Error('blocked'); });
        stubAudio(() => ({ volume: 0, play }));
        expect(() => playCompletionChime()).not.toThrow();
    });

    it('does not throw when play() returns a rejected promise', () => {
        const play = vi.fn().mockRejectedValue(new Error('play blocked'));
        stubAudio(() => ({ volume: 0, play }));
        expect(() => playCompletionChime()).not.toThrow();
    });

    it('swallows the rejected play promise through the catch handler', () => {
        const catchHandler = vi.fn((handler) => {
            handler();
            return undefined;
        });
        const play = vi.fn(() => ({ catch: catchHandler }));
        stubAudio(() => ({ volume: 0, play }));
        playCompletionChime();
        expect(play).toHaveBeenCalledTimes(1);
        expect(catchHandler).toHaveBeenCalledTimes(1);
    });

    it('sets explicit volume and tolerates missing catchable play return', () => {
        const play = vi.fn(() => undefined);
        const audioObj = { volume: 0, play };
        stubAudio(() => audioObj);
        expect(() => playCompletionChime(0.8)).not.toThrow();
        expect(audioObj.volume).toBe(0.8);
    });
});
