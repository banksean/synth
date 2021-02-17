import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import './param-slider';
import './pwm-control';
import createPWMWave from './pwm';
import styles from './styles';

// Tone Generator. Will produce sin, square, saw, triangle, PWM etc.
class OscillatorControl extends LitElement {
    constructor() {
        super();
        this.pitch = 0;
        this.type = 'square';
    }

    static get styles() {
        return styles.generic;
    }

    static get properties() {
        return {
            pitch: { type: Number },
            type: { type: String },
        };
    }

    render() {
        return html `
        <div class="container">
        
        <input @input=${this._typeChanged} type="radio" id="waveform-sine" name="waveform" value="sine" ?checked=${this.type === 'sine'}>
        <label for="waveform-sine">Sine</label>

        <input @input=${this._typeChanged} type="radio" id="waveform-square" name="waveform" value="square" ?checked=${this.type === 'square'}>
        <label for="waveform-square">Square</label>

        <input @input=${this._typeChanged} type="radio" id="waveform-triangle" name="waveform" value="triangle" ?checked=${this.type === 'triangle'}>
        <label for="waveform-triangle">Triangle</label>

        <input @input=${this._typeChanged} type="radio" id="waveform-sawtooth" name="waveform" value="sawtooth" ?checked=${this.type === 'sawtooth'}>
        <label for="waveform-sawtooth">Sawtooth</label>

        <input @input=${this._typeChanged} type="radio" id="waveform-pwm" name="waveform" value="pwm" ?checked=${this.type === 'pwm'}>
        <label for="waveform-pwm">Pulse</label>

        <param-slider @input=${this._pitchChanged} name="Pitch" value="${this.pitch}" min="-4" max="5" step="1"></param-slider>

        <pwm-control @input=${this._pwmChanged}></pwm-control>
        </div>
        `;
    }

    firstUpdated(changedProperties) {
        this.pwm = this.shadowRoot.querySelector('pwm-control');
    }

    _pitchChanged(evt) {
        this.pitch = evt.target.value;
        console.log('pitch changed', this.pitch);
    }

    _pwmChanged(evt) {
        if (this.type == 'pwm') {
            const customWave = createPWMWave(this.ctx, this.pwm.duty, this.pwm.fourierTerms);
            this.audioNode.setPeriodicWave(customWave);
        }
    }

    _typeChanged(evt) {
        this.type = evt.target.value;
        if (this.type == 'pwm') {
            const customWave = createPWMWave(this.ctx, this.pwm.duty, this.pwm.fourierTerms);
            this.audioNode.setPeriodicWave(customWave);
        } else {
            this.audioNode.type = this.type;
        }
    }

    setupAudioNodes(ctx) {
        this.ctx = ctx;
        this.audioNode = this.ctx.createOscillator();
    }

    buildAudioNode() {
        const ret = this.ctx.createOscillator();
        if (this.type == 'pwm') {
            const customWave = createPWMWave(this.ctx, this.pwm.duty, this.pwm.fourierTerms);
            ret.setPeriodicWave(customWave);
        } else {
            ret.type = this.type;
        }
        return ret;
    }
};

customElements.define('oscillator-control', OscillatorControl);