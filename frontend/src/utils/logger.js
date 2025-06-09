/**
 * Frontend logging utility
 * Provides structured logging with different levels and environment-based control
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    // Get environment from Vite environment variables
    this.environment = (typeof import.meta !== 'undefined' && import.meta.env?.MODE) || 'development';
    this.isDevelopment = this.environment === 'development';
    
    // Set log level based on environment
    this.logLevel = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
    
    // Override log level if specified in environment
    const envLogLevel = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOG_LEVEL);
    if (envLogLevel && LOG_LEVELS[envLogLevel.toUpperCase()] !== undefined) {
      this.logLevel = LOG_LEVELS[envLogLevel.toUpperCase()];
    }
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
    return `[${timestamp}] ${level}: ${message} ${contextStr}`.trim();
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    return LOG_LEVELS[level] <= this.logLevel;
  }

  /**
   * Log error messages
   */
  error(message, context = {}) {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', message, context));
      
      // In production, you might want to send errors to a logging service
      if (!this.isDevelopment) {
        this.sendToLoggingService('ERROR', message, context);
      }
    }
  }

  /**
   * Log warning messages
   */
  warn(message, context = {}) {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  /**
   * Log info messages
   */
  info(message, context = {}) {
    if (this.shouldLog('INFO')) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  /**
   * Log debug messages
   */
  debug(message, context = {}) {
    if (this.shouldLog('DEBUG')) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  /**
   * Log API requests
   */
  apiRequest(method, url, data = null) {
    this.debug(`API Request: ${method} ${url}`, { data });
  }

  /**
   * Log API responses
   */
  apiResponse(method, url, status, data = null) {
    const level = status >= 400 ? 'ERROR' : 'DEBUG';
    const message = `API Response: ${method} ${url} - Status: ${status}`;
    
    if (level === 'ERROR') {
      this.error(message, { status, data });
    } else {
      this.debug(message, { status, data });
    }
  }

  /**
   * Send logs to external logging service (placeholder for production)
   */
  sendToLoggingService(level, message, context) {
    // In a real application, you would send this to a logging service
    // like LogRocket, Sentry, or a custom endpoint
    
    // Example implementation:
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     level,
    //     message,
    //     context,
    //     timestamp: new Date().toISOString(),
    //     userAgent: navigator.userAgent,
    //     url: window.location.href
    //   })
    // }).catch(() => {
    //   // Silently fail if logging service is unavailable
    // });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext = {}) {
    const childLogger = Object.create(this);
    childLogger.defaultContext = { ...this.defaultContext, ...additionalContext };
    
    // Override methods to include default context
    ['error', 'warn', 'info', 'debug'].forEach(method => {
      childLogger[method] = (message, context = {}) => {
        this[method](message, { ...childLogger.defaultContext, ...context });
      };
    });
    
    return childLogger;
  }
}

// Create and export singleton instance
const logger = new Logger();

export default logger;

// Export convenience methods for direct import
export const { error, warn, info, debug, apiRequest, apiResponse } = logger;