/**
 * API Testing Utility
 * Expose functions to window for easy console testing
 */

/**
 * Get JWT token from localStorage
 */
export const getToken = () => {
    return localStorage.getItem('jwt_token');
};

/**
 * Test API call with JWT token
 * @param {string} url - API endpoint URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} body - Request body (optional)
 * @param {object} additionalHeaders - Additional headers (optional)
 */
export const testApiCall = async (url, method = 'GET', body = null, additionalHeaders = {}) => {
    const token = getToken();

    if (!token) {
        console.error('❌ Không tìm thấy JWT token trong localStorage!');
        console.log('💡 Hãy đăng nhập trước để có token.');
        return null;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...additionalHeaders,
    };

    const options = {
        method: method.toUpperCase(),
        headers,
        mode: 'cors',
    };

    if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    console.log('🚀 Testing API Call:');
    console.log('📍 URL:', url);
    console.log('🔧 Method:', method.toUpperCase());
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    console.log('📦 Headers:', headers);
    if (body) {
        console.log('📝 Body:', body);
    }
    console.log('⏳ Sending request...\n');

    try {
        const startTime = Date.now();
        const response = await fetch(url, options);
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log('✅ Response received:');
        console.log('📊 Status:', response.status, response.statusText);
        console.log('⏱️  Duration:', duration + 'ms');

        // Log response headers
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        console.log('📋 Response Headers:', responseHeaders);

        // Try to parse response
        const contentType = response.headers.get('content-type');
        let data = null;

        if (contentType && contentType.includes('application/json')) {
            try {
                const text = await response.text();
                data = JSON.parse(text);
                console.log('📦 Response Data:', data);
            } catch (e) {
                console.warn('⚠️  Could not parse JSON response');
            }
        } else {
            const text = await response.text();
            console.log('📦 Response Text:', text.substring(0, 200));
        }

        if (!response.ok) {
            console.error('❌ Request failed with status:', response.status);
        } else {
            console.log('✅ Request successful!');
        }

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            data: data,
            duration: duration,
        };
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('📝 Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
        });
        return {
            ok: false,
            error: error.message,
        };
    }
};

/**
 * Quick test functions for common endpoints
 */
export const testAuth = {
    // Test get current user info
    getCurrentUser: () => testApiCall('http://localhost:8080/auth/me', 'GET'),

    // Test any endpoint
    call: (url, method = 'GET', body = null) => testApiCall(url, method, body),

    // Show token info
    showToken: () => {
        const token = getToken();
        if (!token) {
            console.log('❌ Không có token');
            return;
        }

        try {
            // Decode JWT (without verification)
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                console.log('🔑 Token Info:');
                console.log('📝 Full Token:', token);
                console.log('📦 Payload:', payload);
                console.log('⏰ Expires:', payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A');
                console.log('👤 Subject:', payload.sub || 'N/A');
            }
        } catch (e) {
            console.log('🔑 Token:', token);
            console.warn('⚠️  Could not decode token');
        }
    },

    // Clear token
    clearToken: () => {
        localStorage.removeItem('jwt_token');
        console.log('🗑️  Token đã được xóa');
    },
};

// Expose to window for console access
if (typeof window !== 'undefined') {
    window.testApi = testApiCall;
    window.testAuth = testAuth;
    console.log('✅ API Test utilities đã sẵn sàng!');
    console.log('💡 Sử dụng:');
    console.log('   - testApi(url, method, body) - Test API call');
    console.log('   - testAuth.getCurrentUser() - Test get current user');
    console.log('   - testAuth.call(url, method, body) - Test any endpoint');
    console.log('   - testAuth.showToken() - Xem thông tin token');
    console.log('   - testAuth.clearToken() - Xóa token');
    console.log('');
}

