import { webWorkerAIService } from "./WebWorkerAIService";
import revenueCatService from "./RevenueCatService";
import * as amplitude from '@amplitude/analytics-react-native';
import { SessionReplayPlugin } from '@amplitude/plugin-session-replay-react-native';

class AppInitializationService {
  private static instance: AppInitializationService;
  private isInitialized = false;

  static getInstance(): AppInitializationService {
    if (!AppInitializationService.instance) {
      AppInitializationService.instance = new AppInitializationService();
    }
    return AppInitializationService.instance;
  }

  /**
   * 初始化应用服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {

      // 初始化 Amplitude（产品分析）
      try {
        await amplitude.init('7f0e31c0f1412366694f89231ca79125').promise;

        // 尝试添加 Session Replay 插件（可选）
        try {
          await amplitude.add(new SessionReplayPlugin()).promise;
        } catch (replayError: any) {
          // Session Replay 插件失败不影响基础分析功能
        }
      } catch (error: any) {
        // 忽略 cookie 相关错误（React Native 中正常现象）
        // 不抛出错误，允许应用继续运行
      }

      // 1. 初始化 RevenueCat（订阅管理）
      try {
        await revenueCatService.initialize();
      } catch (error: any) {
        // 不抛出错误，允许应用继续运行
      }

      // 2. Web Worker AI服务不需要特殊初始化，会在第一次使用时自动初始化

      this.isInitialized = true;

    } catch (error: any) {
      // 不抛出错误，允许应用继续启动
      this.isInitialized = false;
    }
  }

  /**
   * 清理应用服务
   */
  async cleanup(): Promise<void> {
    try {

      // 取消所有正在进行的AI请求
      webWorkerAIService.cancelAllRequests();

      this.isInitialized = false;

    } catch (error) {
      console.error("Failed to cleanup app services:", error);
    }
  }

  /**
   * 检查是否已初始化
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 设置 Amplitude 用户ID
   * 应在用户登录后调用
   */
  async setAmplitudeUserId(userId: string, userProperties?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // 先 flush 确保之前的操作完成（iOS 环境可能需要）
      await amplitude.flush().promise;

      // 设置用户ID（同步调用）
      amplitude.setUserId(userId);

      // 验证用户ID是否设置成功
      const currentUserId = amplitude.getUserId();

      if (currentUserId !== userId) {
        // 再次尝试设置
        amplitude.setUserId(userId);
      }

      // 如果有用户属性，使用 Identify 对象设置
      if (userProperties && Object.keys(userProperties).length > 0) {
        const identify = new amplitude.Identify();
        Object.keys(userProperties).forEach(key => {
          identify.set(key, userProperties[key]);
        });
        // 执行 identify 操作，等待完成
        await amplitude.identify(identify).promise;
      }

      // 再次 flush 确保用户ID和属性都已发送
      await amplitude.flush().promise;
    } catch (error: any) {
      // 静默失败
    }
  }

  /**
   * 清除 Amplitude 用户ID
   * 应在用户退出登录时调用
   */
  async clearAmplitudeUserId(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // 重置用户会话（清除用户ID和属性）
      amplitude.reset();
    } catch (error: any) {
      // 静默失败
    }
  }
}

export const appInitializationService = AppInitializationService.getInstance();
