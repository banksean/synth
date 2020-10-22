import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import ADSR from './adsr';

class EGControl extends LitElement {
    constructor() {
        super();
    }

    static get style() {
        return css ``;
    }

    static get properties() {
        return {
            attack: { type: Number },
            decay: { type: Number },
            sustain: { type: Number },
            release: { type: Number }
        };
    }

    render() {
        return html `
        <form class="controls">
        <div class="controls-box">
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
                <input name="sustain" id="sustain" type="range" data-control-name="sustain" min="0" max="100" value="50" />
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
        this.attack = parseInt(data.attack) / 1000 + 0.01;
        this.decay = parseInt(data.decay) / 1000 + 0.001;
        this.sustain = parseInt(data.sustain) + 0.001;
        this.release = parseInt(data.release) / 1000 + 0.1;
        if (this.adsr) { // Yuck.
            this.adsr.attackTime = this.attack;
            this.adsr.decayTime = this.decay;
            this.adsr.sustain = this.sustain;
            this.adsr.releaseTime = this.release;
        }

    }

    setupAudioNodes(ctx, input, output) {
        this.applyOptions();
        this.adsr = new ADSR(ctx, this.attack, this.decay, this.sustain, this.release, input, output);
    }
};

customElements.define('eg-control', EGControl);