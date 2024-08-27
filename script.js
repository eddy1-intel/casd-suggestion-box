// Placeholder for 3D Canvas implementation
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas3d');
    const ctx = canvas.getContext('2d');
    
    // Simple example of drawing a rotating cube (can be replaced with a more advanced 3D rendering)
    let angle = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(-50, -50, 100, 100);
        ctx.restore();
        angle += 0.01;
        requestAnimationFrame(draw);
    }

    draw();
});

// Voice recording functionality
let mediaRecorder;
let audioChunks = [];
const startRecordingButton = document.getElementById('start-recording');
const stopRecordingButton = document.getElementById('stop-recording');
const audioPlayback = document.getElementById('audio-playback');

startRecordingButton.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayback.src = audioUrl;
        audioChunks = [];
    });

    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
});

stopRecordingButton.addEventListener('click', () => {
    mediaRecorder.stop();
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;
});

// Screenshot upload and preview functionality
const screenshotUpload = document.getElementById('screenshot-upload');
const screenshotPreview = document.getElementById('screenshot-preview');

screenshotUpload.addEventListener('change', () => {
    const file = screenshotUpload.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            screenshotPreview.innerHTML = `<img src="${e.target.result}" alt="Screenshot">`;
        };
        reader.readAsDataURL(file);
    }
});

// Feature buttons functionality
const featureButtons = document.querySelectorAll('.feature-button');
const featureDescription = document.getElementById('feature-description');

const featureDescriptions = {
    "real-time-updates": "Log updates as the shift progresses, ensuring everyone is on the same page.",
    "shift-summary-reports": "Automatically generate shift summary reports at the end of each shift.",
    "interactive-timeline": "View a chronological log of all incidents and updates.",
    "incident-escalation": "Escalate critical issues quickly with automated alerts.",
    "analytics-reporting": "Track performance and identify trends with in-depth analytics.",
    "voice-screenshot-logging": "Record voice messages and paste screenshots directly when logging incidents."
};

featureButtons.forEach(button => {
    button.addEventListener('click', () => {
        const featureKey = button.getAttribute('data-feature');
        featureDescription.innerHTML = `<p>${featureDescriptions[featureKey]}</p>`;
    });
});
