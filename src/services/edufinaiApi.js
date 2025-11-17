/**
 * EduFinAI Service API
 * Base URL: http://localhost:8080
 */

const EDUFINAI_BASE_URL = 'http://localhost:8080';

/**
 * Make API request to EduFinAI service
 */
const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
    const response = await fetch(`${EDUFINAI_BASE_URL}${endpoint}`, config);

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

/**
 * Chat API
 */

/**
 * Ask a question to the AI advisor
 * @param {string} question - The question to ask
 * @param {string} userId - Optional user ID (defaults to "anonymous")
 * @param {string} conversationId - Optional conversation ID to continue existing conversation
 * @returns {Promise<Object>} Response with answer, tips, disclaimers, and conversationId
 */
export const askQuestion = async (question, userId = null, conversationId = null) => {
  if (!question || question.trim() === '') {
    throw new Error('Question cannot be blank');
  }

  const body = {
    question: question.trim(),
  };

  if (userId) {
    body.userId = userId;
  }

  if (conversationId) {
    body.conversationId = conversationId;
  }

  console.log('[EduFinAI API] Sending request:', {
    endpoint: '/api/chat/ask',
    body,
  });

  const response = await apiRequest('/api/chat/ask', {
    method: 'POST',
    body,
  });

  console.log('[EduFinAI API] Raw response received:', response);

  // API trả về answerJson là một JSON string, cần parse
  // Format: { "answer": "...", "tips": [...], "disclaimers": [...] }
  // Có thể chứa markdown code block như ```json ... ```
  let parsedAnswer = null;
  try {
    let jsonString = response.answerJson;
    
    // Nếu là string, xử lý markdown code block nếu có
    if (typeof jsonString === 'string' && jsonString.trim() !== '') {
      // Loại bỏ markdown code block nếu có (```json ... ``` hoặc ``` ... ```)
      jsonString = jsonString.trim();
      if (jsonString.startsWith('```')) {
        // Tìm và loại bỏ opening và closing code block
        const lines = jsonString.split('\n');
        const startIndex = lines[0].startsWith('```') ? 1 : 0;
        const endIndex = lines[lines.length - 1].trim().endsWith('```') ? lines.length - 1 : lines.length;
        jsonString = lines.slice(startIndex, endIndex).join('\n').trim();
      }
      
      // Parse JSON
      parsedAnswer = JSON.parse(jsonString);
      console.log('[EduFinAI API] Parsed answerJson:', parsedAnswer);
    } else if (typeof response.answerJson === 'object' && response.answerJson !== null) {
      // Nếu đã là object rồi thì dùng luôn
      parsedAnswer = response.answerJson;
    }
  } catch (e) {
    console.error('[EduFinAI API] Failed to parse answerJson:', e);
    console.error('[EduFinAI API] Raw answerJson value:', response.answerJson);
    // Nếu parse thất bại, parsedAnswer vẫn là null
    parsedAnswer = null;
  }

  // Helper function để lọc bỏ các giá trị rỗng trong array
  const filterEmptyArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => {
      if (typeof item === 'string') {
        return item.trim() !== '';
      }
      return item != null && item !== '';
    });
  };

  // Helper function để lọc bỏ string rỗng
  const filterEmptyString = (str) => {
    if (typeof str !== 'string') return '';
    const trimmed = str.trim();
    return trimmed !== '' ? trimmed : '';
  };

  // Trả về response với các field đã được parse và lọc
  let result = {
    ...response,
    // Lấy answer từ parsedAnswer nếu có
    answer: parsedAnswer?.answer ? filterEmptyString(parsedAnswer.answer) : '',
    // Lọc tips: chỉ giữ lại các item không rỗng
    tips: parsedAnswer?.tips ? filterEmptyArray(parsedAnswer.tips) : [],
    // Lọc disclaimers: chỉ giữ lại các item không rỗng
    disclaimers: parsedAnswer?.disclaimers ? filterEmptyArray(parsedAnswer.disclaimers) : [],
    // Giữ nguyên raw answerJson để debug
    rawAnswerJson: response.answerJson,
  };
  
  // Nếu parse thất bại và không có dữ liệu hợp lệ, thử fallback
  if (!result.answer && result.tips.length === 0 && result.disclaimers.length === 0) {
    console.warn('[EduFinAI API] Warning: Could not parse answerJson, trying fallback');
    
    // Fallback: Nếu answerJson là string và không phải JSON, dùng nó như answer
    if (typeof response.answerJson === 'string' && response.answerJson.trim() !== '') {
      const trimmed = response.answerJson.trim();
      // Nếu không phải JSON format (không bắt đầu bằng { hoặc [), dùng như text thuần
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('```')) {
        console.log('[EduFinAI API] Using answerJson as plain text fallback');
        result.answer = trimmed;
      } else {
        // Nếu là JSON string nhưng parse thất bại, log chi tiết
        console.error('[EduFinAI API] Failed to parse answerJson:', {
          rawValue: response.answerJson,
          length: response.answerJson?.length,
          firstChars: response.answerJson?.substring(0, 100),
        });
      }
    }
  }

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
    ? `/api/chat/conversations?userId=${encodeURIComponent(userId)}`
    : '/api/chat/conversations';

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

  const response = await apiRequest(`/api/chat/conversations/${conversationId}`);
  
  // Process messages to format them properly
  if (response.messages && Array.isArray(response.messages)) {
    response.messages = response.messages.map(msg => {
      // Parse answerJson if it exists
      let parsedAnswer = null;
      if (msg.answerJson) {
        try {
          let jsonString = msg.answerJson;
          if (typeof jsonString === 'string' && jsonString.trim() !== '') {
            jsonString = jsonString.trim();
            if (jsonString.startsWith('```')) {
              const lines = jsonString.split('\n');
              const startIndex = lines[0].startsWith('```') ? 1 : 0;
              const endIndex = lines[lines.length - 1].trim().endsWith('```') ? lines.length - 1 : lines.length;
              jsonString = lines.slice(startIndex, endIndex).join('\n').trim();
            }
            parsedAnswer = JSON.parse(jsonString);
          }
        } catch (e) {
          console.error('[EduFinAI API] Failed to parse message answerJson:', e);
        }
      }

      // Format message content like in askQuestion
      let fullContent = '';
      const answer = parsedAnswer?.answer || msg.answer || '';
      const tips = parsedAnswer?.tips || msg.tips || [];
      const disclaimers = parsedAnswer?.disclaimers || msg.disclaimers || [];

      if (answer) {
        fullContent += answer;
      }

      if (tips.length > 0) {
        if (fullContent && !fullContent.endsWith('.') && !fullContent.endsWith('!') && !fullContent.endsWith('?')) {
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

      return {
        ...msg,
        content: fullContent.trim() || answer,
        formattedContent: fullContent.trim(),
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

  const response = await apiRequest(`/api/chat/conversations/${conversationId}`, {
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
    ? `/api/reports/daily?date=${date}`
    : '/api/reports/daily';

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
  return apiRequest('/api/reports/daily/generate', {
    method: 'POST',
  });
};
