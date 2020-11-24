let audioInput;

navigator.mediaDevices.enumerateDevices().then((devices) => {
    window.console.log(devices);
    for (let i = 0; i < devices.length; i++) {
        const dev = devices[i];
        if (dev.kind == 'audioinput') {
            audioInput = dev;
        }
    }
});

function buildAudioNodeGraph() {
    this.ctx = new window.AudioContext();

    navigator.mediaDevices.getUserMedia({ audio: true }).then((media) => {
        let audioTrack = media.getAudioTracks()[0];
        let options = {
            mediaStream: media,
        };
        let src = new MediaStreamAudioSourceNode(ctx, options);
        // Crazy idea: dynamically add/remove oscopes for each note being played.
        let oscopes = document.querySelectorAll('oscope-control');
        for (let i = 0; i < oscopes.length; i++) {
            oscopes[i].setupAudioNodes(this.ctx, src);
        }

        debugger;

    });
}

window.addEventListener('load', buildAudioNodeGraph);