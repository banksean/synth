import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import './kbd-control';
import './pwm-control';

class SynthControl extends LitElement {
    constructor() {
        super();
    }

    playNote(evt) {
        console.log('play note: ', evt.detail.note);
    }

    endNote(evt) {
        console.log('end note: ', evt.detail.note);
    }

    render() {
        return html `
        <pwm-control></pwm-control>
        <kbd-controller @play-note="${this.playNote}" @end-note="${this.endNote}"></kbd-controller>
        `;
    }
}

customElements.define('synth-control', SynthControl);