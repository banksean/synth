import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";


class OscilloscopeControl extends LitElement {
    constructor() {
        super();
    }

    static get properties() {
        return {
            sampleSize: { type: Number }
        }
    }

    static get styles() {
        return css `
        #canvas {
            margin-left: auto;
            margin-right: auto;
            display: block;
            background-color: black;
        }
        
        #controls {
            text-align: center;
        }
        
        #start_button,
        #stop_button {
            font-size: 16pt;
        }
        
        #msg {
            text-align: center;
        }
        `;
    }

    render() {
        return html `
        <canvas id="canvas" width="256" height="128"></canvas>
        `;
    }

    firstUpdated(chnagedProperties) {
        this.setupOScopeCanvas();
    }

    setupOScopeCanvas() {
        this.canvasCtx = this.shadowRoot.querySelector('#canvas').getContext('2d');
        this.canvasWidth = 256;
        this.canvasHeight = 128;
    }

    setupOScopeNodes(audioContext, sourceNode) {
        this.analyserNode = audioContext.createAnalyser();
        this.javascriptNode = audioContext.createScriptProcessor(this.sampleSize, 1, 1);
        this.amplitudeArray = new Uint8Array(this.analyserNode.frequencyBinCount);

        sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.javascriptNode);

        this.javascriptNode.addEventListener('audioprocess', () => {
            this.processAudio();
        });

        this.javascriptNode.connect(audioContext.destination);
    }

    processAudio(evt) {
        // get the Time Domain data for this sample
        this.analyserNode.getByteTimeDomainData(this.amplitudeArray);
        // draw the display if the audio is playing
        requestAnimationFrame(() => { this.drawTimeDomain() });
    }

    drawTimeDomain() {
        this.clearCanvas();
        for (let i = 0; i < this.amplitudeArray.length; i++) {
            let value = this.amplitudeArray[i] / 256;
            let y = this.canvasHeight - (this.canvasHeight * value) - 1;
            this.canvasCtx.fillStyle = '#ffffff';
            let x = i * this.canvasWidth / this.amplitudeArray.length;
            this.canvasCtx.fillRect(x, y, 1, 1);
        }
    }

    clearCanvas() {
        this.canvasCtx.fillStyle = "rgba(0, 0, 0, 1)";
        this.canvasCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        //this.canvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
}

customElements.define('oscope-control', OscilloscopeControl);