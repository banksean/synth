import Freqs from './freqs.js';
import Keys from './keys.js';
import createPWMWave from './pwm';

/*
Basic synth modules:
VCO:
    UI props: wave type
    cv in:
        frequency
        pulse width (both continuous)
    audio out: wave, of type, at frequncy

EG:
    UI props: A/D/S/R
    cv in: A/D/S/R (continuous), gate (binary)
    cv out: envelope, according to https://nerdaudio.com/blogs/news/envelope-generator-eg

VCA:
    audio in
    cv in: gain
    audio out: amplified or attenuated signal


Design ideas:
- CV graph: have one global timeout running at high speed, updates all values in the CV chain
- Audio graph: handled by web audio api itself

*/
class Synth {
    constructor() {
        if (!window.AudioContext) {
            document.querySelector('dialog').setAttribute('open', 'open');
            return;
        }

        this.freqs = Freqs;
        this.keys = Keys;
        this.wave = 'sine';
        this.threshold = 0.001;
        this.attack = 0;
        this.decay = 0;
        this.sustain = 50;
        this.release = 0;
        this.pitch = 0;
        this.duty = 0.5;
        this.nodes = {};
        this.keyBtns = document.querySelectorAll('.keyboard button');
        this.controls = document.querySelector('.controls');
        this.headerDiagram = document.querySelector('#header-vis');

        this.kbd = document.querySelector('kbd-controller');
        this.kbd.addEventListener('note-on', (evt) => {
            this.playNote(evt.detail.note);
        });
        this.kbd.addEventListener('note-off', (evt) => {
            this.endNote(this.nodes[evt.detail.note]);
        });

        this.optionControls();
    }

    buildToneGenerator(ctx) {
        const osc = ctx.createOscillator();
        /* configure oscillator */
        if (this.wave == 'pwm') {
            const customWave = createPWMWave(ctx, this.duty);
            osc.setPeriodicWave(customWave);
        } else {
            osc.type = this.wave;
        }
        return osc;
    }

    buildEG(ctx) {
        const eg = new ADSR(ctx, this.attack, this.decay, this.sustain, this.release);
        return eg;
    }

    /**
     * Called when a note starts playing
     *
     * @param {String} key
     */
    playNote(key = 'a') {
        const ctx = new window.AudioContext();
        const attack = ctx.createGain();
        const decay = ctx.createGain();
        const release = ctx.createGain();
        const freq = this.getFreq(key);

        const tg = this.buildToneGenerator(ctx);
        // tg connects to attack, attack connects to decay, decay connects to release,
        // release connects to ctx.destination
        const eg = this.buildEG(ctx);

        tg.connect(eg.attack);
        tg.frequency.value = freq / 3;
        eg.release.connect(ctx.destination);

        let oscope = document.querySelector('oscope-control');
        oscope.setupOScopeNodes(ctx, eg.release);

        tg.start(0);
        eg.gateOn(ctx);

        this.nodes[key] = {
            ctx: ctx,
            osc: tg,
            eg: eg
                //,
                //release: release,
        };
    }

    /**
     * Called when a node stops playing
     *
     * @param {Object} node
     */
    endNote(node) {
        const ctx = node.ctx;
        node.eg.gateOff(ctx);

        window.setTimeout(() => {
            ctx.close();
        }, 1000 * Math.max(this.release, this.threshold));

        Object.keys(this.nodes).forEach((key) => {
            if (this.nodes[key] === node) {
                delete this.nodes[key];
            }
        });
    }

    getFreq(key) {
        let freq = this.freqs[key] || 440;

        for (let i = 0; i <= this.pitch; i++) {
            freq = freq * 2;
        }

        return freq;
    }

    optionControls() {
        const applyOptions = () => {
            const data = Object.fromEntries(new FormData(this.controls));
            this.wave = data.waveform;
            this.attack = parseInt(data.attack) / 1000 + 0.01;
            this.decay = parseInt(data.decay) / 1000 + 0.001;
            this.sustain = parseInt(data.sustain) + 0.001;
            this.release = parseInt(data.release) / 1000 + 0.1;
            this.pitch = parseInt(data.pitch) + 3;
            this.duty = parseFloat(data.duty);

            for (const k in this.nodes) {
                let n = this.nodes[k];
                if (!n.osc) {
                    continue;
                }
                const freq = this.getFreq(k);
                n.osc.frequency.value = freq / 3;
                if (this.wave == 'pwm') {
                    const customWave = createPWMWave(n.ctx, this.duty);
                    n.osc.setPeriodicWave(customWave);
                } else {
                    n.osc.type = this.wave;
                }
            }
        };

        this.controls.addEventListener('input', () => {
            applyOptions();
        });

        applyOptions();
    }
}

class ADSR {
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
    }

    gateOn(ctx) {
        this.attack.gain.setValueAtTime(0.00001, ctx.currentTime);
        if (this.attackTime > this.threshold) {
            this.attack.gain.exponentialRampToValueAtTime(
                0.9,
                ctx.currentTime + this.threshold + this.attackTime
            );
        } else {
            this.attack.gain.exponentialRampToValueAtTime(
                0.9,
                ctx.currentTime + this.threshold
            );
        }

        this.decay.gain.setValueAtTime(1, ctx.currentTime + this.attackTime);
        this.decay.gain.exponentialRampToValueAtTime(
            this.sustain / 100,
            ctx.currentTime + this.attackTime + this.decayTime
        );
    }

    gateOff(ctx) {
        /* configure release */
        this.release.gain.setValueAtTime(0.9, ctx.currentTime);
        this.release.gain.exponentialRampToValueAtTime(
            0.00001,
            ctx.currentTime + Math.max(this.releaseTime, this.threshold)
        );
    }
}

new Synth();

window.onload = () => {
    'use strict';
};