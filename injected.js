(() => {

    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    // Target URL pattern for roles with role ID
    const TARGET_API_PATTERN = /\/api\/v2\/recommendations\/roles\/[^\/\s]+/;

    function isTargetRequest(url, method) {
        if (method !== 'GET') return false
        return TARGET_API_PATTERN.test(url);
    }

    // Function to extract role ID from URL
    function extractRoleId(url) {
        const match = url.match(/\/roles\/([^\/\s]+)/);
        return match ? match[1] : null;
    }

    function sendJsonData(url, method, status, data, requestHeaders = {}) {
        const roleId = extractRoleId(url);
        window.dispatchEvent(new CustomEvent('JSON_RESPONSE_CAPTURED', {
            detail: {
                url: url,
                method: method,
                status: status,
                responseData: data,
                timestamp: Date.now(),
                headers: requestHeaders,
                isRippleMatchAPI: true,
                roleId: roleId
            }
        }));
    }

    // Override fetch with specific RippleMatch targeting
    window.fetch = function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        const method = args[1]?.method || 'GET';

        // Only intercept GET requests to roles/{role_id}
        if (!isTargetRequest(url, method)) {
            return originalFetch.apply(this, args);
        }

        const roleId = extractRoleId(url);
        console.log(`role: ${roleId}`);

        return originalFetch.apply(this, args).then(response => {
            // Clone response to avoid consuming it
            const clonedResponse = response.clone();

            // Always try to parse as JSON for RippleMatch API
            clonedResponse.json().then(data => {
                console.log(`API response for role ${roleId}:`, data);
                sendJsonData(url, method, response.status, data, {
                    'content-type': response.headers.get('content-type')
                });
            }).catch(err => {
                console.warn(`Failed to parse RippleMatch API JSON response for role ${roleId}:`, err);
                // Still send the error info
                sendJsonData(url, method, response.status, {
                    error: 'Failed to parse JSON',
                    responseText: clonedResponse.text ? clonedResponse.text() : 'No response text'
                });
            });

            return response;
        }).catch(err => {
            console.error(`RippleMatch API request failed for role ${roleId}:`, err);
            sendJsonData(url, method, 0, {
                error: 'Network request failed',
                message: err.message
            });
            throw err;
        });
    };

    // Override XMLHttpRequest with RippleMatch targeting
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._method = method;
        this._url = url;
        this._isTargetRequest = isTargetRequest(url, method);

        if (this._isTargetRequest) {
            const roleId = extractRoleId(url);
            console.log(`role: ${roleId}`);
        }

        return originalXHROpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
        const xhr = this;

        // Only intercept target requests
        if (!xhr._isTargetRequest) {
            return originalXHRSend.apply(this, args);
        }

        // Store original onreadystatechange
        const originalOnReadyStateChange = xhr.onreadystatechange;

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                const roleId = extractRoleId(xhr._url);

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const jsonData = JSON.parse(xhr.responseText);
                        console.log(`XHR response for role${roleId}:`, jsonData);
                        sendJsonData(xhr._url, xhr._method, xhr.status, jsonData, {
                            'content-type': xhr.getResponseHeader('content-type')
                        });
                    } catch (err) {
                        console.warn(`Failed to parse RippleMatch XHR JSON response for role ${roleId}:`, err);
                        sendJsonData(xhr._url, xhr._method, xhr.status, {
                            error: 'Failed to parse JSON',
                            responseText: xhr.responseText
                        });
                    }
                } else {

                    sendJsonData(xhr._url, xhr._method, xhr.status, {
                        error: 'HTTP Error',
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText
                    });
                }
            }

            // Call original handler if it exists
            if (originalOnReadyStateChange) {
                originalOnReadyStateChange.apply(this, arguments);
            }
        };

        return originalXHRSend.apply(this, args);
    };

    console.log(' RippleMatch API Monitor: Targeting GET /api/v2/recommendations/roles/{role_id}');
})();