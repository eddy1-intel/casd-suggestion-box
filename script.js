document.addEventListener('DOMContentLoaded', function() {
    let incidents = JSON.parse(localStorage.getItem('incidents')) || { 1: [], 2: [], 3: [] };
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || { reviewed: 0, escalated: 0, checkLater: 0 };

    const incidentList = document.getElementById('incident-list');
    const submitLogButton = document.getElementById('submit-log');
    const incidentDetailsInput = document.getElementById('incident-details');
    const incidentSeverityInput = document.getElementById('incident-severity');
    const audioPlayback = document.getElementById('audio-playback');
    const screenshotPreview = document.getElementById('screenshot-preview');
    const downloadPdfButton = document.getElementById('download-pdf');
    const watchlistContainer = document.getElementById('watchlist');

    const accessModal = document.getElementById('accessModal');
    const roleSelect = document.getElementById('role-select');
    const dateInput = document.getElementById('date-input');
    const accessSubmitButton = document.getElementById('accessSubmit');
    const mainContainer = document.getElementById('main-container');
    const userRole = document.getElementById('user-role');
    const logDate = document.getElementById('log-date');

    // Function to hide modal and show main content
    function showMainContent() {
        accessModal.style.display = 'none';
        mainContainer.style.display = 'block';
    }

    // Handle access modal submission
    accessSubmitButton.addEventListener('click', function() {
        const role = roleSelect.value;
        const date = dateInput.value;

        // Check if both role and date have been selected/entered
        if (role && date) {
            userRole.innerHTML = `Role: ${role}`;
            logDate.innerHTML = `Date: ${date}`;

            // Hide the modal and show the main content
            showMainContent();
        } else {
            alert('Please select a role and enter a valid date.');
        }
    });

    // Handle screenshot upload and display
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

    // Add an incident
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
        togglePdfButtonState();
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
            watchlist.reviewed += 1;
            updateWatchlist();
            incidentElement.remove();
            updateChart();
            togglePdfButtonState();
        });

        incidentElement.querySelector('.check-later-button').addEventListener('click', () => {
            watchlist.checkLater += 1;
            updateWatchlist();
            alert('Marked for later review.');
        });

        incidentElement.querySelector('.escalate-button').addEventListener('click', () => {
            const comment = incidentElement.querySelector('.comment-box').value;
            escalateIncident(incident, comment);
            watchlist.escalated += 1;
            updateWatchlist();
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

    function escalateIncident(incident, comment) {
        const emailContent = `
            Incident Summary:
            Severity: ${getSeverityLabel(incident.severity)}
            Description: ${incident.description}
            Comment: ${comment || "No comments added."}
            Voice Message: ${incident.voiceMessage ? 'Yes' : 'No'}
            Screenshot: ${incident.screenshot ? 'See attached image' : 'No'}
        `;

        const mailtoLink = `mailto:eddy1.ayuketah@intel.com?subject=Incident Escalation&body=${encodeURIComponent(emailContent)}`;
        
        if (incident.screenshot) {
            const newTab = window.open();
            newTab.document.write(`
                <html>
                <body>
                    <h3>Right-click the image below to save and manually attach it to your email:</h3>
                    ${incident.screenshot}
                    <br><br>
                    <a href="${mailtoLink}" target="_blank">Click here to send the email</a>
                </body>
                </html>
            `);
        } else {
            window.location.href = mailtoLink;
        }
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
                        ${incident.screenshot ? `<img src="${incident.screenshot.match(/src="([^"]*)"/)[1]}" alt="Screenshot" style="max-width: 100%; max-height: 500px;">` : ''}
                    </div>
                    <div class="comments-section">
                        <textarea class="comment-box" placeholder="Add a comment..."></textarea>
                    </div>
                    <div class="review-options">
                        <button class="reviewed-button" onclick="window.opener.removeIncident(${incident.id}, ${incident.severity}); window.opener.watchlist.reviewed += 1; window.opener.updateWatchlist(); window.close();">Reviewed</button>
                        <button class="check-later-button" onclick="window.opener.watchlist.checkLater += 1; window.opener.updateWatchlist(); alert('Marked for later review.');">Check Later</button>
                        <button class="escalate-button" onclick="escalateIncident()">Escalate</button>
                    </div>
                </div>
            </body>
            </html>
        `);
    }

    // Update the watchlist section
    function updateWatchlist() {
        watchlistContainer.innerHTML = `
            <p>Reviewed: ${watchlist.reviewed}</p>
            <p>Escalated: ${watchlist.escalated}</p>
            <p>Check Later: ${watchlist.checkLater}</p>
        `;
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }

    // Load incidents and watchlist data from localStorage on page load
    Object.values(incidents).flat().forEach(addIncidentToList);
    updateChart();
    updateWatchlist();
    togglePdfButtonState();

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

    // Toggle the PDF button state based on whether there are incidents
    function togglePdfButtonState() {
        const hasIncidents = Object.values(incidents).flat().length > 0;
        downloadPdfButton.disabled = !hasIncidents;
    }

    // PDF download functionality using jsPDF
    downloadPdfButton.addEventListener('click', () => {
        if (Object.values(incidents).flat().length === 0) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text("Incident Examples", 10, 10);
        
        let yOffset = 20;
        
        document.querySelectorAll('.incident-example').forEach((incident, index) => {
            const text = `${incident.querySelector('h4').textContent}: ${incident.querySelector('p').textContent}`;
            doc.text(text, 10, yOffset);
            yOffset += 10;

            const commentText = incident.querySelector('.comment-box').value || "No comments added.";
            doc.text("Comment: " + commentText, 10, yOffset);
            yOffset += 10;

            if (incident.querySelector('.incident-assets img')) {
                const imgData = incident.querySelector('.incident-assets img').src;
                doc.addImage(imgData, 'PNG', 10, yOffset, 50, 50);
                yOffset += 60;
            }
        });
        
        doc.save('incident-examples.pdf');
    });

});
