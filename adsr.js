export default class ADSRClass {
    constructor(ctx, a, d, s, r) {
        this.attackTime = a;
        this.decayTime = d;
        this.sustain = s;
        this.releaseTime = r;

        this.threshold = 0.001;

        this.attack = ctx.createGain();
        this.decay = ctx.createGain();
        this.release = ctx.createGain();
        this.attack.connect(this.decay);
        this.decay.connect(this.release);

        this.ctx = ctx;
    }

    // ADSR values are essentially locked-in once gateOn is called.
    // That means e.g. you can't change the sustain value of a note that's
    // already playing.
    gateOn() {
        this.attack.gain.setValueAtTime(0.00001, this.ctx.currentTime);
        if (this.attackTime > this.threshold) {
            this.attack.gain.exponentialRampToValueAtTime(
                0.9,
                this.ctx.currentTime + this.threshold + this.attackTime
            );
        } else {
            this.attack.gain.exponentialRampToValueAtTime(
                0.9,
                this.ctx.currentTime + this.threshold
            );
        }

        this.decay.gain.setValueAtTime(1, this.ctx.currentTime + this.attackTime);
        this.decay.gain.exponentialRampToValueAtTime(
            this.sustain / 100,
            this.ctx.currentTime + this.attackTime + this.decayTime
        );
    }

    gateOff() {
        this.release.gain.setValueAtTime(0.9, this.ctx.currentTime);
        this.release.gain.exponentialRampToValueAtTime(
            0.00001,
            this.ctx.currentTime + Math.max(this.releaseTime, this.threshold)
        );
    }
}