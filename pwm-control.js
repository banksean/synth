import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import './param-slider';
import styles from './styles';

// Does this really need to be a separate control from tg-control?
class PWMControl extends LitElement {
    constructor() {
        super();
        this.duty = 0.5;
        this.fourierTerms = 32;
    }

    static get properties() {
        return {
            duty: { type: Number },
            fourierTerms: { type: Number }
        }
    }

    static get styles() {
        return styles.generic;
    }

    _dutyChanged(evt) {
        this.duty = evt.target.value;
    }

    _fourierTermsChanged(evt) {
        this.fourierTerms = evt.target.value;
    }

    render() {
        return html `
        <div class="vco container">
            PWM
            <param-slider @input=${this._dutyChanged} name="Pulse Width" value="${this.duty}" min="0.01" max="0.99" step="any"></param-slider>
            <param-slider @input=${this._fourierTermsChanged} name="Fourier Terms" value="${this.fourierTerms}" min="2" max="512" step="1"></param-slider>
        </div>`;
    }
}

customElements.define('pwm-control', PWMControl);