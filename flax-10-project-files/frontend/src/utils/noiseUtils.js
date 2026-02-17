
export class NoiseGenerator {
    constructor() {
        this.ctx = null;
        this.node = null;
        this.gain = null;
        this.type = 'white';
        this.volume = 0.5;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.gain = this.ctx.createGain();
            this.gain.connect(this.ctx.destination);
        }
    }

    makeNoise(type) {
        const bufferSize = 4096;
        const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                if (type === 'white') {
                    output[i] = Math.random() * 2 - 1;
                } else if (type === 'pink') {
                    // Pink noise approximation
                    let b0, b1, b2, b3, b4, b5, b6;
                    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    output[i] *= 0.11; // (roughly) compensate for gain
                    b6 = white * 0.115926;
                } else if (type === 'brown') {
                    // Brown noise
                    let lastOut = 0;
                    const white = Math.random() * 2 - 1;
                    output[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = output[i];
                    output[i] *= 3.5; // (roughly) compensate for gain
                }
            }
        };
        return node;
    }

    // Better Brown Noise Implementation
    createBrownNoise() {
        const bufferSize = 4096;
        let lastOut = 0;
        const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5;
            }
        };
        return node;

    }

    // Better Pink Noise Implementation
    createPinkNoise() {
        const bufferSize = 4096;
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11;
                b6 = white * 0.115926;
            }
        };
        return node;
    }


    play(type) {
        this.init();
        if (this.node) {
            this.node.disconnect();
        }

        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.type = type;

        // Simple white noise
        if (type === 'white') {
            const bufferSize = 4096;
            const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
            node.onaudioprocess = (e) => {
                const output = e.outputBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
            };
            this.node = node;
        } else if (type === 'pink') {
            this.node = this.createPinkNoise();
        } else if (type === 'brown') {
            this.node = this.createBrownNoise();
        }

        this.node.connect(this.gain);
        this.gain.gain.value = this.volume;
    }

    stop() {
        if (this.node) {
            this.node.disconnect();
            this.node = null;
        }
        if (this.ctx && this.ctx.state === 'running') {
            //  this.ctx.suspend(); 
        }
    }

    setVolume(value) {
        this.volume = value;
        if (this.gain) {
            this.gain.gain.value = value;
        }
    }
}

export const noiseGenerator = new NoiseGenerator();
