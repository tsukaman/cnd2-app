// Logging utilities for Cloudflare Functions

/**
 * Log levels
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

/**
 * Logger class with configurable log levels
 */
export class Logger {
  constructor(level = LogLevel.INFO, prefix = '[CND²]') {
    this.level = level;
    this.prefix = prefix;
  }
  
  /**
   * Check if should log based on level
   */
  shouldLog(level) {
    return level >= this.level;
  }
  
  /**
   * Format log message with metadata
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const levelName = this.getLevelName(level);
    
    return {
      timestamp,
      level: levelName,
      message: `${this.prefix} ${message}`,
      ...metadata,
    };
  }
  
  /**
   * Get level name
   */
  getLevelName(level) {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  }
  
  /**
   * Log debug message
   */
  debug(message, metadata = {}) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(JSON.stringify(this.formatMessage(LogLevel.DEBUG, message, metadata)));
    }
  }
  
  /**
   * Log info message
   */
  info(message, metadata = {}) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(JSON.stringify(this.formatMessage(LogLevel.INFO, message, metadata)));
    }
  }
  
  /**
   * Log warning message
   */
  warn(message, metadata = {}) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(JSON.stringify(this.formatMessage(LogLevel.WARN, message, metadata)));
    }
  }
  
  /**
   * Log error message
   */
  error(message, error = null, metadata = {}) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorInfo = error instanceof Error 
        ? {
            errorMessage: error.message,
            errorStack: error.stack,
          }
        : error 
        ? { errorData: error }
        : {};
        
      console.error(JSON.stringify(this.formatMessage(LogLevel.ERROR, message, {
        ...errorInfo,
        ...metadata,
      })));
    }
  }
  
  /**
   * Log performance metrics
   */
  metric(name, value, unit = 'ms', metadata = {}) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(JSON.stringify(this.formatMessage(LogLevel.INFO, `Metric: ${name}`, {
        metric: {
          name,
          value,
          unit,
        },
        ...metadata,
      })));
    }
  }
}

/**
 * Create logger from environment
 */
export function createLogger(env) {
  // Determine log level from environment
  let level = LogLevel.INFO;
  
  if (env.LOG_LEVEL) {
    const envLevel = env.LOG_LEVEL.toUpperCase();
    if (LogLevel[envLevel] !== undefined) {
      level = LogLevel[envLevel];
    }
  } else if (env.ENV === 'development' || env.NODE_ENV === 'development') {
    level = LogLevel.DEBUG;
  } else if (env.ENV === 'production' || env.NODE_ENV === 'production') {
    level = LogLevel.WARN;
  }
  
  return new Logger(level);
}

/**
 * Request logging middleware
 */
export async function logRequest(request, env, ctx, handler) {
  const logger = createLogger(env);
  const startTime = Date.now();
  
  // Log request
  logger.info('Request received', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  });
  
  try {
    // Execute handler
    const response = await handler();
    
    // Log response
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: request.method,
      url: request.url,
      status: response.status,
      duration,
    });
    
    // Log performance metric
    logger.metric('request_duration', duration, 'ms', {
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
    });
    
    return response;
  } catch (error) {
    // Log error
    const duration = Date.now() - startTime;
    logger.error('Request failed', error, {
      method: request.method,
      url: request.url,
      duration,
    });
    
    throw error;
  }
}