
export class NoiseGenerator {
    constructor() {
        this.ctx = null;
        this.node = null;
        this.gain = null;
        this.filter = null;
        this.volume = 0.5;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.gain = this.ctx.createGain();
        this.filter = this.ctx.createBiquadFilter();
        this.filter.connect(this.gain);
        this.gain.connect(this.ctx.destination);
    }

    // --- Noise Processors ---

    processWhite(output, size) {
        for (let i = 0; i < size; i++) {
            const r1 = Math.random();
            const r2 = Math.random();
            const gaussian = Math.sqrt(-2.0 * Math.log(r1)) * Math.cos(2.0 * Math.PI * r2);
            output[i] = gaussian * 0.15; // Gaussian White Noise
        }
    }

    processPink(output, size, state) {
        let { b0, b1, b2, b3, b4, b5, b6 } = state;
        for (let i = 0; i < size; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
        Object.assign(state, { b0, b1, b2, b3, b4, b5, b6 });
    }

    processBrown(output, size, state) {
        let { lastOut } = state;
        for (let i = 0; i < size; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }
        state.lastOut = lastOut;
    }

    // --- Creators ---

    createWhiteNoise() {
        const node = this.ctx.createScriptProcessor(4096, 1, 1);
        node.onaudioprocess = (e) => this.processWhite(e.outputBuffer.getChannelData(0), 4096);
        return node;
    }

    createPinkNoise() {
        const node = this.ctx.createScriptProcessor(4096, 1, 1);
        const state = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0 };
        node.onaudioprocess = (e) => this.processPink(e.outputBuffer.getChannelData(0), 4096, state);
        return node;
    }

    createBrownNoise() {
        const node = this.ctx.createScriptProcessor(4096, 1, 1);
        const state = { lastOut: 0 };
        node.onaudioprocess = (e) => this.processBrown(e.outputBuffer.getChannelData(0), 4096, state);
        return node;
    }

    // --- Control ---

    getNoiseNode(type) {
        if (type === 'white') return this.createWhiteNoise();
        if (type === 'pink') return this.createPinkNoise();
        if (type === 'brown') return this.createBrownNoise();
        return null;
    }

    configureFilter(type) {
        if (!this.filter) return;
        this.filter.type = 'lowpass';
        if (type === 'white') this.filter.frequency.value = 1500;
        else if (type === 'pink') this.filter.frequency.value = 2500;
        else this.filter.frequency.value = 400;
    }

    setupNode(type) {
        this.node = this.getNoiseNode(type);
        if (this.node) this.node.connect(this.filter);
        if (this.gain) this.gain.gain.value = this.volume;
    }

    play(type) {
        this.init();
        this.stop();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        this.configureFilter(type);
        this.setupNode(type);
    }

    stop() {
        if (this.node) {
            this.node.disconnect();
            this.node = null;
        }
    }

    setVolume(value) {
        this.volume = value;
        if (this.gain) this.gain.gain.value = value;
    }
}

export const noiseGenerator = new NoiseGenerator();
