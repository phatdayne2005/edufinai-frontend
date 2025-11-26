const NOTIFICATION_BASE_URL = 'http://localhost:8080/notification';

const getAuthHeaders = (jwtToken) => {
    const token = jwtToken || localStorage.getItem('jwt_token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
        if (process.env.NODE_ENV !== 'production') {
            console.log('[NotificationAPI] Using token', token.substring(0, 15));
        }
    }
    return headers;
};

const request = async (path, options = {}) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[NotificationAPI] request', `${NOTIFICATION_BASE_URL}${path}`, options);
    }
    const response = await fetch(`${NOTIFICATION_BASE_URL}${path}`, {
        method: options.method || 'GET',
        headers: {
            ...getAuthHeaders(options.jwtToken),
            ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        mode: 'cors',
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        if (process.env.NODE_ENV !== 'production') {
            console.error('[NotificationAPI] error', response.status, errorBody);
        }
        throw new Error(errorBody.message || errorBody.error || `Request failed: ${response.status}`);
    }

    return response.status === 204 ? null : response.json().catch(() => ({}));
};

export const registerDeviceToken = async (
    token,
    platform = 'web',
    deviceInfo = navigator.userAgent,
    jwtToken,
) =>
    request('/register-token', {
        method: 'POST',
        jwtToken,
        body: {
            token,
            platform,
            deviceInfo,
        },
    });

export const unregisterDeviceToken = async (token, jwtToken) =>
    request('/token', {
        method: 'DELETE',
        jwtToken,
        body: {
            token,
        },
    });

