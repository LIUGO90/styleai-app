/**
 * 全局 Toast 管理器
 * 提供在应用任何位置显示 Toast 通知的能力
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '@/components/Toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastOptions {
  message: string;
  type?: ToastType;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider 组件
 * 在应用根部使用此组件包裹整个应用
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const [action, setAction] = useState<ToastAction | undefined>();

  const showToast = useCallback((options: ToastOptions | string) => {
    if (typeof options === 'string') {
      // 简单用法：只传递消息
      setMessage(options);
      setType('success');
      setAction(undefined);
    } else {
      // 完整用法：传递所有选项
      setMessage(options.message);
      setType(options.type || 'success');
      setAction(options.action);
    }
    setVisible(true);
  }, []);

  // 注册全局 Toast 管理器
  React.useEffect(() => {
    globalToast.register(showToast);
  }, [showToast]);

  const hideToast = useCallback(() => {
    setVisible(false);
    setAction(undefined);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={visible}
        message={message}
        type={type}
        action={action}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

/**
 * 使用全局 Toast 的 Hook
 */
export function useGlobalToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useGlobalToast must be used within ToastProvider');
  }
  return context;
}

/**
 * 全局 Toast 管理器（单例模式）
 * 可以在非组件环境中使用
 */
class GlobalToastManager {
  private showToastFn: ((options: ToastOptions | string) => void) | null = null;

  /**
   * 注册显示 Toast 的函数
   * @internal 此方法由 ToastProvider 内部调用
   */
  register(showToast: (options: ToastOptions | string) => void) {
    this.showToastFn = showToast;
  }

  /**
   * 显示 Toast 通知
   * @param options Toast 选项或简单的消息字符串
   */
  show(options: ToastOptions | string) {
    if (this.showToastFn) {
      this.showToastFn(options);
    } else {
      console.warn('⚠️ GlobalToastManager: Toast 未初始化，请确保在应用根部使用了 ToastProvider');
    }
  }

  /**
   * 显示成功消息
   */
  success(message: string, action?: ToastAction) {
    this.show({ message, type: 'success', action });
  }

  /**
   * 显示错误消息
   */
  error(message: string, action?: ToastAction) {
    this.show({ message, type: 'error', action });
  }

  /**
   * 显示信息消息
   */
  info(message: string, action?: ToastAction) {
    this.show({ message, type: 'info', action });
  }

  /**
   * 显示警告消息
   */
  warning(message: string, action?: ToastAction) {
    this.show({ message, type: 'warning', action });
  }
}

// 导出单例实例
export const globalToast = new GlobalToastManager();

