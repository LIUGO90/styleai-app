/**
 * 全局 Toast 管理器
 * 基于 react-native-toast-message
 */

import React, { createContext, useContext, ReactNode } from 'react';
import ToastMessage from 'react-native-toast-message';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastOptions {
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * 自定义 Toast 组件 - 匹配设计图
 */
const CustomToast = ({ text1, text2, onPress, type = 'success', ...props }: any) => {
  console.log('🎨 CustomToast 渲染:', { text1, text2, type, onPress, hasText1: !!text1, hasText2: !!text2, allProps: props });

  const iconConfig = {
    success: { name: 'check-circle' as const, color: '#10b981' },
    error: { name: 'alert-circle' as const, color: '#ef4444' },
    info: { name: 'information' as const, color: '#3b82f6' },
    warning: { name: 'alert' as const, color: '#f59e0b' },
  };

  const icon = iconConfig[type as keyof typeof iconConfig];

  // 判断是否有有效的 onPress 函数（不是 noop 空函数）
  const hasValidOnPress = onPress && onPress.name !== 'noop' && typeof onPress === 'function';

  return (
    <TouchableOpacity
      style={styles.customToastContainer}
      onPress={hasValidOnPress ? onPress : undefined}
      activeOpacity={0.9}
    >
      <View style={styles.customToastContent}>
        {/* 左侧图标 */}
        {type == 'info' ? (
            <Image
              source={require('../../assets/wait.gif')}
              style={styles.gifIcon}
              contentFit="cover"
            />

        ) : (
          <View style={[styles.iconCircle, { borderColor: icon.color }]}>
            <MaterialCommunityIcons name={icon.name} size={24} color={icon.color} />
          </View>
        )}

        {/* 中间文本区域 */}
        <View style={styles.textContainer}>
          {text1 ? (
            <Text style={styles.mainText} numberOfLines={2}>{text1}</Text>
          ) : null}
          {text2 ? (
            <Text style={styles.subText} numberOfLines={2}>{text2}</Text>
          ) : null}
        </View>

        {/* 右侧箭头 - 仅在有有效 onPress 时显示 */}
        {hasValidOnPress && (
          <View style={styles.actionContainer}>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * 自定义 Toast 样式配置 - 现代美观设计
 */
const toastConfig = {
  success: (props: any) => <CustomToast {...props} type="success" />,
  error: (props: any) => <CustomToast {...props} type="error" />,
  info: (props: any) => <CustomToast {...props} type="info" />,
  warning: (props: any) => <CustomToast {...props} type="warning" />,
};

/**
 * Toast Provider 组件
 * 在应用根部使用此组件包裹整个应用
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (options: ToastOptions | string) => {
    if (typeof options === 'string') {
      // 简单用法：只传递消息
      ToastMessage.show({
        type: 'success',
        text1: options,
        position: 'top',
        visibilityTime: 3000,
        topOffset: Platform.OS === 'ios' ? 70 : 30,
      });
    } else {
      // 完整用法：传递所有选项
      const duration = options.duration || (options.type === 'info' ? 2000 : 3000);

      console.log('📤 ToastMessage.show 调用:', {
        type: options.type,
        text1: options.message,
        text2: options.action?.label,
        duration
      });

      ToastMessage.show({
        type: options.type || 'success',
        text1: options.message,
        text2: options.action?.label, // 使用 action label 作为副标题
        position: 'top',
        visibilityTime: duration,
        topOffset: Platform.OS === 'ios' ? 70 : 30,
        onPress: options.action?.onPress
      });
    }
  };

  const hideToast = () => {
    ToastMessage.hide();
  };

  // 注册全局 Toast 管理器
  React.useEffect(() => {
    globalToast.register(showToast);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* ToastMessage 组件必须放在最后，使用自定义配置 */}
      <ToastMessage config={toastConfig} />
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
  info(message: string, action?: ToastAction, duration?: number) {
    this.show({ message, type: 'info', action, duration });
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

/**
 * 自定义 Toast 样式
 */
const styles = StyleSheet.create({
  customToastContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 300, // 确保 flex 子元素可以正确收缩
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleInfo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    minWidth: 100, // 设置最小宽度确保文本有空间显示
    paddingVertical: 2, // 添加垂直内边距确保文本可见
  },
  mainText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000', // 使用纯黑色确保可见
    marginBottom: 2,
    lineHeight: 20,
  },
  subText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#4b5563', // 使用更深的灰色
    marginTop: 2,
    lineHeight: 18,
  },
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  gifIcon: {
    width:56,
    height:56,
    borderRadius: 28,
  },
});
