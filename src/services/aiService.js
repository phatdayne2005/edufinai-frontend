/**
 * EduFinAI Service API
 * All requests must go through the API Gateway at http://localhost:8080/ai
 */

const GATEWAY_BASE_URL = 'http://localhost:8080';
const AI_PREFIX = '/ai';
const JWT_TOKEN_KEY = 'jwt_token';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(JWT_TOKEN_KEY);
};

const buildHeaders = (extraHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extraHeaders,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('[EduFinAI] Failed to parse JSON response:', text);
    throw new Error('Không thể đọc dữ liệu từ AI service');
  }
};

const handleResponse = async (response) => {
  // Handle 401 Unauthorized - Token expired or invalid
  if (response.status === 401) {
    // Remove token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(JWT_TOKEN_KEY);
    }
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (data?.code && data.code !== 200 && data.code !== '200') {
    throw new Error(data.message || data.code || 'Đã có lỗi xảy ra');
  }

  return data;
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${GATEWAY_BASE_URL}${AI_PREFIX}${endpoint}`;
  const config = {
    method: options.method || 'GET',
    headers: buildHeaders(options.headers),
    mode: 'cors',
    ...options,
  };

  if (options.body) {
    config.body = typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  return handleResponse(response);
};

/**
 * Ask the AI advisor a question or trigger a widget context
 * @param {Object} params - Request parameters
 * @param {string} [params.question] - User's question
 * @param {string} [params.conversationId] - ID of conversation to continue
 * @param {string} [params.context] - Context preset (SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET)
 * @param {string} [params.activeConversationId] - ID of conversation user is currently viewing (for notification management)
 * @returns {Promise<Object>} AI response with answer, tips, disclaimers, etc.
 */
export const askQuestion = async ({ question, conversationId, context, activeConversationId } = {}) => {
  const payload = {};

  if (conversationId) {
    payload.conversationId = conversationId;
  }

  if (context) {
    payload.context = context;
  }

  if (question) {
    payload.question = question.trim();
  }

  if (activeConversationId) {
    payload.activeConversationId = activeConversationId;
  }

  if (!payload.question && !payload.context) {
    throw new Error('Vui lòng nhập câu hỏi hoặc chọn context');
  }

  const data = await apiRequest('/chat/ask', {
    method: 'POST',
    body: payload,
  });

  return data;
};

/**
 * Get conversations for current user
 */
export const getUserConversations = async () => {
  const conversations = await apiRequest('/chat/conversations');
  return Array.isArray(conversations) ? conversations : [];
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (conversationId) => {
  if (!conversationId) {
    throw new Error('Thiếu conversationId');
  }
  return apiRequest(`/chat/conversations/${conversationId}`);
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId) => {
  if (!conversationId) {
    throw new Error('Thiếu conversationId');
  }
  return apiRequest(`/chat/conversations/${conversationId}`, {
    method: 'DELETE',
  });
};

/**
 * Get daily report (on demand)
 */
export const getDailyReport = async (date = null) => {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const report = await apiRequest(`/reports/daily${query}`);

  if (report?.sanitizedSummary && typeof report.sanitizedSummary === 'string') {
    try {
      report.sanitizedSummary = JSON.parse(report.sanitizedSummary);
    } catch (error) {
      console.warn('[EduFinAI] sanitizedSummary is not valid JSON');
    }
  }

  return report;
};


