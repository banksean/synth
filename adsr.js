// ADSR has one output, one output and four a-rate AudioParam properties.
export default class ADSR extends GainNode {
    constructor(ctx, a, d, s, r, input, output) {
        super(ctx);
        // Replace these Number values with AudioParams.
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
        this.input = input;
        this.output = output;
    }

    // connect the output of this node to be input into another node
    connect(destinationNode, outputIndex, inputIndex) {
        // ouputIndex refers to one of the outputs of this ADSR node.
        // inputIndex refers to one of the inputs on the destination node.
        this.release.connect(destinationNode, inputIndex);
    }

    disconnect(destinationNode, outputIndex, inputIndex) {
        this.release.disconnect(destinationNode, inputIndex);
    }

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