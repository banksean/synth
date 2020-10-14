import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import './param-slider';

class PWMControl extends LitElement {
    constructor() {
        super();
    }

    static get properties() {
        return {
            duty: { type: Number }
        }
    }

    static get styles() {
        return css `
        `;
    }

    render() {
        return html `
        <div class="vco">
            PWM
            <param-slider name="Pulse Width" value="${this.duty}" increment="0.001"></param-slider>
        </div>`;
    }
}

customElements.define('pwm-control', PWMControl);