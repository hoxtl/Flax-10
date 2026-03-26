let audioContext = null;

function getAudioContext() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return audioContext;
}

export function playNotificationSound() {
    try {
        const ctx = getAudioContext();
        playChime(ctx, ctx.currentTime);
    } catch {}
}

function playChime(ctx, time) {
    playTone(ctx, 830, time, 0.1);
    playTone(ctx, 1050, time + 0.1, 0.15);
}

function playTone(ctx, frequency, startTime, duration) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}
