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
 * Refresh Token - Gia hạn token
 * API: POST http://localhost:8080/auth/auth/refresh
 * Request: { token: string }
 */
export const refreshToken = async () => {
    const currentToken = getToken();
    if (!currentToken) return null;

    try {
        const response = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: currentToken }),
        });

        const data = await response.json();

        if (response.ok && data.code === 1000) {
            const newToken = data.result.token;
            setToken(newToken);
            return newToken;
        } else {
            console.error('Refresh token failed:', data);
            removeToken();
            return null;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        removeToken();
        return null;
    }
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
        if (typeof options.body === 'string') {
            config.body = options.body;
        } else {
            // Remove null and undefined values from body to prevent data loss
            const cleanedBody = Object.keys(options.body).reduce((acc, key) => {
                const value = options.body[key];
                // Only include non-null, non-undefined values
                if (value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});
            config.body = JSON.stringify(cleanedBody);
        }
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

    // Handle 401 Unauthorized - Attempt to refresh token
    if (response.status === 401 && requireAuth && !options._retry) {
        console.log('Token expired (401), attempting to refresh...');
        const newToken = await refreshToken();

        if (newToken) {
            console.log('Token refreshed successfully, retrying request...');
            // Retry request with new token
            const newOptions = {
                ...options,
                _retry: true,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${newToken}`,
                },
            };
            return apiRequest(endpoint, newOptions, requireAuth);
        } else {
            console.log('Token refresh failed, redirecting to login...');
            // Refresh failed, let the error propagate or handle logout
            // The handleResponse below will throw the 401 error
        }
    }

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

/**
 * Forgot Password - Quên mật khẩu
 * API: POST http://localhost:8080/auth/auth/forgot-password
 * Request: { email: string }
 */
export const forgotPassword = async (email) => {
    const response = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email },
    }, false);
    return response;
};

/**
 * Verify OTP - Xác thực OTP
 * API: POST http://localhost:8080/auth/auth/verify-otp
 * Request: { email: string, otp: string }
 */
export const verifyOtp = async (email, otp) => {
    const response = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: { email, otp },
    }, false);
    return response.result;
};

/**
 * Reset Password - Đặt lại mật khẩu
 * API: POST http://localhost:8080/auth/auth/reset-password
 * Request: { email: string, otp: string, newPassword: string }
 */
export const resetPassword = async (email, otp, newPassword) => {
    const response = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { email, otp, newPassword },
    }, false);
    return response;
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

// ============================================================================
// Admin APIs - Quản lý users (chỉ dành cho ADMIN)
// ============================================================================

/**
 * Admin - Create User with Role - Tạo user mới với role
 * API: POST http://localhost:8080/auth/users/admin/users
 * Request: { username: string, password: string, firstName?: string, lastName?: string, email?: string, phone?: string, dob?: string, role: string }
 * Role: LEARNER, CREATOR, MOD, hoặc ADMIN
 * Response: { code: 1000, result: { ...userInfo } }
 */
export const createUserWithRole = async (userData) => {
    const response = await apiRequest('/users/admin/users', {
        method: 'POST',
        body: userData,
    }, true);
    return response.result;
};

/**
 * Admin - Get All Users - Lấy danh sách tất cả users
 * API: GET http://localhost:8080/auth/users
 * Response: { code: 1000, result: [{ ...userInfo }] }
 */
export const getAllUsers = async () => {
    const response = await apiRequest('/users', {
        method: 'GET',
    }, true);
    return response.result;
};

/**
 * Admin - Get User by Id - Lấy thông tin user theo ID
 * API: GET http://localhost:8080/auth/users/{userId}
 * Response: { code: 1000, result: { ...userInfo } }
 */
export const getUserById = async (userId) => {
    const response = await apiRequest(`/users/${userId}`, {
        method: 'GET',
    }, true);
    return response.result;
};

/**
 * Admin - Update User - Cập nhật user (admin có thể cập nhật bất kỳ user nào)
 * API: PUT http://localhost:8080/auth/users/{userId}
 * Request: { password?: string, firstName?: string, lastName?: string, email?: string, phone?: string, dob?: string, roles?: string[] }
 * Note: roles phải là array, ví dụ: ["LEARNER"] hoặc ["ADMIN"]
 * Response: { code: 1000, result: { ...userInfo } }
 */
export const adminUpdateUser = async (userId, userData) => {
    // Convert role string to roles array if needed
    const updateData = { ...userData };
    if (updateData.role && !updateData.roles) {
        updateData.roles = [updateData.role];
        delete updateData.role;
    }
    const response = await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: updateData,
    }, true);
    return response.result;
};

/**
 * Admin - Delete User - Xóa user
 * API: DELETE http://localhost:8080/auth/users/{userId}
 * Response: { code: 1000, result: "User has been deleted" }
 */
export const adminDeleteUser = async (userId) => {
    const response = await apiRequest(`/users/${userId}`, {
        method: 'DELETE',
    }, true);
    return response.result;
};

