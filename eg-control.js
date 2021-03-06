import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import { ADSRGain, ADSRBiquadFilter } from './adsr';
import styles from './styles';

class EGControl extends LitElement {
    constructor() {
        super();
    }

    static get styles() {
        return styles.generic;
    }

    static get properties() {
        return {
            type: { type: String },
            audioNode: { type: ADSRGain },
            attack: { type: Number },
            decay: { type: Number },
            sustain: { type: Number },
            release: { type: Number }
        };
    }

    render() {
        return html `
        <form class="controls">
        <div class="controls-box container">
            Envelope
            <div class="range">
                <label for="attack">Attack</label>
                <input name="attack" id="attack" type="range" data-control-name="attack" min="0" max="1000" value="0" />
            </div>

            <div class="range">
                <label for="decay">Decay</label>
                <input name="decay" id="decay" type="range" data-control-name="decay" min="0" max="1000" value="0" />
            </div>

            <div class="range">
                <label for="decay">Sustain</label>
                <input name="sustain" id="sustain" type="range" data-control-name="sustain" min="0" max="1" value="0.5" step="any"/>
            </div>

            <div class="range">
                <label for="release">Release</label>
                <input name="release" id="release" type="range" data-control-name="release" min="0" max="10000" value="5000" />
            </div>
        </div>
        </form>
        `;
    }

    firstUpdated(changedProperties) {
        this.controls = this.shadowRoot.querySelector('.controls');
        this.controls.addEventListener('input', () => {
            this.applyOptions();
        });
    }

    applyOptions() {
        const data = Object.fromEntries(new FormData(this.controls));
        this.attack = Math.max(parseInt(data.attack) / 1000, 0.01);
        this.decay = Math.max(parseInt(data.decay) / 1000, 0.01);
        this.sustain = Math.max(parseFloat(data.sustain), 0.01);
        this.release = Math.max(parseInt(data.release) / 1000, 0.01);
        if (this.audioNode) { // Yuck.
            this.audioNode.attackTime = this.attack;
            this.audioNode.decayTime = this.decay;
            this.audioNode.sustainRatio = this.sustain;
            this.audioNode.releaseTime = this.release;
        }
    }

    setupAudioNodes(ctx, input, output) {
        this.applyOptions();
        if (this.type == "filter") {
            this.audioNode = new ADSRBiquadFilter(ctx, this.attack, this.decay, this.sustain, this.release, input, output);
        } else {
            this.audioNode = new ADSRGain(ctx, this.attack, this.decay, this.sustain, this.release, input, output);
        }
        // In a gateOn event, ADSRGain will effectively call
        // this.audioNode.input.connect(this.audioNode.attackNode);
        // this.audioNode.releaseNode.connect(this.audioNode.output);
    }
};

customElements.define('eg-control', EGControl);