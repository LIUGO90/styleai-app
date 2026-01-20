/**
 * Logger 工具类
 *
 * 统一的日志管理，支持开发模式开关和结构化日志
 *
 * 使用说明：
 * - 开发环境 (__DEV__ = true)：所有日志都会输出到控制台
 * - 生产环境 (__DEV__ = false)：只有 error 级别会输出，其他静默
 * - 可以通过 Logger.setEnabled(true) 临时开启生产环境日志（用于调试）
 *
 * @example
 * ```typescript
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('PaymentService', '开始处理支付', { productId: 'xxx' });
 * logger.info('PaymentService', '支付成功');
 * logger.warn('PaymentService', '积分余额不足');
 * logger.error('PaymentService', '支付失败', error);
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  timestamp: string;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private enabled: boolean = __DEV__;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 100; // 最多保留100条日志

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 设置是否启用日志（用于生产环境临时调试）
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 获取日志历史（用于错误上报时附带上下文）
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * 清除日志历史
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    // 保持历史记录在限制范围内
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * 格式化日志前缀
   */
  private formatPrefix(level: LogLevel, module: string): string {
    const icons: Record<LogLevel, string> = {
      debug: '🔍',
      info: '📝',
      warn: '⚠️',
      error: '❌',
    };
    return `${icons[level]} [${module}]`;
  }

  /**
   * Debug 级别日志 - 仅开发环境
   */
  debug(module: string, message: string, data?: any): void {
    const entry: LogEntry = {
      level: 'debug',
      module,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    this.addToHistory(entry);

    if (this.enabled) {
      const prefix = this.formatPrefix('debug', module);
      if (data !== undefined) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    }
  }

  /**
   * Info 级别日志 - 仅开发环境
   */
  info(module: string, message: string, data?: any): void {
    const entry: LogEntry = {
      level: 'info',
      module,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    this.addToHistory(entry);

    if (this.enabled) {
      const prefix = this.formatPrefix('info', module);
      if (data !== undefined) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    }
  }

  /**
   * Warn 级别日志 - 仅开发环境
   */
  warn(module: string, message: string, data?: any): void {
    const entry: LogEntry = {
      level: 'warn',
      module,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    this.addToHistory(entry);

    if (this.enabled) {
      const prefix = this.formatPrefix('warn', module);
      if (data !== undefined) {
        console.warn(prefix, message, data);
      } else {
        console.warn(prefix, message);
      }
    }
  }

  /**
   * Error 级别日志 - 始终输出（包括生产环境）
   *
   * 错误日志会：
   * 1. 输出到控制台（开发环境详细，生产环境简化）
   * 2. 保存到历史记录（便于错误上报时提供上下文）
   */
  error(module: string, message: string, error?: any, data?: any): void {
    const entry: LogEntry = {
      level: 'error',
      module,
      message,
      data,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error : undefined,
    };
    this.addToHistory(entry);

    const prefix = this.formatPrefix('error', module);

    if (__DEV__) {
      // 开发环境：详细输出
      console.error(prefix, message);
      if (error) {
        console.error(prefix, 'Error details:', error);
      }
      if (data) {
        console.error(prefix, 'Context:', data);
      }
    } else {
      // 生产环境：简化输出（保留错误信息便于 Crashlytics 等工具捕获）
      const errorMessage = error instanceof Error ? error.message : String(error || '');
      console.error(`[${module}] ${message}${errorMessage ? `: ${errorMessage}` : ''}`);
    }
  }

  /**
   * 创建模块专用的 logger（便于使用）
   *
   * @example
   * ```typescript
   * const log = logger.createModuleLogger('PaymentService');
   * log.debug('开始处理支付');
   * log.error('支付失败', error);
   * ```
   */
  createModuleLogger(module: string) {
    return {
      debug: (message: string, data?: any) => this.debug(module, message, data),
      info: (message: string, data?: any) => this.info(module, message, data),
      warn: (message: string, data?: any) => this.warn(module, message, data),
      error: (message: string, error?: any, data?: any) => this.error(module, message, error, data),
    };
  }
}

// 导出单例实例
export const logger = Logger.getInstance();

// 导出类型
export type { LogLevel, LogEntry };

// 默认导出
export default logger;
