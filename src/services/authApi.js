/**
 * Auth Service API
 * Base URL: http://localhost:8080/auth (via Gateway)
 */

const AUTH_BASE_URL = 'http://localhost:8080/auth';

/**
 * Get JWT token from localStorage
 */
const getToken = () => {
    return localStorage.getItem('jwt_token');
};

/**
 * Handle API response and extract result or throw error
 */
const handleResponse = async (response) => {
    // Clone response to read it multiple times if needed
    const responseClone = response.clone();
    
    // Parse JSON response
    let data;
    try {
        // Read response as text first, then parse
        const text = await response.text();
        console.log('Response text:', text);
        
        if (!text || text.trim() === '') {
            throw new Error('Empty response from server');
        }
        
        data = JSON.parse(text);
        console.log('Parsed response data:', data);
    } catch (e) {
        // If response is not JSON, use clone to get text
        try {
            const text = await responseClone.text();
            console.error('Failed to parse JSON, response text:', text);
            throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
        } catch (textError) {
            console.error('Failed to get response text:', textError);
            throw new Error(`Invalid response from server: HTTP ${response.status} - ${e.message}`);
        }
    }
    
    // Check if response is ok (status 200-299)
    if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('API error response:', {
            status: response.status,
            code: data.code,
            message: errorMessage,
            data: data,
        });
        const error = new Error(errorMessage);
        error.code = data.code;
        error.status = response.status;
        throw error;
    }
    
    // Check if response has success code
    if (data.code === 1000) {
        console.log('API success response:', data);
        return data;
    }
    
    // Handle error response with code (even if status is 200)
    const errorMessage = data.message || data.error || 'An error occurred';
    console.error('API error (status 200 but code not 1000):', {
        code: data.code,
        message: errorMessage,
        data: data,
    });
    const error = new Error(errorMessage);
    error.code = data.code;
    error.status = response.status;
    throw error;
};

/**
 * Make API request to auth service
 */
const apiRequest = async (endpoint, options = {}, requireAuth = false) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (requireAuth) {
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }
        headers['Authorization'] = `Bearer ${token}`;
        console.log('API Request with auth:', {
            endpoint: `${AUTH_BASE_URL}${endpoint}`,
            method: options.method || 'GET',
            hasToken: !!token,
            tokenLength: token.length,
            tokenPreview: token.substring(0, 20) + '...',
        });
    }

    const config = {
        method: options.method || 'GET',
        headers,
        mode: 'cors',
        ...options,
    };

    if (options.body) {
        config.body = typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body);
        console.log('Request body:', config.body);
    }

    console.log('Making API request:', {
        url: `${AUTH_BASE_URL}${endpoint}`,
        method: config.method,
        headers: Object.keys(config.headers),
        hasBody: !!config.body,
        bodyPreview: config.body ? config.body.substring(0, 200) : null,
    });
    
    const response = await fetch(`${AUTH_BASE_URL}${endpoint}`, config);
    
    console.log('API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
    });
    
    return handleResponse(response);
};

// ============================================================================
// Authentication APIs
// ============================================================================

/**
 * Login - Đăng nhập
 * API: POST http://localhost:8080/auth/auth/token
 * Request: { username: string, password: string }
 * Response: { code: 1000, result: { token: string, authenticated: boolean } }
 */
export const login = async (username, password) => {
    const response = await apiRequest('/auth/token', {
        method: 'POST',
        body: { username, password },
    }, false);
    return response.result;
};

/**
 * Logout - Đăng xuất
 */
export const logout = async (token = null) => {
    const tokenToLogout = token || getToken();
    if (!tokenToLogout) {
        return null;
    }
    const response = await apiRequest('/auth/logout', {
        method: 'POST',
        body: { token: tokenToLogout },
    }, false);
    return response.result;
};

// ============================================================================
// User APIs
// ============================================================================

/**
 * Create User - Tạo user mới
 * API: POST http://localhost:8080/auth/users
 * Request: { username: string, password: string, firstName?: string, lastName?: string, email?: string, phone?: string, dob?: string }
 * Response: { code: 1000, result: { ...userInfo } }
 */
export const createUser = async (userData) => {
    const response = await apiRequest('/users', {
        method: 'POST',
        body: userData,
    }, false);
    return response.result;
};

/**
 * Get Current User Info - Lấy thông tin user hiện tại
 */
export const getCurrentUser = async () => {
    const response = await apiRequest('/users/my-info', {}, true);
    return response.result;
};

/**
 * Update User - Cập nhật thông tin user
 * API: PUT http://localhost:8080/auth/users/{userId}
 * Request: { password?: string, firstName?: string, lastName?: string, email?: string, phone?: string, dob?: string, roles?: string[] }
 * Response: { code: 1000, result: { ...userInfo } }
 */
export const updateUser = async (userId, userData) => {
    const response = await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: userData,
    }, true);
    return response.result;
};

/**
 * Set token in localStorage
 */
export const setToken = (token) => {
    localStorage.setItem('jwt_token', token);
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
    localStorage.removeItem('jwt_token');
};

/**
 * Get stored token
 */
export const getStoredToken = () => {
    return getToken();
};

