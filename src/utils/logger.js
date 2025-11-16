/**
 * Logger utility for debugging
 * Stores logs in localStorage and allows export to file
 */

const LOG_STORAGE_KEY = 'app_debug_logs';
const MAX_LOGS = 1000; // Maximum number of log entries to keep

/**
 * Get all logs from localStorage
 */
export const getLogs = () => {
    try {
        const logsJson = localStorage.getItem(LOG_STORAGE_KEY);
        return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
        console.error('Error reading logs from localStorage:', error);
        return [];
    }
};

/**
 * Add a log entry
 * @param {string} level - Log level: 'info', 'warn', 'error', 'debug'
 * @param {string} category - Category of the log (e.g., 'login', 'api')
 * @param {any} data - Data to log
 * @param {string} message - Optional message
 */
export const addLog = (level, category, data, message = '') => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        category,
        message,
        data: typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data),
    };

    try {
        const logs = getLogs();
        logs.push(logEntry);

        // Keep only the last MAX_LOGS entries
        if (logs.length > MAX_LOGS) {
            logs.splice(0, logs.length - MAX_LOGS);
        }

        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));

        // Also log to console for immediate debugging
        const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](`[${category}]`, message || data);
    } catch (error) {
        console.error('Error saving log to localStorage:', error);
    }
};

/**
 * Clear all logs
 */
export const clearLogs = () => {
    try {
        localStorage.removeItem(LOG_STORAGE_KEY);
        console.log('Logs cleared');
    } catch (error) {
        console.error('Error clearing logs:', error);
    }
};

/**
 * Export logs to a downloadable file
 */
export const exportLogs = () => {
    try {
        const logs = getLogs();
        const logText = logs
            .map(
                (log) =>
                    `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}\n${log.data}\n${'='.repeat(80)}\n`
            )
            .join('\n');

        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `app-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('Logs exported successfully');
        return true;
    } catch (error) {
        console.error('Error exporting logs:', error);
        return false;
    }
};

/**
 * Get logs as formatted text
 */
export const getLogsAsText = () => {
    try {
        const logs = getLogs();
        return logs
            .map(
                (log) =>
                    `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}\n${log.data}\n${'='.repeat(80)}\n`
            )
            .join('\n');
    } catch (error) {
        console.error('Error getting logs as text:', error);
        return '';
    }
};

/**
 * Convenience methods
 */
export const logInfo = (category, data, message) => addLog('info', category, data, message);
export const logWarn = (category, data, message) => addLog('warn', category, data, message);
export const logError = (category, data, message) => addLog('error', category, data, message);
export const logDebug = (category, data, message) => addLog('debug', category, data, message);

