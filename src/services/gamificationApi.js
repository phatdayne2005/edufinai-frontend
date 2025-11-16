/**
 * Gamification Service API
 * Base URL: http://localhost:8080/gamification (via Gateway)
 */

const GATEWAY_BASE_URL = 'http://localhost:8080/gamification';

/**
 * Get JWT token from localStorage
 */
const getToken = () => {
    return localStorage.getItem('jwt_token');
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
    }

    const response = await fetch(`${GATEWAY_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({
            message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.message || errorData.error || `Request failed: ${response.status}`);
    }

    return response.json();
};

/**
 * Leaderboard API
 */

/**
 * Get leaderboard by type
 * @param {string} type - Leaderboard type: DAILY, WEEKLY, MONTHLY, ALLTIME
 * @param {number} topNumber - Number of top users to fetch (default: 10)
 * @returns {Promise<Array>} Array of leaderboard entries
 */
export const getLeaderboard = async (type = 'ALLTIME', topNumber = 10) => {
    const response = await apiRequest(`/leaderboard/${type.toUpperCase()}/${topNumber}`);
    return response.result || [];
};

/**
 * Get current user's leaderboard position
 * @param {string} type - Leaderboard type: DAILY, WEEKLY, MONTHLY, ALLTIME
 * @returns {Promise<Object>} User's position and score
 */
export const getMyLeaderboardPosition = async (type = 'ALLTIME') => {
    return apiRequest(`/leaderboard/${type.toUpperCase()}/me`);
};

/**
 * Challenge API
 */

/**
 * Get all challenges
 * @returns {Promise<Array>} Array of challenges
 */
export const getChallenges = async () => {
    return apiRequest('/challenge');
};

/**
 * Create a new challenge (admin only)
 * @param {Object} challengeData - Challenge data
 * @returns {Promise<Object>} Created challenge info
 */
export const createChallenge = async (challengeData) => {
    return apiRequest('/challenge', {
        method: 'POST',
        body: challengeData,
    });
};

/**
 * Delete a challenge (admin only)
 * @param {string} challengeId - Challenge ID
 * @returns {Promise<Object>} Deletion status
 */
export const deleteChallenge = async (challengeId) => {
    return apiRequest(`/challenge/${challengeId}`, {
        method: 'DELETE',
    });
};

/**
 * Reward API
 */

/**
 * Add reward to user
 * @param {Object} rewardData - Reward data { userId, badge, score, reason? }
 * @returns {Promise<Object>} Created reward info
 */
export const addReward = async (rewardData) => {
    return apiRequest('/reward', {
        method: 'POST',
        body: rewardData,
    });
};

/**
 * Get user rewards
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User reward details
 */
export const getUserRewards = async (userId) => {
    return apiRequest(`/reward/${userId}`);
};

/**
 * Test endpoint - Get current user info from JWT
 * @returns {Promise<Object>} User info from JWT token
 */
export const getMe = async () => {
    return apiRequest('/me');
};

