/**
 * Finance Service API
 * Base URL: http://localhost:8080/finance (via Gateway)
 * All endpoints require JWT authentication
 */

const GATEWAY_BASE_URL = 'http://localhost:8080';
const FINANCE_PREFIX = '/finance';
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
    console.error('[Finance API] Failed to parse JSON response:', text);
    throw new Error('Không thể đọc dữ liệu từ finance service');
  }
};

const handleResponse = async (response) => {
  const data = await parseResponseBody(response);

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${GATEWAY_BASE_URL}${FINANCE_PREFIX}${endpoint}`;
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

  console.log('[Finance API] Request:', {
    url,
    method: config.method,
    hasBody: !!config.body,
  });

  const response = await fetch(url, config);
  return handleResponse(response);
};

// ============================================================================
// Balance Management APIs
// ============================================================================

/**
 * Initialize balance - Khai báo số dư ban đầu
 * POST /finance/v1/balance/initialize
 * @param {number} amount - Số dư ban đầu (phải > 0)
 * @returns {Promise<Object>} { userId, initialBalance, createdAt, updatedAt }
 */
export const initializeBalance = async (amount) => {
  if (!amount || amount <= 0) {
    throw new Error('Số dư ban đầu phải lớn hơn 0');
  }

  return apiRequest('/v1/balance/initialize', {
    method: 'POST',
    body: { amount },
  });
};

/**
 * Get current balance - Lấy số dư hiện tại
 * GET /finance/v1/balance
 * @returns {Promise<Object>} { currentBalance, initialBalance, totalIncome, totalExpense, totalWithdrawal }
 */
export const getBalance = async () => {
  return apiRequest('/v1/balance');
};

/**
 * Check if balance is initialized - Kiểm tra đã khai báo số dư ban đầu chưa
 * GET /finance/v1/balance/check-initialized
 * @returns {Promise<boolean>} true nếu đã khai báo, false nếu chưa
 */
export const checkBalanceInitialized = async () => {
  return apiRequest('/v1/balance/check-initialized');
};

// ============================================================================
// Transaction Management APIs
// ============================================================================

/**
 * Create transaction - Tạo giao dịch mới
 * POST /finance/v1/transactions
 * @param {Object} data - Transaction data
 * @param {string} data.type - "INCOME" hoặc "EXPENSE"
 * @param {number} data.amount - Số tiền
 * @param {string} data.name - Tên giao dịch
 * @param {string} data.categoryId - ID danh mục (UUID)
 * @param {string} [data.note] - Ghi chú (optional)
 * @param {string} [data.goalId] - ID mục tiêu (optional, chỉ cho INCOME)
 * @param {string} [data.transactionDate] - Ngày giao dịch (ISO 8601, optional)
 * @returns {Promise<Object>} Transaction response
 */
export const createTransaction = async (data) => {
  return apiRequest('/v1/transactions', {
    method: 'POST',
    body: data,
  });
};

/**
 * Delete transaction - Xóa giao dịch (soft delete)
 * DELETE /finance/v1/transactions/{id}
 * @param {string} id - Transaction ID (UUID)
 * @returns {Promise<void>}
 */
export const deleteTransaction = async (id) => {
  return apiRequest(`/v1/transactions/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Get recent transactions - Lấy giao dịch gần đây
 * GET /finance/v1/transactions/recent?limit={limit}
 * @param {number} [limit=5] - Số lượng giao dịch
 * @returns {Promise<Array>} Array of transactions
 */
export const getRecentTransactions = async (limit = 5) => {
  const query = limit ? `?limit=${limit}` : '';
  return apiRequest(`/v1/transactions/recent${query}`);
};

/**
 * Get transactions with pagination - Lấy danh sách giao dịch có phân trang
 * GET /finance/v1/transactions?page={page}&size={size}&startDate={startDate}&endDate={endDate}
 * @param {Object} params - Query parameters
 * @param {number} [params.page=0] - Số trang (bắt đầu từ 0)
 * @param {number} [params.size=15] - Số lượng items mỗi trang
 * @param {string} [params.startDate] - Ngày bắt đầu (ISO 8601)
 * @param {string} [params.endDate] - Ngày kết thúc (ISO 8601)
 * @returns {Promise<Object>} Paginated response { content, pageable, totalElements, totalPages, ... }
 */
export const getTransactions = async (params = {}) => {
  const { page = 0, size = 15, startDate, endDate } = params;
  const queryParams = new URLSearchParams();
  
  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  
  const query = queryParams.toString();
  return apiRequest(`/v1/transactions${query ? `?${query}` : ''}`);
};

// ============================================================================
// Category Management APIs
// ============================================================================

/**
 * Get categories - Lấy danh sách danh mục
 * GET /finance/v1/categories
 * @returns {Promise<Array>} Array of categories
 */
export const getCategories = async () => {
  return apiRequest('/v1/categories');
};

/**
 * Create category - Tạo danh mục mới
 * POST /finance/v1/categories
 * @param {string} name - Tên danh mục
 * @param {string} [type] - Loại danh mục: "INCOME", "EXPENSE", hoặc "BOTH" (mặc định: "EXPENSE")
 * @returns {Promise<Object>} Category response
 */
export const createCategory = async (name, type = 'EXPENSE') => {
  return apiRequest('/v1/categories', {
    method: 'POST',
    body: { name, type },
  });
};

/**
 * Delete category - Xóa danh mục
 * DELETE /finance/v1/categories/{id}
 * @param {string} id - Category ID (UUID)
 * @returns {Promise<void>}
 */
export const deleteCategory = async (id) => {
  return apiRequest(`/v1/categories/${id}`, {
    method: 'DELETE',
  });
};

// ============================================================================
// Goal Management APIs
// ============================================================================

/**
 * Create goal - Tạo mục tiêu mới
 * POST /finance/v1/goals
 * @param {Object} data - Goal data
 * @param {string} data.title - Tên mục tiêu
 * @param {number} data.amount - Số tiền mục tiêu
 * @param {string} data.endAt - Hạn hoàn thành (ISO 8601)
 * @param {string} [data.startAt] - Ngày bắt đầu (ISO 8601, optional)
 * @returns {Promise<Object>} Goal response
 */
export const createGoal = async (data) => {
  // Ensure amount is a number (not string)
  const payload = {
    title: data.title,
    amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
    endAt: data.endAt,
    ...(data.startAt && { startAt: data.startAt }),
  };
  
  console.log('[Finance API] Creating goal with payload:', payload);
  
  return apiRequest('/v1/goals', {
    method: 'POST',
    body: payload,
  });
};

/**
 * Get goals - Lấy danh sách mục tiêu
 * GET /finance/v1/goals
 * @returns {Promise<Array>} Array of goals
 */
export const getGoals = async () => {
  return apiRequest('/v1/goals');
};

/**
 * Confirm goal completion - Xác nhận hoàn thành mục tiêu
 * POST /finance/v1/goals/{id}/confirm-completion
 * @param {string} id - Goal ID (UUID)
 * @returns {Promise<Object>} Updated goal with status = COMPLETED
 * @description Chỉ cho phép xác nhận khi savedAmount >= amount và goal chưa COMPLETED
 */
export const confirmGoalCompletion = async (id) => {
  return apiRequest(`/v1/goals/${id}/confirm-completion`, {
    method: 'POST',
  });
};

/**
 * Withdraw from goal - Rút tiền từ mục tiêu
 * POST /finance/v1/goals/{id}/withdraw
 * @param {string} id - Goal ID (UUID)
 * @param {number} amount - Số tiền muốn rút
 * @param {string} [note] - Ghi chú (optional)
 * @returns {Promise<Object>} Withdrawal transaction
 */
export const withdrawFromGoal = async (id, amount, note = '') => {
  return apiRequest(`/v1/goals/${id}/withdraw`, {
    method: 'POST',
    body: { amount, note },
  });
};

/**
 * Delete goal - Xóa mục tiêu
 * DELETE /finance/v1/goals/{id}
 * @param {string} id - Goal ID (UUID)
 * @returns {Promise<void>}
 * @description Nếu mục tiêu có savedAmount > 0, hệ thống sẽ tự động rút toàn bộ số tiền về số dư hiện tại
 */
export const deleteGoal = async (id) => {
  return apiRequest(`/v1/goals/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Get goal transaction history - Lấy lịch sử giao dịch của mục tiêu
 * GET /finance/v1/goals/{id}/transactions
 * @param {string} id - Goal ID (UUID)
 * @returns {Promise<Object>} Goal transaction history (goal info + transactions + summary)
 */
export const getGoalTransactionHistory = async (id) => {
  if (!id) {
    throw new Error('Goal ID is required');
  }

  return apiRequest(`/v1/goals/${id}/transactions`);
};

// ============================================================================
// Summary APIs
// ============================================================================

/**
 * Get monthly summary - Lấy tổng hợp tài chính tháng hiện tại
 * GET /finance/summary/month
 * @returns {Promise<Object>} { currentBalance, monthlyIncome, monthlyExpense, savingRate }
 */
export const getMonthlySummary = async () => {
  return apiRequest('/summary/month');
};

