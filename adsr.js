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
        this.sustain = s;
        this.releaseTime = r;

        this.threshold = 0.001;

        this.attackNode = ctx.createGain();
        this.decayNode = ctx.createGain();
        this.releaseNode = ctx.createGain();
        this.attackNode.connect(this.decayNode);
        this.decayNode.connect(this.releaseNode);

        this.ctx = ctx;
        // Input is e.g. an OscillatorNode.
        // Output is e.g. the AudioContext.destination
        this.input = input;
        this.output = output;
    }

    // TODO: Make connect and disconnect work, and call them from synth.js

    // connect the output of this node to be input into another node
    connect(destinationNode, outputIndex, inputIndex) {
        // ouputIndex refers to one of the outputs of this ADSR node.
        // inputIndex refers to one of the inputs on the destination node.
        this.releaseNode.connect(destinationNode, inputIndex);
    }

    disconnect(destinationNode, outputIndex, inputIndex) {
        this.releaseNode.disconnect(destinationNode, inputIndex);
    }

    // TODO: Consider making Gate be an a-rate AudioParam?

    // ADSR values are essentially locked-in once gateOn is called.
    // That means e.g. you can't change the sustain value of a note that's
    // already playing.  That's not super realistic.
    gateOn(source) {
        console.log('gateOn', this);

        clearTimeout(this.disconnectTimeout);

        this.input.connect(this.attackNode);
        this.releaseNode.connect(this.output);

        // Reset all stages to 1.
        this.attackNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.decayNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.releaseNode.gain.cancelScheduledValues(this.ctx.currentTime);

        this.attackNode.gain.setValueAtTime(1, this.ctx.currentTime);
        this.decayNode.gain.setValueAtTime(1, this.ctx.currentTime);
        this.releaseNode.gain.setValueAtTime(1, this.ctx.currentTime);

        this.attackNode.gain.setValueAtTime(0.00001, this.ctx.currentTime);
        if (this.attackTime > this.threshold) {
            this.attackNode.gain.exponentialRampToValueAtTime(
                0.9,
                this.ctx.currentTime + this.threshold + this.attackTime
            );
        } else {
            this.attackNode.gain.exponentialRampToValueAtTime(
                0.9,
                this.ctx.currentTime + this.threshold
            );
        }

        this.decayNode.gain.setValueAtTime(1, this.ctx.currentTime + this.attackTime);
        this.decayNode.gain.exponentialRampToValueAtTime(
            this.sustain / 100,
            this.ctx.currentTime + this.attackTime + this.decayTime
        );
        this.on = true;
    }

    gateOff() {
        console.log('gateOff');
        this.releaseNode.gain.setValueAtTime(0.9, this.ctx.currentTime);
        this.releaseNode.gain.exponentialRampToValueAtTime(
            0.00001,
            this.ctx.currentTime + Math.max(this.releaseTime, this.threshold)
        );

        clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = setTimeout(() => {
            console.log('disconnecting');
            if (this.on) {
                this.input.disconnect(this.attackNode);
                this.releaseNode.disconnect(this.output);
                this.on = false;
            }
        }, Math.max(this.releaseTime, this.threshold) * 1000);

    }
}