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

What currently happens when the user hits a key?
KeyEvent -> kbd-control
kbd-control fires note-on CustomEvent
Synth class catches note-on, calls this.playNote
.playNote finds the right frequency for the key pressed event
  sets Synth.voice.tg.frequency to that frequency
    Synth.voice.tg is an OscillatorNode
  directly calls Synth.voice.eg.gateOn(Synth.voice.tg)
    Synth.voice.eg is an instance of ADSR, which should be an AudioNode now. 

Synth.voice tries to encapsulate all the stuff required to play a distinct note.
The idea is/was that we could instantiate as many .voice objects as we want for
polyphony.

2021/02/09
- Punt on polyphony.
- Fix state management, use events-up-props-down for now.
- Clarify responsibilities of web components wrt audio graph management.
  - Do they just manage their own AudioNode's properties?
    - One AudioNode per component?
  - Do they need to know about the state of the overall graph?

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

        this.kbd = document.querySelector('kbd-control');
        this.kbd.addEventListener('note-on', (evt) => {
            this.playNote(evt.detail.note);
        });
        this.kbd.addEventListener('note-off', (evt) => {
            this.endNote(this.voice);
        });

        this.gainEG = document.querySelector('gain-eg-control');
        this.tg = document.querySelector('oscillator-control');
        this.filter = document.querySelector('filter-control');

        this.tg.addEventListener('input', (evt) => {
            this.updateToneGenerator();
            //console.log('synth should handle input event from pwm control', evt);
        });

        this.buildAudioNodeGraph();
    }

    buildAudioNodeGraph() {
        this.ctx = new window.AudioContext();

        // Some day tg should grow up to be its own class like EG is.
        //this.tg = this.ctx.createOscillator();
        this.tg.setupAudioNodes(this.ctx);
        this.filter.setupAudioNodes(this.ctx);
        this.tg.audioNode.connect(this.filter.audioNode);
        //this.filter.audioNode.connect(this.gainEG.audioNode);
        this.gainEG.setupAudioNodes(this.ctx, this.filter.audioNode, this.ctx.destination);
        // Do something about 'voices' plural:
        this.voice = {
            ctx: this.ctx,
            tg: this.tg.audioNode,
            eg: this.gainEG.audioNode, // :( clean this up.
            filter: this.filter.audioNode,
        };

        // Crazy idea: dynamically add/remove oscopes for each note being played.
        let oscopes = document.querySelectorAll('oscope-control');
        for (let i = 0; i < oscopes.length; i++) {
            oscopes[i].setupAudioNodes(this.ctx, this.gainEG.audioNode.releaseNode);
        }
    }

    updateToneGenerator() { // should be an event handler on a tone-generator or VCO control
        console.log('udpateToneGenerator', this.voice.tg, this.tg.audioNode);
        //this.voice.tg = this.tg.audioNode;
        const freq = this.getFreq(this.voice.key);
        this.voice.tg.frequency.value = freq;
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
            this.tg.audioNode.start(0);
        }

        console.log('playNote', key);
        const freq = this.getFreq(key);
        this.voice.tg.frequency.value = freq;
        this.voice.key = key;
        //this.updateToneGenerator(); // Should move to its own control and not be called here.
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

        for (let i = 0; i <= this.tg.pitch; i++) {
            freq = freq * 2;
        }

        return freq;
    }
}


window.onload = () => {
    'use strict';
    new Synth();
};