import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import Freqs from './freqs.js';
import Keys from './keys.js';

class KbdControl extends LitElement {
    constructor() {
        super();
        this.freqs = Freqs;
        this.keys = Keys;
        this.nodes = {};
    }

    static get styles() {
        return css `
        button {
            border: none;
            width: 32px;
        }
        .white {
            height: 200px;
            background: white;
            color: black;
        }
        .black {
            height: 100px;
            background: black;
            color: white;
            vertical-align: top;
            position: fixed;
            margin: 0 0 0 -16px;
        }
        `;
    }

    render() {
        return html `
        <button class="white" data-note="c" label="C">
            <key>A</key>
        </button>
        <button class="black" data-note="cs" label="C sharp">
            <key>W</key>
        </button>
        <button class="white" data-note="d" label="D"><key>S</key></button>
        <button class="black" data-note="eb" label="E sharp">
            <key>E</key>
        </button>
        <button class="white" data-note="e" label="E"><key>D</key></button>
        <button class="white" data-note="f" label="F"><key>F</key></button>
        <button class="black" data-note="fs" label="F sharp">
            <key>T</key>
        </button>
        <button class="white" data-note="g" label="G"><key>G</key></button>
        <button class="black" data-note="gs" label="G sharp">
            <key>Y</key>
        </button>
        <button class="white" data-note="a" label="A"><key>H</key></button>
        <button class="black" data-note="bb" label="A sharp">
            <key>U</key>
        </button>
        <button class="white" data-note="b" label="B"><key>J</key></button>
        <button class="white" data-note="c2" label="C2">
            <key>K</key>
        </button>
        `;
    }

    noteOn(note) {
        const evt = new CustomEvent('note-on', {
            detail: {
                note: note,
            }
        });
        this.nodes[note] = {};
        this.dispatchEvent(evt);
    }

    noteOff(note) {
        if (!this.nodes[note]) {
            return;
        }
        const evt = new CustomEvent('note-off', {
            detail: {
                note: note,
            }
        });
        delete this.nodes[note];
        this.dispatchEvent(evt);
    }

    firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);
        this.keyBtns = this.shadowRoot.querySelectorAll('button');
        this.addButtonListeners();
        this.addKeyboardListeners();
    }

    addKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.code] || // key doesn't have a note
                this.nodes[this.keys[e.code]] // note is already playing
            ) {
                return;
            }

            this.noteOn(this.keys[e.code]);
        });

        document.addEventListener('keyup', (e) => {
            if (!this.keys[e.code] || !this.nodes[this.keys[e.code]]) return;

            this.noteOff(this.keys[e.code]);
        });
    }

    addButtonListeners() {
        this.keyBtns.forEach((btn) => {
            /*  click button */
            btn.addEventListener('mousedown', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key]) return;

                this.noteOn(key);
                e.preventDefault();
            });

            btn.addEventListener(
                'touchstart',
                (e) => {
                    const key = btn.dataset.note;
                    if (!key || !this.freqs[key]) return;

                    this.noteOn(key);
                    e.preventDefault();
                },
                false
            );

            /* change button while clicked */
            btn.addEventListener('mouseenter', (e) => {
                const key = btn.dataset.note;
                if (!e.buttons || !key || !this.freqs[key]) return;

                this.noteOn(key);
                e.preventDefault();
            });

            /* trigger button with tab controls */
            btn.addEventListener('keydown', (e) => {
                if (!(e.code === 'Space' || e.key === 'Enter')) return;

                this.noteOn(e.target.dataset.note);
            });

            /* release button */
            btn.addEventListener('mouseup', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key]) return;

                this.noteOff(key);
                e.preventDefault();
            });

            btn.addEventListener('mouseout', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key]) return;

                this.noteOff(key);
                e.preventDefault();
            });

            btn.addEventListener('touchend', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key]) return;

                this.noteOff(key);
                e.preventDefault();
            });

            btn.addEventListener('touchcancel', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key]) return;

                this.noteOff(key);
                e.preventDefault();
            });

            btn.addEventListener('keyup', (e) => {
                const key = btn.dataset.note;
                if (!(e.code === 'Space' || e.key === 'Enter')) return;
                if (!key || !this.freqs[key]) return;

                this.noteOff(key);
                e.preventDefault();
            });

            btn.addEventListener('blur', (e) => {
                const key = btn.dataset.note;
                if (!key || !this.freqs[key]) return;

                this.noteOff(key);
                e.preventDefault();
            });
        });
    }
}

customElements.define('kbd-control', KbdControl);