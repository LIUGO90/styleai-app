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
      console.log("ℹ️ [AppInit] 应用服务已初始化，跳过");
      return;
    }

    try {
      console.log("🚀 [AppInit] 开始初始化应用服务...");

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

      // 3. 启动订阅调度器
      try {
        console.log("📦 [AppInit] 正在启动订阅调度器...");
        subscriptionScheduler.startDailyCheck();
        console.log("✅ [AppInit] 订阅调度器已启动");
      } catch (error: any) {
        console.warn("⚠️ [AppInit] 订阅调度器启动失败:", error?.message || error);
      }

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
}

export const appInitializationService = AppInitializationService.getInstance();
