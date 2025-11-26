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
    const response = await apiRequest('/challenge');
    return response?.result ?? response;
};

/**
 * Get challenges filtered by approval status
 * @param {string} status - PENDING | APPROVED | REJECTED
 * @returns {Promise<Array>} Challenge list
 */
export const getChallengesByStatus = async (status = 'PENDING') => {
    const response = await apiRequest(`/challenge/status/${status.toUpperCase()}`);
    return response?.result ?? response ?? [];
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
 * Update an existing challenge
 * @param {string} challengeId
 * @param {Object} challengeData
 * @returns {Promise<Object>}
 */
export const updateChallenge = async (challengeId, challengeData) => {
    return apiRequest(`/challenge/${challengeId}`, {
        method: 'PUT',
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
 * Resubmit a rejected challenge for approval
 * @param {string} challengeId
 * @returns {Promise<Object>}
 */
export const resubmitChallenge = async (challengeId) => {
    return apiRequest(`/challenge/${challengeId}/resubmit`, {
        method: 'POST',
    });
};

/**
 * Update approval status for a challenge (moderator)
 * @param {string} challengeId
 * @param {{status: 'APPROVED'|'REJECTED', note?: string}} approvalData
 * @returns {Promise<Object>}
 */
export const updateChallengeApproval = async (challengeId, approvalData) => {
    return apiRequest(`/challenge/${challengeId}/approval`, {
        method: 'PATCH',
        body: approvalData,
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
 * Get current user's rewards (from JWT token)
 * @returns {Promise<Object>} User reward details { userId, totalScore, rewardDetail[] }
 */
export const getUserRewards = async () => {
    return apiRequest('/reward');
};

/**
 * Badge API
 */

/**
 * Get current user's badges
 * @returns {Promise<Object>} Badge list response { code, result[], message }
 */
export const getMyBadges = async () => {
    return apiRequest('/badge/me');
};

/**
 * Get all badges in the system (for admin/frontend display)
 * @returns {Promise<Object>} Badge list response { code, result[], message }
 */
export const getAllBadges = async () => {
    return apiRequest('/badge');
};

/**
 * Challenge Progress API
 */

/**
 * Get progress of a specific challenge
 * @param {string} challengeId - Challenge ID
 * @returns {Promise<Object>} Challenge progress { code, result, message }
 */
export const getChallengeProgress = async (challengeId) => {
    return apiRequest(`/challenge/${challengeId}/progress`);
};

/**
 * Get active challenges for current user
 * @returns {Promise<Object>} Active challenges response { code, result[], message }
 */
export const getActiveChallenges = async () => {
    return apiRequest('/challenge/me/active');
};

/**
 * Get completed challenges for current user
 * @returns {Promise<Object>} Completed challenges response { code, result[], message }
 */
export const getCompletedChallenges = async () => {
    return apiRequest('/challenge/me/completed');
};

/**
 * Test endpoint - Get current user info from JWT
 * @returns {Promise<Object>} User info from JWT token
 */
export const getMe = async () => {
    return apiRequest('/me');
};

