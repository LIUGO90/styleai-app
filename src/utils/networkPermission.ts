import { Alert, Platform, Linking } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * 检查网络连接状态
 */
export const checkNetworkConnection = async (): Promise<{
  isConnected: boolean;
  isInternetReachable: boolean | null;
  canMakeRequests: boolean;
}> => {
  try {
    const state = await NetInfo.fetch();
    
    console.log('🌐 [Network Check] 网络状态:', {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    });

    const isConnected = state.isConnected === true;
    const isInternetReachable = state.isInternetReachable;
    
    // 更宽松的网络判断：
    // - 如果 isInternetReachable 为 null（未知状态），只要设备连接了网络就认为可以尝试
    // - 只有在明确知道无法访问互联网时（isInternetReachable === false）才阻止
    const canMakeRequests = isConnected && isInternetReachable !== false;
    
    console.log('🌐 [Network Check] 判断结果:', {
      isConnected,
      isInternetReachable,
      canMakeRequests,
    });

    return {
      isConnected,
      isInternetReachable,
      canMakeRequests,
    };
  } catch (error) {
    console.error('❌ [Network Check] 检查失败:', error);
    // 网络检查失败时，宽松处理：允许尝试登录
    return {
      isConnected: true,  // 改为 true，允许用户尝试
      isInternetReachable: null,
      canMakeRequests: true,  // 改为 true，允许用户尝试
    };
  }
};

/**
 * 显示网络权限提示
 */
export const showNetworkPermissionAlert = (
  onRetry?: () => void,
  onCancel?: () => void
): void => {
  Alert.alert(
    '需要网络访问权限',
    '此应用需要网络连接才能正常使用。请确保：\n\n1. 设备已连接到互联网\n2. 应用有网络访问权限\n\n如果您拒绝网络访问，将无法登录和使用应用功能。',
    [
      {
        text: '取消',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: '去设置',
        onPress: () => {
          if (Platform.OS === 'ios') {
            // iOS 需要手动打开设置
            Alert.alert(
              '打开设置',
              '请按以下步骤操作：\n\n1. 打开"设置"应用\n2. 找到"Styla"应用\n3. 确保"蜂窝数据"和"WLAN"都已启用',
              [
                { text: '知道了' },
                {
                  text: '打开设置',
                  onPress: () => {
                    Linking.openSettings();
                  },
                },
              ]
            );
          } else {
            Linking.openSettings();
          }
        },
      },
      {
        text: '重试',
        onPress: onRetry,
      },
    ]
  );
};

/**
 * 在登录前请求网络权限
 * @returns Promise<boolean> - true 表示有网络权限，可以继续登录；false 表示没有权限，阻止登录
 */
export const requestNetworkPermissionForLogin = async (retryCount: number = 0): Promise<boolean> => {
  // 🚨 临时完全禁用网络检查，直接允许登录
  console.log('⚠️ [Login Network Check] 网络检查已禁用，直接允许登录');
  return Promise.resolve(true);
  
  /* 暂时注释掉网络检查逻辑
  const MAX_RETRIES = 3; // 最大重试次数
  
  // 临时禁用网络检查（开发调试用）
  if (typeof window !== 'undefined' && (window as any).tempDisableNetworkCheck) {
    console.log('⚠️ 网络检查已临时禁用');
    return Promise.resolve(true);
  }
  
  return new Promise(async (resolve) => {
    console.log(`🔍 [Login Network Check] 开始检查网络状态 (重试次数: ${retryCount})`);
    
    // 首先检查网络状态
    let networkStatus;
    try {
      networkStatus = await checkNetworkConnection();

      if (networkStatus.canMakeRequests) {
        // 网络正常，允许登录
        console.log('✅ [Login Network Check] 网络状态正常，可以继续登录');
        resolve(true);
        return;
      }
      
      // 如果 isInternetReachable 为 null（未知状态），也允许尝试
      if (networkStatus.isConnected && networkStatus.isInternetReachable === null) {
        console.log('⚠️ [Login Network Check] 网络状态未知，但设备已连接，允许尝试登录');
        resolve(true);
        return;
      }
    } catch (error) {
      console.error('❌ [Login Network Check] 网络检查失败:', error);
      // 网络检查失败时，仍然允许登录（避免阻塞）
      console.log('⚠️ [Login Network Check] 检查失败，允许用户尝试登录');
      resolve(true);
      return;
    }

    // 网络不可用，显示提示
    const getMessage = () => {
      if (!networkStatus?.isConnected) {
        return '设备未连接到网络。请连接 WiFi 或移动数据后重试。';
      } else if (networkStatus?.isInternetReachable === false) {
        return '无法访问互联网。请检查您的网络设置。';
      } else {
        return '网络连接异常。请检查您的网络设置或应用权限。';
      }
    };

    const buttonText = retryCount >= MAX_RETRIES ? '确定' : '重试';
    
    Alert.alert(
      '需要网络连接',
      getMessage() + '\n\n没有网络连接将无法登录。',
      [
        {
          text: '取消登录',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: '去设置',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openSettings();
            } else {
              Linking.openSettings();
            }
            resolve(false); // 即使打开设置，本次登录也取消
          },
        },
        {
          text: buttonText,
          onPress: async () => {
            if (retryCount >= MAX_RETRIES) {
              // 达到最大重试次数，停止递归
              resolve(false);
            } else {
              // 递归重试，增加重试计数
              const canLogin = await requestNetworkPermissionForLogin(retryCount + 1);
              resolve(canLogin);
            }
          },
        },
      ],
      { cancelable: false } // 防止点击外部关闭
    );
  });
  */
};

/**
 * 持续监听网络状态变化
 */
export const setupNetworkListener = (
  onNetworkAvailable: () => void,
  onNetworkUnavailable: () => void
) => {
  const unsubscribe = NetInfo.addEventListener((state) => {

    const canMakeRequests = state.isConnected === true && state.isInternetReachable !== false;

    if (canMakeRequests) {
      onNetworkAvailable();
    } else {
      onNetworkUnavailable();
    }
  });

  return unsubscribe;
};

