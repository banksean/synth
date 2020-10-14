/**
 * Returns a PeriodicWave object for a Pulse-Width Modulated (PWM) oscialltor.
 * @param {AudioContext} ctx
 * @param {Number} duty the duty cycle of the PWM waveform, as fraction of high time to low time.
 */
export default function createPWMWave(ctx, duty) {
    const coeffs = createPWMCoefficients(duty);
    const customWave = ctx.createPeriodicWave(coeffs.sin, coeffs.cos, { disableNormalization: false });
    return customWave;
}

function createPWMCoefficients(duty) {
    const N = 64; // Number of Fourier coefficients to generate.
    var sin = new Float32Array(N);
    var cos = new Float32Array(N);
    // sin: a_n = (2/n) * (1/PI) * Sin(n * PI * duty)
    // cos: b_n is always zero.
    for (let i = 0; i < N; i++) {
        let n = i + 1;
        sin[i] = 2 * Math.sin(n * Math.PI * duty) / (n * Math.PI);
        cos[i] = 0;
    }
    return { sin, cos }
}