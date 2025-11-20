/**
 * EduFinAI Service API
 * Gateway Base URL: http://localhost:8080
 * All AI endpoints must be called under /ai/**
 */

const EDUFINAI_BASE_URL = 'http://localhost:8080';
const EDUFINAI_GATEWAY_PREFIX = '/ai';
const JWT_TOKEN_KEY = 'jwt_token';

const buildAuthHeaders = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const token = window.localStorage.getItem(JWT_TOKEN_KEY);
    if (token && token.trim() !== '') {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (error) {
    console.warn('[EduFinAI API] Unable to read JWT token from storage:', error);
  }

  return {};
};

/**
 * Make API request to EduFinAI service
 */
const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...buildAuthHeaders(),
    ...options.headers,
  };

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

  try {
    const response = await fetch(
      `${EDUFINAI_BASE_URL}${EDUFINAI_GATEWAY_PREFIX}${endpoint}`,
      config
    );

    const data = await response.json();

    // Kiểm tra nếu response có error code (ngay cả khi HTTP status là 200)
    if (data.code && data.code !== '200' && data.code !== 'OK') {
      const errorMessage = data.message || data.code || 'Unknown error';
      console.error('[EduFinAI API] Error response:', data);
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      const errorMessage = data.message || data.code || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || 'Unknown error'}`);
  }
};

const stripMarkdownCodeFence = (value = '') => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  const lines = trimmed.split('\n');
  const startIndex = lines[0].startsWith('```') ? 1 : 0;
  const endIndex = lines[lines.length - 1].trim().endsWith('```') ? lines.length - 1 : lines.length;
  return lines.slice(startIndex, endIndex).join('\n').trim();
};

const filterEmptyString = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed || '';
};

const filterStringArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item !== '');
};

const parseLegacyAnswerJson = (answerJson) => {
  try {
    if (typeof answerJson === 'string' && answerJson.trim() !== '') {
      const jsonString = stripMarkdownCodeFence(answerJson);
      return JSON.parse(jsonString);
    }
    if (answerJson && typeof answerJson === 'object') {
      return answerJson;
    }
  } catch (error) {
    console.error('[EduFinAI API] Failed to parse legacy answerJson:', error);
  }
  return null;
};

const extractAnswerSections = (payload = {}) => {
  let answer = filterEmptyString(payload.formattedContent || payload.formattedAnswer || payload.answer);
  let tips = filterStringArray(payload.tips);
  let disclaimers = filterStringArray(payload.disclaimers);

  if (!answer && tips.length === 0 && disclaimers.length === 0 && payload.answerJson) {
    const legacyParsed = parseLegacyAnswerJson(payload.answerJson);
    if (legacyParsed) {
      answer = filterEmptyString(legacyParsed.answer);
      tips = filterStringArray(legacyParsed.tips);
      disclaimers = filterStringArray(legacyParsed.disclaimers);
    } else if (typeof payload.answerJson === 'string') {
      const fallback = payload.answerJson.trim();
      if (fallback && !fallback.startsWith('{') && !fallback.startsWith('[') && !fallback.startsWith('```')) {
        answer = fallback;
      }
    }
  }

  return { answer, tips, disclaimers };
};

const buildMessageContent = ({ answer, tips, disclaimers }, fallbackText = '') => {
  let fullContent = '';

  if (answer) {
    fullContent += answer;
  }

  if (tips.length > 0) {
    if (fullContent && !/[.!?]$/.test(fullContent)) {
      fullContent += '.';
    }
    if (fullContent) {
      fullContent += '\n\n';
    }
    tips.forEach((tip, index) => {
      if (index > 0) fullContent += '\n';
      fullContent += `• ${tip}`;
    });
  }

  if (disclaimers.length > 0) {
    if (fullContent) {
      fullContent += '\n\n';
    }
    disclaimers.forEach((disclaimer, index) => {
      if (index > 0) fullContent += '\n';
      fullContent += `⚠️ ${disclaimer}`;
    });
  }

  const finalContent = fullContent.trim() || filterEmptyString(fallbackText);
  return finalContent;
};

