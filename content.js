(() => {
    let overlay = null;
    let isEnabled = true;

    function isOnRippleMatchSite() {
        return window.location.hostname === 'app.ripplematch.com';
    }

    if (!isOnRippleMatchSite()) {
        console.log('RippleMatch Monitor: Not on RippleMatch site, skipping overlay');
        return;
    }


    const script = document.createElement('script');
    script.src = browser.runtime.getURL('injected.js');
    script.onload = function() {
        console.log('injected.js loaded successfully');
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('message', message, sender, sendResponse);
        switch (message.type) {
            case 'MONITORING_STATUS':
                isEnabled = message.enabled;
                if (overlay) {
                    overlay.style.display = isEnabled ? 'block' : 'none';
                }
                break;

            case 'NETWORK_REQUEST':
                if (isEnabled) {
                    logRequest(message);
                }
                break;

            case 'NETWORK_RESPONSE':
                if (isEnabled && message.data && message.data.roleId) {
                    displayResponseOverlay(message.data);
                }
                break;
        }
    });

    window.addEventListener('JSON_RESPONSE_CAPTURED', (event) => {
        const data = event.detail;

        if (data.isRippleMatchAPI && data.roleId) {
            console.log('Captured JSON response with role:', data);
            displayResponseOverlay(data);
        }
    });

    function logRequest(message) {
        console.log(`Request ${message.url} - Method: ${message.method}`);
    }

    function displayResponseOverlay(data) {
        if (!overlay) {
            createOverlay();
        } else {
            updateOverlayContent(data);
        }
    }

    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('.json-monitor-header');

        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.id = 'json-monitor-overlay';
        overlay.innerHTML = `
            <div class="json-monitor-header">
                <span class="json-monitor-title">RippleMatch API Response</span>
            </div>
            <pre id="response-content" class="overlay-content"></pre>`;

        document.body.appendChild(overlay);
        makeDraggable(overlay);
    }

    function updateOverlayContent(data) {
        const responseContent = overlay.querySelector('#response-content');
        if (responseContent) {
            responseContent.textContent = "";
            const { default_recruiter_email: recruiterEmail, default_recruiter_name: recruiterName, date_job_listed: DatePosted } =
                data.responseData.role;

            const {candidate_manager_name: managerName, client_manager_email: managerEmail, client_manager_name: managerClientName} =
                data.responseData.role.company;

            const {first_name: posterFirstName, last_name: posterLastName, email: posterEmail} = data.responseData.role.created_by.user;


            const RecList = [
                ["Recruiter Name", recruiterName],
                ["Recruiter Email", recruiterEmail],
                ["Job Post Date", DatePosted]
            ];

            const MananagerList = [
                ["Client Manager", managerName],
                ["Client Manager Name", managerClientName],
                ["Client Manager Email", managerEmail],
            ];

            const PosterList = [
                ["Poster First Name", posterFirstName],
                ["Poster Last Name", posterLastName],
                ["Poster Email", posterEmail],
            ]


            responseContent.textContent = RecList.map(item => `${item[0]}: ${item[1]}`).join('\n') + '\n\n';

            responseContent.textContent += MananagerList.map(item => `${item[0]}: ${item[1]}`).join('\n')+ '\n\n';

            responseContent.textContent += PosterList.map(item => `${item[0]}: ${item[1]}`).join('\n');
        }
    }

})();