import * as BackgroundFetch from 'expo-background-fetch';
import { Alert, Linking, Platform } from 'react-native';

export const requestBackgroundPermissions = async (): Promise<boolean> => {
  try {
    // 检查当前权限状态
    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Available) {

      return true;
    }

    if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      // 权限被拒绝，引导用户到设置
      Alert.alert(
        '后台权限被拒绝',
        '为了使用后台任务功能，请在设置中开启"后台应用刷新"权限',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '去设置', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }
          }
        ]
      );
      return false;
    }

    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
      Alert.alert(
        '权限受限',
        '后台任务权限受到系统限制，可能由于家长控制或企业策略',
        [{ text: '确定' }]
      );
      return false;
    }

    // 权限未知，尝试注册任务来触发权限请求
    return false;

  } catch (error) {
    console.error('检查后台权限失败:', error);
    return false;
  }
};

export const checkBackgroundPermissions = async (): Promise<{
  available: boolean;
  status: string;
  needsPermission: boolean;
}> => {
  try {
    const status = await BackgroundFetch.getStatusAsync();

    return {
      available: status === BackgroundFetch.BackgroundFetchStatus.Available,
      status: getStatusText(status),
      needsPermission: status === BackgroundFetch.BackgroundFetchStatus.Denied
    };
  } catch (error) {
    console.error('检查权限失败:', error);
    return {
      available: false,
      status: '未知',
      needsPermission: true
    };
  }
};

const getStatusText = (status: BackgroundFetch.BackgroundFetchStatus): string => {
  switch (status) {
    case BackgroundFetch.BackgroundFetchStatus.Available:
      return '可用';
    case BackgroundFetch.BackgroundFetchStatus.Denied:
      return '被拒绝';
    case BackgroundFetch.BackgroundFetchStatus.Restricted:
      return '受限';
    default:
      return '未知';
  }
};
