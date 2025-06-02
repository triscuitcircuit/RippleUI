let monitoringEnabled = true;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'MONITORING_STATUS':
            monitoringEnabled = message.enabled;
            console.log('RippleMatch monitoring status:', monitoringEnabled);
            break;

        case 'NETWORK_REQUEST':
            if (monitoringEnabled) {
                console.log('API Request', {
                    url: message.url,
                    method: message.method,
                    requestId: message.requestId,
                    timestamp: new Date(message.timestamp).toISOString(),
                    tabUrl: message.tabUrl
                });

                handleApiRequest(message);
            }
            break;

        case 'NETWORK_RESPONSE':
            if (monitoringEnabled) {
                console.log('Response', {
                    url: message.url,
                    statusCode: message.statusCode,
                    requestId: message.requestId,
                    timestamp: new Date(message.timestamp).toISOString()
                });

                // You can add custom logic here to process the response
                handleApiResponse(message);
            }
            break;

        case 'NETWORK_ERROR':
            if (monitoringEnabled) {
                console.log('API Error:', {
                    url: message.url,
                    error: message.error,
                    requestId: message.requestId,
                    timestamp: new Date(message.timestamp).toISOString()
                });

                handleApiError(message);
            }
            break;
    }
});

// Custom handler for API requests
function handleApiRequest(requestData) {
    // Extract role ID from URL
    const roleIdMatch = requestData.url.match(/\/roles\/([^\/]+)$/);
    const roleId = roleIdMatch ? roleIdMatch[1] : 'unknown';

    console.log(`📋 Requesting role data for ID: ${roleId}`);

}

function handleApiResponse(responseData) {
    const roleIdMatch = responseData.url.match(/\/roles\/([^\/]+)$/);
    const roleId = roleIdMatch ? roleIdMatch[1] : 'unknown';

    if (responseData.statusCode === 200) {
        console.log(`Successfully loaded role data for ID: ${roleId}`);


    } else {
        console.log(`Failed to load role data for ID: ${roleId}, Status: ${responseData.statusCode}`);
    }

}

// Custom handler for API errors
function handleApiError(errorData) {
    const roleIdMatch = errorData.url.match(/\/roles\/([^\/]+)$/);
    const roleId = roleIdMatch ? roleIdMatch[1] : 'unknown';

    console.log(`Network error for role ID: ${roleId}, Error: ${errorData.error}`);

}

function toggleMonitoring() {
    browser.runtime.sendMessage({
        type: 'TOGGLE_MONITORING',
        enabled: !monitoringEnabled
    });
}

window.toggleRippleMatchMonitoring = toggleMonitoring;

console.log('🔍 RippleMatch API Monitor content script loaded');