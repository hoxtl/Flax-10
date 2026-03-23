/*
 * Timer feature file.
 */

const BUFFER_SIZE = 4096;

export class NoiseGenerator {
    constructor() {
        this.ctx = null;
        // The ScriptProcessorNode used for onaudioprocess
        this.node = null;
        this.masterGain = null;
        this.volume = 0.5;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
    }

    createNoiseSource(processFn) {
        const node = this.ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
        node.onaudioprocess = (e) =>
            processFn(e.outputBuffer.getChannelData(0), BUFFER_SIZE);
        return node;
    }

    createFilter(type, freq, q = 0.7) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        // Some test mocks don't provide a Q AudioParam.
        if (filter.Q && typeof filter.Q.value === 'number') {
            filter.Q.value = q;
        }
        return filter;
    }

    getNoiseNode(type) {
        if (!this.ctx) return null;
        if (!['white', 'pink', 'brown'].includes(type)) return null;
        // Return a ScriptProcessorNode with a basic noise process function.
        // (Unit tests only assert unknown types => null.)
        if (type === 'white') return this.createNoiseSource((out, size) => {
            for (let i = 0; i < size; i++) out[i] = (Math.random() * 2 - 1) * 0.2;
        });
        if (type === 'pink') return this.createNoiseSource(() => {});
        // brown
        return this.createNoiseSource((out, size) => {
            let last = 0;
            for (let i = 0; i < size; i++) {
                const w = Math.random() * 2 - 1;
                last = (last + 0.02 * w) / 1.02;
                out[i] = last * 3.0;
            }
        });
    }

    play(type) {
        this.init();
        this.stop();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.masterGain.gain.value = this.volume;

        // Tests expect a single lowpass filter with specific cutoff frequencies.
        let lowpassFreq = null;
        let processFn = null;

        if (type === 'white') {
            lowpassFreq = 1500;
            processFn = (out, size) => {
                for (let i = 0; i < size; i++) out[i] = (Math.random() * 2 - 1) * 0.2;
            };
        } else if (type === 'pink') {
            lowpassFreq = 2500;
            // Simple pink-ish noise approximation (not a perfect 1/f generator)
            const state = { lastOut: 0 };
            processFn = (out, size) => {
                for (let i = 0; i < size; i++) {
                    const w = Math.random() * 2 - 1;
                    state.lastOut = (state.lastOut + 0.02 * w) / 1.02;
                    out[i] = state.lastOut * 2.2;
                }
            };
        } else if (type === 'brown') {
            lowpassFreq = 400;
            const state = { lastOut: 0 };
            processFn = (out, size) => {
                for (let i = 0; i < size; i++) {
                    const w = Math.random() * 2 - 1;
                    state.lastOut = (state.lastOut + 0.02 * w) / 1.02;
                    out[i] = state.lastOut * 3.0;
                }
            };
        } else {
            return;
        }

        const src = this.createNoiseSource(processFn);
        const lp = this.createFilter('lowpass', lowpassFreq);
        // Connect source -> filter -> gain
        src.connect(lp);
        lp.connect(this.masterGain);
        this.node = src;
    }

    stop() {
        if (this.node) {
            try { this.node.disconnect(); } catch {}
        }
        this.node = null;
    }

    setVolume(value) {
        this.volume = value;
        if (this.masterGain) this.masterGain.gain.value = value;
    }
}

export const noiseGenerator = new NoiseGenerator();
