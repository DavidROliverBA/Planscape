// Simple logging utility for observability during development
// All logs go to browser console with structured formatting

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LOG_COLORS = {
  debug: '#888888',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
};

const LOG_ICONS = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

function formatTimestamp(): string {
  return new Date().toISOString().split('T')[1].slice(0, 12);
}

// Utility for formatting context - exported for potential future use
export function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return '';
  try {
    return JSON.stringify(context, null, 2);
  } catch {
    return String(context);
  }
}

function log(
  level: LogLevel,
  module: string,
  message: string,
  context?: LogContext,
) {
  const timestamp = formatTimestamp();
  const icon = LOG_ICONS[level];
  const color = LOG_COLORS[level];

  const prefix = `%c${icon} [${timestamp}] [${module}]`;
  const style = `color: ${color}; font-weight: bold;`;

  if (context && Object.keys(context).length > 0) {
    console.groupCollapsed(`${prefix} ${message}`, style);
    console.log('%cContext:', 'color: #666; font-weight: bold;', context);
    console.groupEnd();
  } else {
    console.log(`${prefix} ${message}`, style);
  }

  // Also store in window for debugging access
  if (typeof window !== 'undefined') {
    const logs = ((window as unknown as { __APP_LOGS__?: unknown[] })
      .__APP_LOGS__ ??= []);
    logs.push({ timestamp, level, module, message, context });
    // Keep only last 500 logs
    if (logs.length > 500) logs.shift();
  }
}

// Create a logger for a specific module
export function createLogger(module: string) {
  return {
    debug: (message: string, context?: LogContext) =>
      log('debug', module, message, context),
    info: (message: string, context?: LogContext) =>
      log('info', module, message, context),
    warn: (message: string, context?: LogContext) =>
      log('warn', module, message, context),
    error: (message: string, context?: LogContext) =>
      log('error', module, message, context),
  };
}

// Pre-configured loggers for common modules
export const dbLogger = createLogger('DB');
export const storeLogger = createLogger('Store');
export const timelineLogger = createLogger('Timeline');
export const mutationLogger = createLogger('Mutation');

// Utility to log function entry/exit with timing
export function withLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  logger: ReturnType<typeof createLogger>,
  fnName: string,
  fn: T,
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = performance.now();
    logger.debug(`${fnName} called`, { args });
    try {
      const result = await fn(...args);
      const duration = (performance.now() - startTime).toFixed(2);
      logger.info(`${fnName} completed in ${duration}ms`, {
        args,
        result: result !== undefined ? result : '(void)',
      });
      return result;
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2);
      logger.error(`${fnName} failed after ${duration}ms`, {
        args,
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : String(error),
      });
      throw error;
    }
  }) as T;
}

// Export getLogs for debugging
export function getLogs() {
  if (typeof window !== 'undefined') {
    return (window as unknown as { __APP_LOGS__?: unknown[] }).__APP_LOGS__ ?? [];
  }
  return [];
}

// Make getLogs available globally for console access
if (typeof window !== 'undefined') {
  (window as unknown as { getLogs?: typeof getLogs }).getLogs = getLogs;
}
