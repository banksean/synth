import Freqs from './freqs.js';
import Keys from './keys.js';
import createPWMWave from './pwm';

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

    /**
     * Called when a note starts playing
     *
     * @param {String} key
     */
    playNote(key = 'a') {
        const ctx = new window.AudioContext();
        const osc = ctx.createOscillator();
        const attack = ctx.createGain();
        const decay = ctx.createGain();
        const release = ctx.createGain();
        const freq = this.getFreq(key);

        /* configure oscillator */
        if (this.wave == 'pwm') {
            const customWave = createPWMWave(ctx, this.duty);
            osc.setPeriodicWave(customWave);
        } else {
            osc.type = this.wave;
        }

        osc.connect(attack);
        osc.frequency.value = freq / 3;
        console.log('starting freq for ' + key + ': ' + freq / 3, osc.frequency.value);

        /* configure attack */
        attack.gain.setValueAtTime(0.00001, ctx.currentTime);
        if (this.attack > this.threshold) {
            attack.gain.exponentialRampToValueAtTime(
                0.9,
                ctx.currentTime + this.threshold + this.attack
            );
        } else {
            attack.gain.exponentialRampToValueAtTime(
                0.9,
                ctx.currentTime + this.threshold
            );
        }
        attack.connect(decay);

        /* configure decay */
        decay.gain.setValueAtTime(1, ctx.currentTime + this.attack);
        decay.gain.exponentialRampToValueAtTime(
            this.sustain / 100,
            ctx.currentTime + this.attack + this.decay
        );
        decay.connect(release);

        release.connect(ctx.destination);

        let oscope = document.querySelector('oscope-control');
        oscope.setupOScopeNodes(ctx, release);

        osc.start(0);

        this.nodes[key] = {
            ctx: ctx,
            osc: osc,
            release: release,
        };
    }

    /**
     * Called when a node stops playing
     *
     * @param {Object} node
     */
    endNote(node) {
        const ctx = node.ctx;
        const release = node.release;

        /* configure release */
        release.gain.setValueAtTime(0.9, ctx.currentTime);
        release.gain.exponentialRampToValueAtTime(
            0.00001,
            ctx.currentTime + Math.max(this.release, this.threshold)
        );

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
            console.log('applying options to running nodes');
            for (const k in this.nodes) {
                let n = this.nodes[k];
                console.log('updating ' + k);
                if (!n.osc) {
                    continue;
                }
                const freq = this.getFreq(k);
                console.log(n.osc.frequency.value, freq / 3);
                n.osc.frequency.value = freq / 3;
                if (this.wave == 'pwm') {
                    const customWave = createPWMWave(n.ctx, this.duty);
                    n.osc.setPeriodicWave(customWave);
                } else {
                    n.osc.type = this.wave;
                }
            }
        };

        this.controls.addEventListener('change', () => {
            applyOptions();
        });

        applyOptions();
    }
}

new Synth();

window.onload = () => {
    'use strict';
};