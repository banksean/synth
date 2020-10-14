import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

class ParamSlider extends LitElement {
    constructor() {
        super();
    }

    static get properties() {
        return {
            name: { type: String },
            value: { type: Number },
            increment: { type: Number },
            min: { type: Number },
            max: { type: Number }
        }
    }

    static get styles() {
        return css `
        `;
    }

    render() {
        return html `
        <div class="range">
            <label for="slider">${this.name}</label>
            <input name="slider" id="slider" type="range" data-control-name="slider" min="${this.min}" max="${this.max}" value="${this.value}" increment="${this.increment}" />
        </div>`;
    }
}

customElements.define('param-slider', ParamSlider);