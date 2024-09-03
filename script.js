document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas3d');
    const ctx = canvas.getContext('2d');
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

let incidents = JSON.parse(localStorage.getItem('incidents')) || { 1: [], 2: [], 3: [] };

const incidentList = document.getElementById('incident-list');
const submitLogButton = document.getElementById('submit-log');
const incidentDetailsInput = document.getElementById('incident-details');
const incidentSeverityInput = document.getElementById('incident-severity');
const audioPlayback = document.getElementById('audio-playback');
const screenshotPreview = document.getElementById('screenshot-preview');

submitLogButton.addEventListener('click', () => {
    const description = incidentDetailsInput.value;
    const severity = incidentSeverityInput.value;
    const voiceMessage = audioPlayback.src;
    const screenshot = screenshotPreview.innerHTML;

    const incidentData = {
        id: new Date().getTime(),
        description,
        severity,
        voiceMessage,
        screenshot
    };

    incidents[severity].push(incidentData);
    localStorage.setItem('incidents', JSON.stringify(incidents));

    addIncidentToList(incidentData);
    updateChart();
    clearForm();
});

function addIncidentToList(incident) {
    const incidentElement = document.createElement('div');
    incidentElement.className = 'incident-example';
    incidentElement.setAttribute('data-severity', incident.severity);
    incidentElement.setAttribute('data-id', incident.id);
    
    incidentElement.innerHTML = `
        <h4>${getSeverityLabel(incident.severity)}</h4>
        <p>${incident.description}</p>
        <div class="incident-assets">
            ${incident.voiceMessage ? `<audio controls src="${incident.voiceMessage}"></audio>` : ''}
            ${incident.screenshot}
        </div>
        <div class="comments-section">
            <textarea class="comment-box" placeholder="Add a comment..."></textarea>
        </div>
        <div class="review-options">
            <button class="reviewed-button">Reviewed</button>
            <button class="check-later-button">Check Later</button>
            <button class="escalate-button">Escalate</button>
        </div>
    `;

    incidentList.appendChild(incidentElement);

    incidentElement.addEventListener('dblclick', () => {
        openIncidentInNewTab(incident);
    });

    incidentElement.querySelector('.reviewed-button').addEventListener('click', () => {
        removeIncident(incident.id, incident.severity);
        incidentElement.remove();
        updateChart();
    });

    incidentElement.querySelector('.escalate-button').addEventListener('click', () => {
        escalateIncident(incident);
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

function updateChart() {
    const chartData = [
        incidents[1].length,
        incidents[2].length,
        incidents[3].length
    ];
    
    const ctxChart = document.getElementById('incident-chart').getContext('2d');
    if (window.incidentChart) {
        window.incidentChart.data.datasets[0].data = chartData;
        window.incidentChart.update();
    } else {
        window.incidentChart = new Chart(ctxChart, {
            type: 'pie',
            data: {
                labels: ['Top Priority', 'Secondary Priority', 'Lowest Priority'],
                datasets: [{
                    data: chartData,
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
    }
}

function removeIncident(id, severity) {
    incidents[severity] = incidents[severity].filter(incident => incident.id !== id);
    localStorage.setItem('incidents', JSON.stringify(incidents));
}

function escalateIncident(incident) {
    const emailContent = `
        Incident Summary:
        Severity: ${getSeverityLabel(incident.severity)}
        Description: ${incident.description}
        Voice Message: ${incident.voiceMessage ? 'Yes' : 'No'}
        Screenshot: ${incident.screenshot ? 'Yes' : 'No'}
    `;

    window.open(`mailto:eddy1.ayuketah@intel.com?subject=Incident Escalation&body=${encodeURIComponent(emailContent)}`);
}

function openIncidentInNewTab(incident) {
    const incidentWindow = window.open('', '_blank');
    incidentWindow.document.write(`
        <html>
        <head>
            <title>Incident Details</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
            <div class="incident-log-section">
                <h2>${getSeverityLabel(incident.severity)}</h2>
                <p>${incident.description}</p>
                <div class="incident-assets">
                    ${incident.voiceMessage ? `<audio controls src="${incident.voiceMessage}"></audio>` : ''}
                    ${incident.screenshot}
                </div>
                <div class="comments-section">
                    <textarea class="comment-box" placeholder="Add a comment..."></textarea>
                </div>
                <div class="review-options">
                    <button class="reviewed-button" onclick="window.opener.removeIncident(${incident.id}, ${incident.severity}); window.close();">Reviewed</button>
                    <button class="check-later-button" onclick="alert('Marked for later review');">Check Later</button>
                    <button class="escalate-button" onclick="window.opener.escalateIncident(${JSON.stringify(incident)});">Escalate</button>
                </div>
            </div>
        </body>
        </html>
    `);
}

// Load incidents from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    Object.values(incidents).flat().forEach(addIncidentToList);
    updateChart();
});

// Voice Recording Functionality
let mediaRecorder;
let audioChunks = [];

const startRecordingButton = document.getElementById('start-recording');
const stopRecordingButton = document.getElementById('stop-recording');

startRecordingButton.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.start();
        audioChunks = [];

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks);
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayback.src = audioUrl;
        });

        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = false;
    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Could not start recording: ' + error.message);
    }
});

stopRecordingButton.addEventListener('click', () => {
    if (mediaRecorder) {
        mediaRecorder.stop();
        startRecordingButton.disabled = false;
        stopRecordingButton.disabled = true;
    }
});