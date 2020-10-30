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
            value: { type: Number, reflect: true },
            step: { type: String },
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
            <input name="slider" id="slider" type="range" data-control-name="slider" min="${this.min}" max="${this.max}" value="${this.value}" step="${this.step}" 
            @input=${this._handleInput}/>
            <span>${this.value}</span>
        </div>`;
    }

    _handleInput(evt) {
        // Databinding does not go *up*, so this should be communicated to parent elements via
        // events.
        this.value = evt.target.value;
    }
}

customElements.define('param-slider', ParamSlider);