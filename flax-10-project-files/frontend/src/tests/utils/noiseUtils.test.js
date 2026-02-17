import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NoiseGenerator } from '../../utils/noiseUtils';

describe('NoiseGenerator', () => {
    let noiseGenerator;
    let mockContext;
    let mockGain;
    let mockFilter;
    let mockNode;
    let mockDestination;

    beforeEach(() => {
        // Mock Web Audio API
        mockGain = {
            connect: vi.fn(),
            gain: { value: 1 }
        };
        mockFilter = {
            connect: vi.fn(),
            type: '',
            frequency: { value: 0 }
        };
        mockNode = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            onaudioprocess: null
        };
        mockDestination = {};

        mockContext = {
            createGain: vi.fn(() => mockGain),
            createBiquadFilter: vi.fn(() => mockFilter),
            createScriptProcessor: vi.fn(() => mockNode),
            destination: mockDestination,
            state: 'running',
            resume: vi.fn()
        };

        window.AudioContext = vi.fn(function () {
            return mockContext;
        });
        window.webkitAudioContext = window.AudioContext;

        noiseGenerator = new NoiseGenerator();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize AudioContext on first play', () => {
        noiseGenerator.play('white');
        expect(window.AudioContext).toHaveBeenCalled();
        expect(mockContext.createGain).toHaveBeenCalled();
        expect(mockContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('should configure logic for White Noise', () => {
        noiseGenerator.play('white');
        expect(mockFilter.type).toBe('lowpass');
        expect(mockFilter.frequency.value).toBe(1500);
    });

    it('should configure logic for Pink Noise', () => {
        noiseGenerator.play('pink');
        expect(mockFilter.type).toBe('lowpass');
        expect(mockFilter.frequency.value).toBe(2500);
    });

    it('should configure logic for Brown Noise', () => {
        noiseGenerator.play('brown');
        expect(mockFilter.type).toBe('lowpass');
        expect(mockFilter.frequency.value).toBe(400);
    });

    it('should set volume correctly', () => {
        noiseGenerator.init(); // Ensure gain node exists
        noiseGenerator.setVolume(0.8);
        expect(mockGain.gain.value).toBe(0.8);
    });

    it('should stop playing by disconnecting node', () => {
        noiseGenerator.play('white');
        noiseGenerator.stop();
        expect(mockNode.disconnect).toHaveBeenCalled();
        expect(noiseGenerator.node).toBeNull();
    });
});
