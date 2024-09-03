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

// Incident logging and display functionality
let incidents = {1: 0, 2: 0, 3: 0}; // Track the number of incidents by severity

const incidentList = document.getElementById('incident-list');
const submitLogButton = document.getElementById('submit-log');
const incidentDetailsInput = document.getElementById('incident-details');
const incidentSeverityInput = document.getElementById('incident-severity');

submitLogButton.addEventListener('click', () => {
    const details = incidentDetailsInput.value;
    const severity = incidentSeverityInput.value;
    
    if (details) {
        incidents[severity]++;
        addIncidentToList(details, severity);
        updateChart();
        clearForm();
    }
});

function addIncidentToList(details, severity) {
    const incidentElement = document.createElement('div');
    incidentElement.className = 'incident-example';
    incidentElement.setAttribute('data-severity', severity);
    
    incidentElement.innerHTML = `
        <h4>${getSeverityLabel(severity)}</h4>
        <p>${details}</p>
        <div class="incident-assets">
            <audio controls src="${audioPlayback.src}"></audio>
            ${screenshotPreview.innerHTML ? screenshotPreview.innerHTML : ''}
        </div>
        <div class="comments-section">
            <textarea class="comment-box" placeholder="Add a comment..."></textarea>
        </div>
        <div class="review-options">
            <button class="reviewed-button">Reviewed</button>
            <button class="check-later-button">Check Later</button>
        </div>
    `;

    incidentList.appendChild(incidentElement);

    // Add event listeners for the buttons
    incidentElement.querySelector('.reviewed-button').addEventListener('click', () => {
        incidentElement.remove();
        incidents[severity]--;
        updateChart();
    });

    incidentElement.querySelector('.check-later-button').addEventListener('click', () => {
        // Placeholder for any additional functionality for "Check Later"
        alert("Incident marked for later review.");
    });

    incidentElement.addEventListener('click', () => {
        alert("Incident clicked: " + details);
    });
}

function getSeverityLabel(severity) {
    if (severity == 1) return "Top Priority (Red Flag)";
    if (severity == 2) return "Secondary Priority (Yellow Flag)";
    return "Lowest Priority (Green Flag)";
}

function clearForm() {
    incidentDetailsInput.value = '';
    incidentSeverityInput.value = '1';
    screenshotPreview.innerHTML = '';
    audioPlayback.src = '';
}

// Chart.js for the pie chart
const ctxChart = document.getElementById('incident-chart').getContext('2d');
let incidentChart = new Chart(ctxChart, {
    type: 'pie',
    data: {
        labels: ['Top Priority', 'Secondary Priority', 'Lowest Priority'],
        datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#ff0000', '#ffcc00', '#00cc00']
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
        }
    },
});

function updateChart() {
    incidentChart.data.datasets[0].data = [incidents[1], incidents[2], incidents[3]];
    incidentChart.update();
}

// PDF download functionality using jsPDF
document.getElementById('download-pdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text("Incident Examples", 10, 10);
    
    let yOffset = 20;
    
    document.querySelectorAll('.incident-example').forEach((incident, index) => {
        const text = incident.querySelector('h4').textContent + ": " + incident.querySelector('p').textContent;
        doc.text(text, 10, yOffset);
        yOffset += 10;
        
        // Adding a placeholder for assets (audio, images) in PDF
        if (incident.querySelector('.incident-assets').innerHTML) {
            doc.text("Assets (voice/screenshots) attached.", 10, yOffset);
            yOffset += 10;
        }
    });
    
    doc.save('incident-examples.pdf');
});