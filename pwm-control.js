import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import './param-slider';

class PWMControl extends LitElement {
    constructor() {
        super();
        this.duty = 0.5;
        this.fourierTerms = 10;
    }

    static get properties() {
        return {
            duty: { type: Number },
            fourierTerms: { type: Number }
        }
    }

    static get styles() {
        return css `
        `;
    }

    _dutyChanged(evt) {
        this.duty = evt.target.value;
    }

    _fourierTermsChanged(evt) {
        this.fourierTerms = evt.target.value;
    }

    render() {
        return html `
        <div class="vco">
            PWM
            <param-slider @input=${this._dutyChanged} name="Pulse Width" value="${this.duty}" min="0.01" max="0.99" step="any"></param-slider>
            <param-slider @input=${this._fourierTermsChanged} name="Fourier Terms" value="${this.fourierTerms}" min="2" max="512" step="1"></param-slider>
        </div>`;
    }
}

customElements.define('pwm-control', PWMControl);