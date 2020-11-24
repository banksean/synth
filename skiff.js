import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";
/**
    
Given a list of nodes representing AuidioNodes, and edges representing cables (audio or CV), 
construct a sequence of .connect() calls for the list of nodes to instantiate the graph.

Roughly one <foo>-control web component per <foo> AudioNode type?
Though, you could have say a my-vco-module that encapsulates several different AuidoNode types.
  - which itself could be an AudioNode?

Declare them like descrbing modules in a skiff.

<skiff-element>
    <vco-module id="vco" f="1.0" in="1.0"></vco-module>
    <eg-module id="eg" a-ms="100" d-ms="0" s="1.0" r-ms="500"></eg-module>
    <vca-module id="vca" gain="0.5"></vca-module>
    <kbd-ctrl id="kbd"></kbd-ctrl>
    <oscope-module id="oscope"></oscope-module>
    <patch>
        <cable from="kbd" output="gate" to="eg" input="gate">
        <cable from="kbd" output="pitch" to="vco" input="pitch">
        <cable from="vco" output="0" to="vca" input="0">
        <cable from="eg" output="0" to="vca" input="gain">
        <cable from="vca" to="oscope">
    </patch>
</skiff-element>

This would result in a series of calls like so:

ctx = new AudioContext();

// ...SkiffElement traverses its children, resulting in:
osc = ctx.createOscillator();
eg = new ADSR(); // custom AudioNode class, not part of platform.
vca = ctx.createGain();
kbd = new KeyboardControl(); // custom class too.
oscope = new OScopeControl(); // Custom class etc.

// Skiff then calls .connect according to cable elements

kbd.gate.connect(eg.gate); // doesn't seem right, since gates are currently modeled as on/off CustomEvents
kbd.pitch.connect(vco.pitch);
vco.output.connect(vca.input);
eg.output.connect(vca.gain);
vca.output.connect(oscope.input);

// Some assumptions:
- We can construct a node graph fromm the DOM once at init time.
- Custom elements will provide their own AudioNodes, which may or may not be built-in.
*/

// A skiff module element should have one property per knob or switch, so they can
// be set declaratively.
class SkiffElement extends LitElement {
    constructor(ctx) {
        super(ctx);
    }

    static get style() {
        return css ``;
    }

    static get properties() {
        return {}
    }

    render() {
        return html ``;
    }

    // Iterates over the element's contents to find elements that
    // have AudioNodes.
    // Lifecycle of AudioNodes vs lifecycle of Web Components.

    buildAudioNodeGraph() {
        this.ctx = new window.AudioContext();
    }


}

customElements.define('skiff-element', SkiffElement);