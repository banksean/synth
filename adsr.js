// TODO: Make this a proper AudioNode class?
export default class ADSR {
    constructor(ctx, a, d, s, r, input, output) {
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
        this.input = input;
        this.output = output;
    }

    // ADSR values are essentially locked-in once gateOn is called.
    // That means e.g. you can't change the sustain value of a note that's
    // already playing.
    gateOn(source) {
        console.log('gateOn', this);

        clearTimeout(this.disconnectTimeout);

        this.input.connect(this.attack);
        this.release.connect(this.output);

        // Reset all stages to 1.
        this.attack.gain.cancelScheduledValues(this.ctx.currentTime);
        this.decay.gain.cancelScheduledValues(this.ctx.currentTime);
        this.release.gain.cancelScheduledValues(this.ctx.currentTime);

        this.attack.gain.setValueAtTime(1, this.ctx.currentTime);
        this.decay.gain.setValueAtTime(1, this.ctx.currentTime);
        this.release.gain.setValueAtTime(1, this.ctx.currentTime);

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
        this.on = true;
    }

    gateOff() {
        console.log('gateOff');
        this.release.gain.setValueAtTime(0.9, this.ctx.currentTime);
        this.release.gain.exponentialRampToValueAtTime(
            0.00001,
            this.ctx.currentTime + Math.max(this.releaseTime, this.threshold)
        );

        clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = setTimeout(() => {
            console.log('disconnecting');
            if (this.on) {
                this.input.disconnect(this.attack);
                this.release.disconnect(this.output);
                this.on = false;
            }
        }, Math.max(this.releaseTime, this.threshold) * 1000);

    }
}