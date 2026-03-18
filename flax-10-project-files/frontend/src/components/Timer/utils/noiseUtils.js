
const BUFFER_SIZE = 4096;

export class NoiseGenerator {
    constructor() {
        this.ctx = null;
        this.nodes = [];
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
        node.onaudioprocess = (e) => processFn(e.outputBuffer.getChannelData(0), BUFFER_SIZE);
        return node;
    }

    createFilter(type, freq, q = 0.7) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        filter.Q.value = q;
        return filter;
    }

    connectChain(chain) {
        for (let i = 0; i < chain.length - 1; i++) {
            chain[i].connect(chain[i + 1]);
        }
        chain[chain.length - 1].connect(this.masterGain);
        this.nodes.push(...chain);
    }

    // Gentle rain — layered pink noise with soft high-cut and slow amplitude swell
    playRain() {
        const state = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0, phase: 0 };
        const src = this.createNoiseSource((out, size) => {
            let { b0, b1, b2, b3, b4, b5, b6, phase } = state;
            for (let i = 0; i < size; i++) {
                const w = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + w * 0.0555179;
                b1 = 0.99332 * b1 + w * 0.0750759;
                b2 = 0.96900 * b2 + w * 0.1538520;
                b3 = 0.86650 * b3 + w * 0.3104856;
                b4 = 0.55000 * b4 + w * 0.5329522;
                b5 = -0.7616 * b5 - w * 0.0168980;
                const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.08;
                b6 = w * 0.115926;
                // slow amplitude swell to mimic rain intensity
                phase += 0.000008;
                const swell = 0.7 + 0.3 * Math.sin(phase * Math.PI * 2);
                out[i] = pink * swell;
            }
            Object.assign(state, { b0, b1, b2, b3, b4, b5, b6, phase });
        });
        const lp1 = this.createFilter('lowpass', 1200, 0.5);
        const lp2 = this.createFilter('lowpass', 800, 0.3);
        this.connectChain([src, lp1, lp2]);
    }

    // Coffee shop — warm brown noise with gentle rumble
    playCafe() {
        const state = { lastOut: 0 };
        const src = this.createNoiseSource((out, size) => {
            let { lastOut } = state;
            for (let i = 0; i < size; i++) {
                const w = Math.random() * 2 - 1;
                lastOut = (lastOut + 0.02 * w) / 1.02;
                out[i] = lastOut * 2.8;
            }
            state.lastOut = lastOut;
        });
        const lp = this.createFilter('lowpass', 350, 0.4);
        const hp = this.createFilter('highpass', 40, 0.3);
        this.connectChain([src, lp, hp]);
    }

    // Gentle breeze — very soft filtered white noise with slow sweeping filter
    playWind() {
        const state = { phase: 0 };
        const src = this.createNoiseSource((out, size) => {
            let { phase } = state;
            for (let i = 0; i < size; i++) {
                const r1 = Math.random();
                const r2 = Math.random();
                const gaussian = Math.sqrt(-2.0 * Math.log(r1 || 0.001)) * Math.cos(2.0 * Math.PI * r2);
                // slow volume sweep to sound like gusts
                phase += 0.000005;
                const gust = 0.6 + 0.4 * Math.sin(phase * Math.PI * 2);
                out[i] = gaussian * 0.08 * gust;
            }
            state.phase = phase;
        });
        const lp = this.createFilter('lowpass', 600, 0.3);
        const hp = this.createFilter('highpass', 80, 0.5);
        this.connectChain([src, lp, hp]);
    }

    play(type) {
        this.init();
        this.stop();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.masterGain.gain.value = this.volume;

        if (type === 'pink') this.playRain();
        else if (type === 'brown') this.playCafe();
        else if (type === 'white') this.playWind();
    }

    stop() {
        for (const node of this.nodes) {
            try { node.disconnect(); } catch {}
        }
        this.nodes = [];
    }

    setVolume(value) {
        this.volume = value;
        if (this.masterGain) this.masterGain.gain.value = value;
    }
}

export const noiseGenerator = new NoiseGenerator();
