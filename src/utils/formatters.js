/**
 * Utility functions for formatting data (Vietnamese format)
 */

/**
 * Format number to Vietnamese currency format
 * Example: 200000 -> "200.000đ"
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return '0đ';
  }

  // Handle both string and number types
  let num;
  if (typeof amount === 'string') {
    // Remove any formatting (dots, commas, spaces) before parsing
    const cleaned = amount.replace(/[.,\s]/g, '');
    num = parseFloat(cleaned);
  } else {
    num = amount;
  }

  if (isNaN(num)) {
    return '0đ';
  }

  // Use Math.floor instead of Math.round to avoid rounding issues
  // For currency, we want to preserve the exact integer value
  const integerAmount = Math.floor(Math.abs(num));
  
  // Format with dot as thousand separator
  return integerAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
};

/**
 * Format date to Vietnamese format: dd/mm/yyyy HH:mm:ss
 * @param {string|Date} date - Date to format (ISO string or Date object)
 * @returns {string} Formatted date string
 */
export const formatDateTime = (date) => {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format date only (without time): dd/mm/yyyy
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Format date to ISO 8601 format for API requests
 * @param {Date} date - Date object
 * @returns {string} ISO 8601 format string (yyyy-MM-ddTHH:mm:ss)
 */
export const formatDateToISO = (date) => {
  if (!date) return null;

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Parse Vietnamese currency string to number
 * Example: "200.000đ" -> 200000
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remove "đ" and dots, then parse
  const cleaned = currencyString.replace(/đ/g, '').replace(/\./g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
};

