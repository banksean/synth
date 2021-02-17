// ADSR has one output, one output and four a-rate AudioParam properties.
// This is modeled as a GainNode, so it's assumed to be a combination of
// an EG and a VCA, rather than just an EG.
// TODO: Separate out these concepts, so that:
//   ADSR has no input, just an output AudioParam.
//   To get an EG+VCA, you'd need to set up a plain old GainNode as
//     the destination, and call ADSRInstance.conenct(myGainNode.gain),
//     which in turn calls this.decayNode.connect.

// OR --------
// Since we can't instantiate AudioParams directly, how about making
// ADSR take a couple of factory methods:
//   createEnvelopedNode();
//   getEnvelopedParam()
export default class ADSRGain extends GainNode {
    constructor(ctx, a, d, s, r, input, output) {
        super(ctx);
        // TODO: Replace these Number values with AudioParams.
        this.attackTime = a;
        this.decayTime = d;
        this.sustainRatio = s;
        this.releaseTime = r;

        this.threshold = 0.001;

        this.ctx = ctx;
        // Input is e.g. an OscillatorNode.
        // Output is e.g. the AudioContext.destination
        this.input = input;
        this.output = output;
    }

    // ADSR values are essentially locked-in once gateOn is called.
    // That means e.g. you can't change the sustain value of a note that's
    // already playing.  That's not super realistic.
    gateOn(source) {
        console.log('gateOn', this.ctx.currentTime, this.attackTime, this.releaseTime, this.sustainRatio);

        clearTimeout(this.disconnectTimeout);

        this.input.connect(this);
        this.connect(this.output);
        startADSR(this.gain, this.attackTime, this.decayTime, this.sustainRatio, this.ctx.currentTime);
        this.on = true;
    }

    gateOff() {
        console.log('gateOff', this.ctx.currentTime);
        stopADSR(this.gain, this.sustainRatio, this.releaseTime, this.ctx.currentTime);
        this.disconnectTimeout = setTimeout(() => {
            console.log('disconnect');
            if (this.on) {
                this.input.disconnect(this);
                this.disconnect(this.output);
                this.on = false;
            }
        }, Math.max(this.releaseTime, this.threshold) * 1000);
    }
}

const THRESHOLD = 0.001;

function startADSR(aRateValue, attackTime, decayTime, sustainRatio, currentTime) {
    aRateValue.cancelScheduledValues(currentTime);
    aRateValue.setValueAtTime(0.001, currentTime);
    aRateValue.exponentialRampToValueAtTime(1, currentTime + attackTime);
    console.log('ramping to', Math.max(sustainRatio, THRESHOLD), currentTime + attackTime + decayTime);
    aRateValue.exponentialRampToValueAtTime(Math.max(sustainRatio, THRESHOLD), currentTime + attackTime + decayTime);
}

function stopADSR(aRateValue, sustainRatio, releaseTime, currentTime) {
    console.log('release time', currentTime, releaseTime);
    aRateValue.cancelScheduledValues(currentTime);
    aRateValue.setValueAtTime(sustainRatio, currentTime);
    aRateValue.exponentialRampToValueAtTime(0.00001, currentTime + Math.max(THRESHOLD, releaseTime));
}

class ADSRBiquadFilter extends BiquadFilterNode {
    constructor(ctx, a, d, s, r, input, output) {
        super(ctx);
        // TODO: Replace these Number values with AudioParams.
        this.attackTime = a;
        this.decayTime = d;
        this.sustainRatio = s;
        this.releaseTime = r;

        this.threshold = 0.001;

        this.ctx = ctx;
        // Input is e.g. an OscillatorNode.
        // Output is e.g. the AudioContext.destination
        this.input = input;
        this.output = output;
    }
}