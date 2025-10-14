import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingData, PendingUpload } from '@/components/types';

export class BackgroundUploadListener {
  private static instance: BackgroundUploadListener;
  private listeners: Map<string, (imageUrl: string) => void> = new Map();

  static getInstance(): BackgroundUploadListener {
    if (!BackgroundUploadListener.instance) {
      BackgroundUploadListener.instance = new BackgroundUploadListener();
    }
    return BackgroundUploadListener.instance;
  }

  // 监听特定消息ID的上传结果
  addListener(messageId: string, callback: (imageUrl: string) => void) {
    this.listeners.set(messageId, callback);

  }

  // 移除监听器
  removeListener(messageId: string) {
    this.listeners.delete(messageId);

  }

  // 处理上传完成事件
  async handleUploadComplete(messageId: string, imageUrl: string) {

    // 更新本地数据
    await this.updateLocalData(messageId, imageUrl);

    // 通知监听器
    const callback = this.listeners.get(messageId);
    if (callback) {
      callback(imageUrl);
      this.removeListener(messageId);
    }
  }

  // 更新本地存储的数据
  private async updateLocalData(messageId: string, imageUrl: string) {
    try {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const data: OnboardingData = JSON.parse(onboardingData);

        // 检查是否有待上传的数据
        if (data.pendingUpload && data.pendingUpload.messageId === messageId) {
          // 更新图片URL
          data.fullBodyPhoto = imageUrl;

          // 清除待上传数据
          delete data.pendingUpload;

          // 保存更新后的数据
          await AsyncStorage.setItem("onboardingData", JSON.stringify(data));


        }
      }
    } catch (error) {
      console.error('Failed to update local data:', error);
    }
  }

  // 检查是否有待上传的数据
  async hasPendingUpload(): Promise<boolean> {
    try {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const data: OnboardingData = JSON.parse(onboardingData);
        return !!data.pendingUpload;
      }
      return false;
    } catch (error) {
      console.error('Failed to check pending upload:', error);
      return false;
    }
  }

  // 获取待上传的数据
  async getPendingUpload(): Promise<PendingUpload | null> {
    try {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const data: OnboardingData = JSON.parse(onboardingData);
        return data.pendingUpload || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get pending upload:', error);
      return null;
    }
  }
}

export const backgroundUploadListener = BackgroundUploadListener.getInstance();
