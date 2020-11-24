import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import './param-slider';

class FilterControl extends LitElement {
    constructor() {
        super();
        this.cut = 1000;
        this.q = 0.5;
    }

    static get properties() {
        return {
            cut: { type: Number }, //, hasChanged: this._valueChanged },
            q: { type: Number }, //, hasChanged: this._valueChanged }
        };
    }

    _cutChanged(evt) {
        console.log('cut changed', evt.target, evt.target.value);
        this.cut = evt.target.value;
        if (!this.biquadFilter) {
            return;
        }
        this.biquadFilter.frequency.value = this.cut;
    }

    _qChanged(evt) {
        console.log('q changed', evt.target, evt.target.value);
        this.q = evt.target.value;
        if (!this.biquadFilter) {
            return;
        }
        this.biquadFilter.Q.value = this.q;
    }

    static get style() {
        return css `
        `;
    }

    render() {
        return html `
        <div class="vcf">
        VCF
            <param-slider @input=${this._cutChanged} value=${this.cut} name="Cut" min="1" max="20000"></param-slider>
            <param-slider @input=${this._qChanged} value=${this.q} name="Q" min="0.0" max="1.0" step="any"></param-slider>
        </div>
        `;
    }

    setupAudioNodes(ctx, input, output) {
        this.biquadFilter = ctx.createBiquadFilter();
        input.connect(this.biquadFilter);
        this.biquadFilter.connect(output);
    }
}


customElements.define('filter-control', FilterControl);