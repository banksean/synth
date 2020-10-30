/**
 * Returns a PeriodicWave object for a Pulse-Width Modulated (PWM) oscialltor.
 * @param {AudioContext} ctx
 * @param {Number} duty the duty cycle of the PWM waveform, as fraction of high time to low time.
 */
export default function createPWMWave(ctx, duty, terms) {
    const coeffs = createPWMCoefficients(duty, terms);
    const customWave = ctx.createPeriodicWave(coeffs.sin, coeffs.cos, { disableNormalization: true });
    return customWave;
}

// Based off the math in this doc:
// http://liraeletronica.weebly.com/uploads/4/9/3/5/4935509/spectral_analysis_of_a_pwm_signal.pdf
function createPWMCoefficients(duty, terms) {
    var sin = new Float32Array(terms);
    var cos = new Float32Array(terms);
    // sin: a_n = (2/n) * (1/PI) * Sin(n * PI * duty)
    // cos: b_n is always zero.
    let a = 0;
    sin[0] = 0;
    cos[0] = 0;
    for (let i = 1; i < terms; i++) {
        let n = i; + 1;
        sin[i] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
        cos[i] = 0;
    }
    return { cos, sin };
}