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
        this.pitch = 0;
        this.controls = document.querySelector('.controls');

        this.kbd = document.querySelector('kbd-control');
        this.kbd.addEventListener('note-on', (evt) => {
            this.playNote(evt.detail.note);
        });
        this.kbd.addEventListener('note-off', (evt) => {
            this.endNote(this.voice);
        });


        this.eg = document.querySelector('eg-control');
        this.pwm = document.querySelector('pwm-control');
        this.pwm.addEventListener('input', (evt) => {
            this.updateToneGenerator();
            //console.log('synth should handle input event from pwm control', evt);
        });

        this.buildAudioNodeGraph();
        this.optionControls();
    }

    buildAudioNodeGraph() {
        this.ctx = new window.AudioContext();

        // Some day tg should grow up to be its own class like EG is.
        this.tg = this.ctx.createOscillator();
        this.eg.setupAudioNodes(this.ctx, this.tg, this.ctx.destination);

        // Do something about 'voices' plural:
        this.voice = {
            ctx: this.ctx,
            tg: this.tg,
            eg: this.eg.adsr // :( clean this up.
        };

        // Crazy idea: dynamically add/remove oscopes for each note being played.
        let oscopes = document.querySelectorAll('oscope-control');
        for (let i = 0; i < oscopes.length; i++) {
            oscopes[i].setupAudioNodes(this.ctx, this.eg.adsr.release);
        }
    }

    updateToneGenerator() { // should be an event handler on a tone-generator or VCO control
        if (this.wave == 'pwm') {
            const customWave = createPWMWave(this.ctx, this.pwm.duty, this.pwm.fourierTerms);
            this.voice.tg.setPeriodicWave(customWave);
        } else {
            this.voice.tg.type = this.wave;
        }
    }

    /**
     * Assign a note to one of the voices: set it's TG's frequency, then
     * send the EG the gate-on event. 
     *
     * @param {String} key
     */
    playNote(key = 'a') {
        if (!this.started) {
            this.started = true;
            this.tg.start(0);
        }

        console.log('playNote', key);
        const freq = this.getFreq(key);
        this.voice.tg.frequency.value = freq / 3;
        this.voice.key = key;
        this.updateToneGenerator(); // Should move to its own control and not be called here.
        this.voice.eg.gateOn(this.voice.tg);
    }

    /**
     * Called when a node stops playing
     *
     * @param {Object} node
     */
    endNote(voice) {
        console.log('endNote', voice);
        voice.eg.gateOff(voice.tg);
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
            this.pitch = parseInt(data.pitch) + 3;
            this.duty = parseFloat(data.duty);
            if (this.voice.key) {
                const freq = this.getFreq(this.voice.key);
                this.voice.tg.frequency.value = freq / 3;
            }
            if (this.wave == 'pwm') {
                const customWave = createPWMWave(this.voice.ctx, this.duty);
                this.voice.tg.setPeriodicWave(customWave);
            } else {
                this.voice.tg.type = this.wave;
            }
        };

        this.controls.addEventListener('input', () => {
            applyOptions();
        });

        applyOptions();
    }
}


window.onload = () => {
    'use strict';
    new Synth();
};