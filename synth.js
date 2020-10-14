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

        this.keyboardControls();
        this.buttonControls();
        this.optionControls();
        this.setupOScopeCanvas();
    }

    /// BEGIN OSCOPE
    setupOScopeCanvas() {
        this.canvasCtx = document.querySelector('#canvas').getContext('2d');
        this.canvasWidth = 512;
        this.canvasHeight = 256;
    }

    setupOScopeNodes(audioContext, sourceNode) {
        this.analyserNode = audioContext.createAnalyser();
        this.javascriptNode = audioContext.createScriptProcessor(this.sampleSize, 1, 1);
        // Create the array for the data values
        this.amplitudeArray = new Uint8Array(this.analyserNode.frequencyBinCount);

        // Now connect the nodes together

        sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.javascriptNode);

        this.javascriptNode.addEventListener('audioprocess', () => {
            this.processAudio();
        });

        this.javascriptNode.connect(audioContext.destination);
    }

    processAudio(evt) {
        // get the Time Domain data for this sample
        this.analyserNode.getByteTimeDomainData(this.amplitudeArray);
        // draw the display if the audio is playing
        requestAnimationFrame(() => { this.drawTimeDomain() });
    }

    drawTimeDomain() {
        this.clearCanvas();
        for (let i = 0; i < this.amplitudeArray.length; i++) {
            let value = this.amplitudeArray[i] / 256;
            let y = this.canvasHeight - (this.canvasHeight * value) - 1;
            this.canvasCtx.fillStyle = '#ffffff';
            this.canvasCtx.fillRect(i, y, 1, 1);
        }
    }

    clearCanvas() {
        this.canvasCtx.fillStyle = "rgba(0, 0, 0, 1)";
        this.canvasCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        //this.canvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    /// END OSCOPE 

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
        osc.frequency.value = freq;

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

        /// BEGIN OSCOPE
        // TODO: should connect the oscope to the 'release' node.
        this.setupOScopeNodes(ctx, release);
        /// END OSCOPE

        osc.start(0);

        Array.from(this.keyBtns)
            .filter((btn) => btn.dataset.note === key)[0]
            .classList.add('active');

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
        console.log('endNote');
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
                Array.from(this.keyBtns)
                    .filter((btn) => btn.dataset.note === key)[0]
                    .classList.remove('active');

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

    keyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.code] || // key doesn't have a note
                this.nodes[this.keys[e.code]] // note is already playing
            )
                return;

            this.playNote(this.keys[e.code]);
        });

        document.addEventListener('keyup', (e) => {
            if (!this.keys[e.code] || !this.nodes[this.keys[e.code]]) return;

            this.endNote(this.nodes[this.keys[e.code]]);
        });
    }

    buttonControls() {
        this.keyBtns.forEach((btn) => {
            /*  click button */
            btn.addEventListener('mousedown', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key]) return;

                this.playNote(key);
                e.preventDefault();
            });

            btn.addEventListener(
                'touchstart',
                (e) => {
                    const key = btn.dataset.note;
                    if (!key || !this.freqs[key]) return;

                    this.playNote(key);
                    e.preventDefault();
                },
                false
            );

            /* change button while clicked */
            btn.addEventListener('mouseenter', (e) => {
                const key = btn.dataset.note;
                if (!e.buttons || !key || !this.freqs[key]) return;

                this.playNote(key);
                e.preventDefault();
            });

            /* trigger button with tab controls */
            btn.addEventListener('keydown', (e) => {
                if (!(e.code === 'Space' || e.key === 'Enter')) return;

                this.playNote(e.target.dataset.note);
            });

            /* release button */
            btn.addEventListener('mouseup', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key] || !this.nodes[key]) return;

                this.endNote(this.nodes[key]);
                e.preventDefault();
            });

            btn.addEventListener('mouseout', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key] || !this.nodes[key]) return;

                this.endNote(this.nodes[key]);
                e.preventDefault();
            });

            btn.addEventListener('touchend', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key] || !this.nodes[key]) return;

                this.endNote(this.nodes[key]);
                e.preventDefault();
            });

            btn.addEventListener('touchcancel', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key] || !this.nodes[key]) return;

                this.endNote(this.nodes[key]);
                e.preventDefault();
            });

            btn.addEventListener('keyup', (e) => {
                const key = btn.dataset.note;
                if (!(e.code === 'Space' || e.key === 'Enter')) return;
                if (!key || !this.freqs[key] || !this.nodes[key]) return;

                this.endNote(this.nodes[key]);
                e.preventDefault();
            });

            btn.addEventListener('blur', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key] || !this.nodes[key]) return;

                this.endNote(this.nodes[key]);
                e.preventDefault();
            });
        });
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