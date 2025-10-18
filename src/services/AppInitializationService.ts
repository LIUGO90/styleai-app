import { webWorkerAIService } from "./WebWorkerAIService";
import revenueCatService from "./RevenueCatService";
import subscriptionScheduler from "./SubscriptionScheduler";

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
      console.log("ℹ️ 应用服务已初始化，跳过");
      return;
    }

    try {
      console.log("🚀 开始初始化应用服务...");

      // 1. 初始化 RevenueCat（订阅管理）
      try {
        await revenueCatService.initialize();
        console.log("✅ RevenueCat 初始化成功");
      } catch (error) {
        console.warn("⚠️ RevenueCat 初始化失败（应用将继续运行，但订阅功能不可用）:", error);
        // 不抛出错误，允许应用继续运行
      }

      // 2. Web Worker AI服务不需要特殊初始化
      // 它会在第一次使用时自动初始化

      // 3. 启动订阅调度器
      try {
        subscriptionScheduler.startDailyCheck();
        console.log("✅ 订阅调度器已启动");
      } catch (error) {
        console.warn("⚠️ 订阅调度器启动失败:", error);
      }

      this.isInitialized = true;
      console.log("✅ 应用服务初始化完成");

    } catch (error) {
      console.error("❌ 应用服务初始化失败:", error);
      throw error;
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
}

export const appInitializationService = AppInitializationService.getInstance();
