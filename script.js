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

// Handle screenshot upload and display in the incident example section
const screenshotUpload = document.getElementById('screenshot-upload');

screenshotUpload.addEventListener('change', () => {
    const file = screenshotUpload.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            screenshotPreview.innerHTML = `<img src="${e.target.result}" alt="Screenshot" style="max-width: 100%; max-height: 150px; display: block; margin-top: 10px;">`;
        };
        reader.readAsDataURL(file);
    }
});

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

// Function to add an incident to the list and display it on the page
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
            ${incident.screenshot ? incident.screenshot : ''}
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
        const comment = incidentElement.querySelector('.comment-box').value;
        escalateIncident(incident, comment);
    });
}

// Function to get severity label based on the severity level
function getSeverityLabel(severity) {
    if (severity == 1) return "Top Priority (Red Flag)";
    if (severity == 2) return "Secondary Priority (Yellow Flag)";
    return "Lowest Priority (Green Flag)";
}

// Function to clear the form after submission
function clearForm() {
    incidentDetailsInput.value = '';
    incidentSeverityInput.value = '1';
    screenshotPreview.innerHTML = '';
    audioPlayback.src = '';
}

// Function to update the chart displaying the number of incidents per severity level
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

// Function to remove an incident from the list
function removeIncident(id, severity) {
    incidents[severity] = incidents[severity].filter(incident => incident.id !== id);
    localStorage.setItem('incidents', JSON.stringify(incidents));
}

// Function to handle the escalation of an incident, including the screenshot and comment
function escalateIncident(incident, comment) {
    const emailContent = `
        Incident Summary:
        Severity: ${getSeverityLabel(incident.severity)}
        Description: ${incident.description}
        Comment: ${comment || "No comments added."}
        Voice Message: ${incident.voiceMessage ? 'Yes' : 'No'}
        Screenshot: ${incident.screenshot ? 'Yes (see attached)' : 'No'}
    `;

    const mailtoLink = `mailto:eddy1.ayuketah@intel.com?subject=Incident Escalation&body=${encodeURIComponent(emailContent)}`;
    const a = document.createElement('a');
    a.href = mailtoLink;
    a.target = '_blank';
    a.click();
}

// Function to open the incident details in a new tab
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
                    ${incident.screenshot ? incident.screenshot : ''}
                </div>
                <div class="comments-section">
                    <textarea class="comment-box" placeholder="Add a comment..."></textarea>
                </div>
                <div class="review-options">
                    <button class="reviewed-button" onclick="window.opener.removeIncident(${incident.id}, ${incident.severity}); window.close();">Reviewed</button>
                    <button class="check-later-button" onclick="alert('Marked for later review');">Check Later</button>
                    <button class="escalate-button" onclick="window.opener.escalateIncident(${JSON.stringify(incident)}, document.querySelector('.comment-box').value);">Escalate</button>
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

// Add delete option for the voice recording
function deleteRecording() {
    audioPlayback.src = '';
    audioChunks = [];
}

const deleteRecordingOption = document.createElement('button');
deleteRecordingOption.innerText = 'Delete Recording';
deleteRecordingOption.addEventListener('click', deleteRecording);

document.querySelector('.log-form').appendChild(deleteRecordingOption);