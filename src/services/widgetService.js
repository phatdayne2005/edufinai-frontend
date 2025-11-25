/**
 * Widget Service for AI Advisory Cards
 * Provides methods to get AI advice for widget cards (SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET)
 */

import { askQuestion } from './aiService';

/**
 * Get AI spending analysis for "Phân tích chi tiêu" widget
 * @returns {Promise<string>} AI answer text
 */
const getSpendingAnalysis = async () => {
  try {
    const response = await askQuestion({
      context: 'SPENDING_WIDGET',
      // No question needed - backend will generate prompt
      // No conversationId - widgets don't save history
    });
    return response?.answer || 'Chưa có dữ liệu để phân tích.';
  } catch (error) {
    if (error.message?.includes('401') || error.message?.includes('hết hạn')) {
      // Token expired - will be handled by aiService (redirect to login)
      throw error;
    }
    console.error('[Widget Service] Error getting spending analysis:', error);
    throw new Error('Không thể tải phân tích chi tiêu. Vui lòng thử lại sau.');
  }
};

/**
 * Get AI saving suggestions for "Gợi ý tiết kiệm" widget
 * @returns {Promise<string>} AI answer text
 */
const getSavingSuggestions = async () => {
  try {
    const response = await askQuestion({
      context: 'SAVING_WIDGET',
    });
    return response?.answer || 'Chưa có dữ liệu để đưa ra gợi ý.';
  } catch (error) {
    if (error.message?.includes('401') || error.message?.includes('hết hạn')) {
      throw error;
    }
    console.error('[Widget Service] Error getting saving suggestions:', error);
    throw new Error('Không thể tải gợi ý tiết kiệm. Vui lòng thử lại sau.');
  }
};

/**
 * Get AI next goal recommendation for "Mục tiêu tiếp theo" widget
 * @returns {Promise<string>} AI answer text
 */
const getNextGoal = async () => {
  try {
    const response = await askQuestion({
      context: 'GOAL_WIDGET',
    });
    return response?.answer || 'Chưa có dữ liệu để đề xuất mục tiêu.';
  } catch (error) {
    if (error.message?.includes('401') || error.message?.includes('hết hạn')) {
      throw error;
    }
    console.error('[Widget Service] Error getting next goal:', error);
    throw new Error('Không thể tải đề xuất mục tiêu. Vui lòng thử lại sau.');
  }
};

// Export as an object for easier usage
export const widgetService = {
  getSpendingAnalysis,
  getSavingSuggestions,
  getNextGoal,
};

// Also export individual functions for backward compatibility
export { getSpendingAnalysis, getSavingSuggestions, getNextGoal };

