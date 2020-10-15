/**
 * Returns a PeriodicWave object for a Pulse-Width Modulated (PWM) oscialltor.
 * @param {AudioContext} ctx
 * @param {Number} duty the duty cycle of the PWM waveform, as fraction of high time to low time.
 */
export default function createPWMWave(ctx, duty) {
    const coeffs = createPWMCoefficients(duty);
    const customWave = ctx.createPeriodicWave(coeffs.sin, coeffs.cos, { disableNormalization: true });
    return customWave;
}

// Based off the math in this doc:
// http://liraeletronica.weebly.com/uploads/4/9/3/5/4935509/spectral_analysis_of_a_pwm_signal.pdf
function createPWMCoefficients(duty) {
    const N = 32; // Number of Fourier coefficients to generate.
    var sin = new Float32Array(N);
    var cos = new Float32Array(N);
    // sin: a_n = (2/n) * (1/PI) * Sin(n * PI * duty)
    // cos: b_n is always zero.
    let a = 0;
    sin[0] = 0;
    cos[0] = 0;
    for (let i = 1; i < N; i++) {
        let n = i; + 1;
        sin[i] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
        cos[i] = 0;
    }
    return { cos, sin };
}