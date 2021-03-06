import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element/lit-element.js?module";

import styles from './styles';

// TODO: Try using SVG instead of Canvas(!)
//       Have one horizontal line segment for the strobe and
//       set the y values of each point during the strobe.
//       Might be a) faster and b) a nicer export format.
class OscilloscopeControl extends LitElement {
    constructor() {
        super();
        this.type = "time";
        this.canvasWidth = 256;
        this.canvasHeight = 128;
        this.sweepTriggerThresh = 0;
        this.holdOffMs = 1;
        this.fftSize = 2048;
    }

    static get properties() {
        return {
            sampleSize: { type: Number },
            type: { type: String },
            canvasWidth: { type: Number },
            canvasHeight: { type: Number },
            sweepTriggerThresh: { type: Number },
            holdOffMs: { type: Number },
            fftSize: { type: Number },
        }
    }

    static get styles() {
        return css `
        ${styles.generic}
        #canvas {
            display: inline-block;
            background-color: black;
        }

        #container {
            display: inline-block;
        }
        `;
    }

    render() {
        return html `
        <div id="container" class="container">
            <canvas id="canvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
        </div>
        `;
    }

    firstUpdated(chnagedProperties) {
        this.canvasCtx = this.shadowRoot.querySelector('#canvas').getContext('2d');
    }

    setupAudioNodes(audioContext, sourceNode) {
        this.analyserNode = audioContext.createAnalyser();
        this.analyserNode.fftSize = this.fftSize;
        this.analyserNode.smoothingTimeConstant = 0.9;
        this.frequencyArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.amplitudeArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(audioContext.destination);

        this.update = throttle(() => {
            this.processAudio();
        }, this.holdOffMs);

        this.start();
    }

    start() {
        this.updateInterval = window.setInterval(() => { this.update(); }, this.holdOffMs); // Start the update loop.
    }

    stop() {
        window.clearInterval(this.updateInterval);
    }

    processAudio(evt) {
        if (this.type == 'time') {
            this.amplitudeArray.fill(0);
            this.analyserNode.getByteTimeDomainData(this.amplitudeArray);
            requestAnimationFrame(() => { this.drawTimeDomain() });
        } else {
            this.frequencyArray.fill(0);
            this.analyserNode.getByteFrequencyData(this.frequencyArray);
            requestAnimationFrame(() => { this.drawFrequencyDomain() });
        }
    }

    drawFrequencyDomain() {
        this.clearCanvas();
        this.canvasCtx.beginPath();
        this.canvasCtx.fillStyle = '#ffffff';
        const barWidth = Math.max(this.canvasWidth / this.frequencyArray.length - 1, 1);
        for (let i = 0; i < this.frequencyArray.length; i++) {
            let value = this.frequencyArray[i] / 256;
            let x = i * this.canvasWidth / this.frequencyArray.length;
            let y = this.canvasHeight - (this.canvasHeight * value);
            this.canvasCtx.fillRect(x, y, barWidth, this.canvasHeight * value);
        }
    }

    drawTimeDomain() {
        this.clearCanvas();
        let sweepStart = -1;
        let previousValue = this.amplitudeArray[0] - 128;
        // Triggered sweep:
        // https://en.wikipedia.org/wiki/Oscilloscope#Triggered_sweep
        // Don't start drawing the amplitude values until we get to a one that
        // crosses the trigger threshold.  Hard-coded to be positive tigger polarity:
        // only triggering when amplitude crosses the threshold going *up* in value.
        // TODO: make trigger polarity a parameter.
        this.canvasCtx.beginPath();
        this.canvasCtx.strokeStyle = '#ffffff';
        for (let i = 0; i < this.amplitudeArray.length; i++) {
            const currentValue = this.amplitudeArray[i] - 128;

            // Start the sweep if the signal passed through the threshold value at any point between
            // prevousValue and currentValue, inclusive.
            if (sweepStart == -1 && (currentValue >= this.sweepTriggerThresh && previousValue < this.sweepTriggerThresh)) {
                sweepStart = i;
            } else if (sweepStart == -1) {
                // Keep moving the starting point until the sweep actually triggers.
                this.canvasCtx.moveTo(0, this.canvasHeight - (this.canvasHeight * this.amplitudeArray[i] / 256));
                previousValue = currentValue;
                continue;
            }
            const value = this.amplitudeArray[i] / 256;
            const x = (i - sweepStart) * this.canvasWidth / this.amplitudeArray.length;
            const y = this.canvasHeight - (this.canvasHeight * value) - 1;
            this.canvasCtx.lineTo(x, y);
        }
        this.canvasCtx.stroke();
    }

    // TODO: Add a 'disconnect' event handler so we can continue to clear
    // the canvas for a few frames after the signal stops, just to clear it
    // out.

    clearCanvas(width = this.canvasWidth) {
        // clearRect is faster that fillRect, but leaves the bg transparent.
        // This makes copying and pasting the image less useful. Also,
        // fillRect allows us to create a sort of fading persistence to the
        // sweep so it doesn't disappear right awway.
        this.canvasCtx.fillStyle = "rgba(0, 0, 0, 0.1)"; // 0.1 opacity gradually fades out over successive redraws.
        this.canvasCtx.fillRect(0, 0, width, this.canvasHeight);
    }
}

customElements.define('oscope-control', OscilloscopeControl);

// C&P from SO! https://stackoverflow.com/questions/27078285/simple-throttle-in-js
function throttle(callback, limit) {
    var waiting = false; // Initially, we're not waiting
    return function() { // We return a throttled function
        if (!waiting) { // If we're not waiting
            callback.apply(this, arguments); // Execute users function
            waiting = true; // Prevent future invocations
            setTimeout(function() { // After a period of time
                waiting = false; // And allow future invocations
            }, limit);
        }
    }
}