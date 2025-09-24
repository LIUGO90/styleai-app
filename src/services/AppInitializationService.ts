import { webWorkerAIService } from "./WebWorkerAIService";

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
      console.log("App services already initialized");
      return;
    }

    try {
      console.log("Initializing app services...");

      // Web Worker AI服务不需要特殊初始化
      // 它会在第一次使用时自动初始化

      this.isInitialized = true;
      console.log("App services initialized successfully");
    } catch (error) {
      console.error("Failed to initialize app services:", error);
      throw error;
    }
  }

  /**
   * 清理应用服务
   */
  async cleanup(): Promise<void> {
    try {
      console.log("Cleaning up app services...");

      // 取消所有正在进行的AI请求
      webWorkerAIService.cancelAllRequests();

      this.isInitialized = false;
      console.log("App services cleaned up successfully");
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
