import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import './param-slider';

class CustomPeriodicWaveControl extends LitElement {
    constructor() {
        super();
        this.N = 8;
        this.coeffs = [];
        for (let i = 0; i < this.N; i++) {
            this.coeffs.push({
                sin: 0,
                cos: 0
            });
        }
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
            Custom PeriodicWave
            ${this.coeffs.map((c, i) => {
                return html`
                <param-slider name="Sin ${i+1}" value="${c.sin}"></param-slider>
                <param-slider name="Cos ${i+1}" value="${c.cos}"></param-slider>
                `;
            })}
        </div>`;
    }
}

customElements.define('custom-periodic-wave-control', CustomPeriodicWaveControl);