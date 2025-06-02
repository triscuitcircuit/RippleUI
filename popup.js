
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusDiv = document.getElementById('status');
    let isEnabled = true;

    let browserAPI = null;
    try {
        browserAPI = browser || chrome;
    } catch (e) {
        console.warn('Browser API not available in popup context');
    }

    function loadState() {
        if (browserAPI && browserAPI.storage) {
            browserAPI.storage.local.get(['monitoringEnabled'], function(result) {
                isEnabled = result.monitoringEnabled !== false;
                updateUI();
            });
        } else {
            communicateWithContentScript('GET_STATUS');
        }
    }

    toggleBtn.addEventListener('click', function() {
        isEnabled = !isEnabled;

        if (browserAPI && browserAPI.storage) {
            browserAPI.storage.local.set({monitoringEnabled: isEnabled});
        }

        if (browserAPI && browserAPI.runtime) {
            browserAPI.runtime.sendMessage({
                type: 'TOGGLE_MONITORING',
                enabled: isEnabled
            });
        } else {

            communicateWithContentScript('TOGGLE_MONITORING', { enabled: isEnabled });
        }

        updateUI();
        showFeedback(isEnabled ? 'Monitoring enabled!' : 'Monitoring disabled!');
    });

    function updateUI() {
        // Update button
        if (isEnabled) {
            toggleBtn.textContent = 'Monitoring: ON';
            toggleBtn.className = 'toggle-btn enabled';
        } else {
            toggleBtn.textContent = 'Monitoring: OFF';
            toggleBtn.className = 'toggle-btn disabled';
        }

        // Update status
        if (statusDiv) {
            if (isEnabled) {
                statusDiv.textContent = 'Monitoring RippleMatch API calls';
                statusDiv.className = 'status active';
            } else {
                statusDiv.textContent = 'Monitoring is disabled';
                statusDiv.className = 'status inactive';
            }
        }
    }

    function showFeedback(message) {
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(feedback);

        setTimeout(() => { feedback.style.opacity = '1'; }, 10);
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 300);
        }, 1500);
    }

    function communicateWithContentScript(action, data = {}) {

        console.log('Popup action:', action, data);

        if (action === 'GET_STATUS') {

            isEnabled = true;
            updateUI();
        }
    }

    loadState();

    console.log('RippleMatch Monitor popup loaded (alternative version)');
});