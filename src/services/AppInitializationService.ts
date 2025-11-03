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
      console.log("ℹ️ [AppInit] 应用服务已初始化，跳过");
      return;
    }

    try {
      console.log("🚀 [AppInit] 开始初始化应用服务...");

      // 初始化 Amplitude（产品分析）
      try {
        console.log("📦 [AppInit] 正在初始化 Amplitude...");
        // 注意：cookie 相关错误是 React Native 环境的正常现象，可以安全忽略
        // Amplitude SDK 会尝试使用 cookie，但 React Native 不支持 document.cookie
        // 这不会影响核心分析功能
        await amplitude.init('7f0e31c0f1412366694f89231ca79125').promise;
        console.log("✅ [AppInit] Amplitude 基础 SDK 初始化成功");

        // 尝试添加 Session Replay 插件（可选）
        try {
          await amplitude.add(new SessionReplayPlugin()).promise;
          console.log("✅ [AppInit] Amplitude Session Replay 插件添加成功");
        } catch (replayError: any) {
          console.warn("⚠️ [AppInit] Session Replay 插件添加失败（分析功能仍可用）");
          console.warn("⚠️ [AppInit] 错误详情:", replayError?.message || replayError);
          // 继续执行，不影响基础分析功能
        }
      } catch (error: any) {
        // 忽略 cookie 相关错误（React Native 中正常现象）
        if (error?.message?.includes('cookie') || error?.message?.includes('Cookie')) {
          console.warn("⚠️ [AppInit] Amplitude cookie 警告（可安全忽略）");
          console.warn("⚠️ [AppInit] 这是 React Native 环境的正常现象，不影响分析功能");
        } else {
          console.warn("⚠️ [AppInit] Amplitude 初始化失败（应用将继续运行，但分析功能不可用）");
          console.warn("⚠️ [AppInit] 错误详情:", error?.message || error);
        }
        // 不抛出错误，允许应用继续运行
      }

      // 1. 初始化 RevenueCat（订阅管理）
      try {
        console.log("📦 [AppInit] 正在初始化 RevenueCat...");
        await revenueCatService.initialize();
        console.log("✅ [AppInit] RevenueCat 初始化成功");
      } catch (error: any) {
        console.warn("⚠️ [AppInit] RevenueCat 初始化失败（应用将继续运行，但订阅功能不可用）");
        console.warn("⚠️ [AppInit] 错误详情:", error?.message || error);
        // 不抛出错误，允许应用继续运行
      }

      // 2. Web Worker AI服务不需要特殊初始化
      // 它会在第一次使用时自动初始化
      console.log("📦 [AppInit] Web Worker AI 服务将在首次使用时初始化");

      this.isInitialized = true;
      console.log("✅ [AppInit] 应用服务初始化完成");

    } catch (error: any) {
      console.error("❌ [AppInit] 应用服务初始化失败:", error?.message || error);
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
      console.warn("⚠️ [AppInit] Amplitude 未初始化，无法设置用户ID");
      return;
    }

    try {
      console.log(`📦 [AppInit] 设置 Amplitude 用户ID: ${userId}`);
      
      // 先设置用户ID（同步调用）
      amplitude.setUserId(userId);
      
      // 如果有用户属性，使用 Identify 对象设置
      if (userProperties && Object.keys(userProperties).length > 0) {
        const identify = new amplitude.Identify();
        Object.keys(userProperties).forEach(key => {
          identify.set(key, userProperties[key]);
        });
        // 执行 identify 操作，等待完成
        await amplitude.identify(identify).promise;
      }
      
      // 确保用户ID已设置（再次确认）
      // 注意：某些情况下需要等待 identify 完成后再发送事件
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("✅ [AppInit] Amplitude 用户ID 设置成功");
    } catch (error: any) {
      console.error("❌ [AppInit] 设置 Amplitude 用户ID 失败:", error?.message || error);
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
      console.log("📦 [AppInit] 清除 Amplitude 用户ID");
      
      // 重置用户会话（清除用户ID和属性）
      amplitude.reset();
      
      console.log("✅ [AppInit] Amplitude 用户ID 已清除");
    } catch (error: any) {
      console.error("❌ [AppInit] 清除 Amplitude 用户ID 失败:", error?.message || error);
    }
  }
}

export const appInitializationService = AppInitializationService.getInstance();
