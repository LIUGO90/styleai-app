import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingData } from '@/components/types';

// 全局上传监听器管理
export class GlobalUploadListener {
  private static instance: GlobalUploadListener;
  private listeners: Map<string, (imageUrl: string) => void> = new Map();
  private componentListeners: Map<string, Set<string>> = new Map(); // 组件ID -> 监听器ID集合

  static getInstance(): GlobalUploadListener {
    if (!GlobalUploadListener.instance) {
      GlobalUploadListener.instance = new GlobalUploadListener();
    }
    return GlobalUploadListener.instance;
  }

  // 添加监听器（带组件ID）
  addListener(
    messageId: string, 
    callback: (imageUrl: string) => void, 
    componentId?: string
  ): string {
    const listenerId = `${messageId}_${Date.now()}_${Math.random()}`;
    this.listeners.set(listenerId, callback);

    if (componentId) {
      if (!this.componentListeners.has(componentId)) {
        this.componentListeners.set(componentId, new Set());
      }
      this.componentListeners.get(componentId)!.add(listenerId);
    }


    return listenerId;
  }

  // 移除特定监听器
  removeListener(listenerId: string) {
    this.listeners.delete(listenerId);

  }

  // 移除组件的所有监听器
  removeComponentListeners(componentId: string) {
    const listenerIds = this.componentListeners.get(componentId);
    if (listenerIds) {
      listenerIds.forEach(listenerId => {
        this.listeners.delete(listenerId);
      });
      this.componentListeners.delete(componentId);

    }
  }

  // 处理上传完成事件
  async handleUploadComplete(messageId: string, imageUrl: string) {

    // 更新本地数据
    await this.updateLocalData(messageId, imageUrl);

    // 通知所有相关监听器
    const listenersToNotify = Array.from(this.listeners.entries())
      .filter(([listenerId, callback]) => listenerId.includes(messageId));

    listenersToNotify.forEach(([listenerId, callback]) => {
      try {
        callback(imageUrl);
        // 自动移除已触发的监听器
        this.removeListener(listenerId);
      } catch (error) {
        console.error(`Error in listener ${listenerId}:`, error);
      }
    });
  }

  // 更新本地存储数据
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
  async getPendingUpload(): Promise<any> {
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

  // 清理所有监听器
  clearAllListeners() {
    this.listeners.clear();
    this.componentListeners.clear();

  }

  // 获取监听器统计信息
  getListenerStats() {
    return {
      totalListeners: this.listeners.size,
      componentCount: this.componentListeners.size,
      listeners: Array.from(this.listeners.keys())
    };
  }
}

export const globalUploadListener = GlobalUploadListener.getInstance();
