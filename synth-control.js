import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import './kbd-control';
import './pwm-control';
import styles from './styles';

class SynthControl extends LitElement {
    constructor() {
        super();
    }

    static get styles() {
        return styles.generic;
    }

    playNote(evt) {
        console.log('play note: ', evt.detail.note);
    }

    endNote(evt) {
        console.log('end note: ', evt.detail.note);
    }

    render() {
        return html `
        <div class="container">
        <pwm-control></pwm-control>
        <kbd-controller @play-note="${this.playNote}" @end-note="${this.endNote}"></kbd-controller>
        </div>
        `;
    }
}

customElements.define('synth-control', SynthControl);