/**
 * Chat API
 */

/**
 * Ask a question to the AI advisor
 * @param {string} question - The question to ask
 * @param {string} context - Optional context preset (SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET)
 * @param {string} userId - Optional user ID (defaults to "anonymous")
 * @param {string} conversationId - Optional conversation ID to continue existing conversation
 * @returns {Promise<Object>} Response with answer, tips, disclaimers, and conversationId
 */
export const askQuestion = async (question, userId = null, conversationId = null, context = null) => {
  const hasQuestion = typeof question === 'string' && question.trim() !== '';
  const hasContext = typeof context === 'string' && context.trim() !== '';

  if (!hasQuestion && !hasContext) {
    throw new Error('Question or context must be provided');
  }

  const body = {
    ...(hasQuestion ? { question: question.trim() } : {}),
  };

  if (hasContext) {
    body.context = context.trim();
  }

  if (userId) {
    body.userId = userId;
  }

  if (conversationId) {
    body.conversationId = conversationId;
  }

  console.log('[EduFinAI API] Sending request:', {
    endpoint: '/chat/ask',
    body,
  });

  const response = await apiRequest('/chat/ask', {
    method: 'POST',
    body,
  });

  console.log('[EduFinAI API] Raw response received:', response);

  const sections = extractAnswerSections(response);

  if (!sections.answer && sections.tips.length === 0 && sections.disclaimers.length === 0) {
    throw new Error('Không thể xử lý phản hồi từ AI. Vui lòng thử lại sau.');
  }

  const result = {
    ...response,
    ...sections,
  };

  console.log('[EduFinAI API] Final processed response:', result);
  return result;
};

/**
 * Get all conversations for a user
 * @param {string} userId - Optional user ID (defaults to "anonymous")
 * @returns {Promise<Array>} Array of conversation objects
 */
export const getUserConversations = async (userId = null) => {
  const endpoint = userId
    ? `/chat/conversations?userId=${encodeURIComponent(userId)}`
    : '/chat/conversations';

  const response = await apiRequest(endpoint);
  
  // Ensure response is an array
  return Array.isArray(response) ? response : [];
};

/**
 * Get conversation history by conversationId
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} Conversation object with messages array
 */
export const getConversationHistory = async (conversationId) => {
  if (!conversationId) {
    throw new Error('ConversationId is required');
  }

  const response = await apiRequest(`/chat/conversations/${conversationId}`);
  
  // Process messages to format them properly
  if (response.messages && Array.isArray(response.messages)) {
    response.messages = response.messages.map(msg => {
      const sections = extractAnswerSections(msg);
      const fullContent = buildMessageContent(sections, msg.content);
      return {
        ...msg,
        ...sections,
        content: fullContent,
        formattedContent: fullContent,
      };
    });
  }

  return response;
};

/**
 * Delete a conversation
 * @param {string} conversationId - The conversation ID to delete
 * @returns {Promise<Object>} Deletion result with success status
 */
export const deleteConversation = async (conversationId) => {
  if (!conversationId) {
    throw new Error('ConversationId is required');
  }

  const response = await apiRequest(`/chat/conversations/${conversationId}`, {
    method: 'DELETE',
  });

  return response;
};

/**
 * Report API
 */

/**
 * Get daily report
 * @param {string} date - Optional date in format 'yyyy-MM-dd'. If not provided, returns today's report
 * @returns {Promise<Object>} Daily report data
 */
export const getDailyReport = async (date = null) => {
  const endpoint = date
    ? `/reports/daily?date=${date}`
    : '/reports/daily';

  const response = await apiRequest(endpoint);

  // Parse sanitizedSummary if it's a string
  try {
    if (typeof response.sanitizedSummary === 'string') {
      response.sanitizedSummary = JSON.parse(response.sanitizedSummary);
    }
  } catch (e) {
    // If parsing fails, keep as is
  }

  return response;
};

/**
 * Generate daily report (trigger manual generation)
 * @returns {Promise<Object>} Generated daily report
 */
export const generateDailyReport = async () => {
  return apiRequest('/reports/daily/generate', {
    method: 'POST',
  });
};
