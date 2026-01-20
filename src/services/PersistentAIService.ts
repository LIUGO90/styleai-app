/**
 * 持久化 AI 服务
 * 支持 App 挂起和重启后恢复请求
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { webWorkerAIService, AIRequestOptions } from "./WebWorkerAIService";

/**
 * 请求类型
 */
// 目前支持 foryou
type RequestType = "foryou" | "lookbook" | "chat" | "analyze";

/**
 * 生成 UUID v4（符合 RFC 4122 标准）
 * 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * 其中 x 是任意十六进制数字，y 是 8、9、a 或 b
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成带类型前缀的请求 ID
 * 格式: {type}_{uuid}_{userId后8位}
 * 例如: foryou_a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5_abcd1234
 */
export function generateRequestId(type: RequestType, userId: string): string {
  const uuid = generateUUID();
  const userIdSuffix = userId.slice(-8); // 取 userId 后 8 位
  return `${type}_${uuid}_${userIdSuffix}`;
}

/**
 * 持久化请求数据结构
 */
interface PersistedRequest {
  id: string;
  type: RequestType;
  args: any[];
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status?: 'pending' | 'processing' | 'failed'; // 可选的状态字段
}

class PersistentAIService {
  private static instance: PersistentAIService;
  private readonly STORAGE_KEY = "ai_request_queue";
  private readonly MAX_QUEUE_AGE = 60 * 60 * 1000; // 1小时
  private readonly MAX_RETRIES = 3; // 最大重试次数
  private appStateSubscription: any;
  private isInitialized = false;
  private autoRestore = true; // 是否自动恢复请求
  private onRequestRestored?: (request: PersistedRequest) => void; // 恢复请求时的回调
  private requestCache: PersistedRequest[] | null = null; // 请求缓存

  static getInstance(): PersistentAIService {
    if (!PersistentAIService.instance) {
      PersistentAIService.instance = new PersistentAIService();
    }
    return PersistentAIService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 监听 App 状态变化
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange.bind(this)
    );

    // 恢复之前的请求
    await this.restoreRequests();

    this.isInitialized = true;
  }

  /**
   * 清理服务
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }

  /**
   * 处理 App 状态变化
   */
  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    if (nextAppState === "active") {
      // App 回到前台，检查待恢复的请求
      await this.restoreRequests();
    }
  }

  /**
   * 持久化请求到 AsyncStorage（带缓存）
   */
  private async persistRequest(request: PersistedRequest): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const queue: PersistedRequest[] = stored ? JSON.parse(stored) : [];

      // 检查是否已存在
      const existingIndex = queue.findIndex((r) => r.id === request.id);
      if (existingIndex >= 0) {
        queue[existingIndex] = request;
      } else {
        queue.push(request);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));

      // 更新缓存
      this.requestCache = queue;
    } catch (error) {
      console.error("❌ 持久化请求失败:", error);
      // 清除缓存以确保下次读取最新数据
      this.requestCache = null;
    }
  }

  /**
   * 从持久化存储中移除请求（带缓存）
   */
  private async removePersistedRequest(requestId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        this.requestCache = [];
        return;
      }

      const queue: PersistedRequest[] = JSON.parse(stored);
      const filtered = queue.filter((r) => r.id !== requestId);

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      
      // 更新缓存
      this.requestCache = filtered;
    } catch (error) {
      console.error("❌ 移除请求失败:", error);
      // 清除缓存
      this.requestCache = null;
    }
  }

  /**
   * 恢复持久化的请求
   */
  private async restoreRequests(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return;
      }

      const queue: PersistedRequest[] = JSON.parse(stored);
      const now = Date.now();

      // 过滤掉过期的请求
      // const validRequests = queue.filter((request) => {
      //   const age = now - request.timestamp;
      //   return age < this.MAX_QUEUE_AGE;
      // });

      // if (validRequests.length === 0) {
      //   await AsyncStorage.removeItem(this.STORAGE_KEY);
      //   console.log("🧹 所有请求已过期，已清理");
      //   return;
      // }

      // 重新提交请求
      for (const request of queue) {
        if (request.retryCount < request.maxRetries) {
          // 触发回调通知
          if (this.onRequestRestored) {
            this.onRequestRestored(request);
          }

          // 如果启用了自动恢复，则立即重新提交请求
          if (this.autoRestore) {
            this.executeRestoredRequest(request).catch(() => {});
          }
        } else {
          await this.removePersistedRequest(request.id);
        }
      }
    } catch (error) {
      console.error("❌ 恢复请求失败:", error);
    }
  }

  /**
   * 执行已恢复的请求
   */
  private async executeRestoredRequest(request: PersistedRequest): Promise<void> {
    try {
      // 增加重试计数
      request.retryCount++;
      await this.persistRequest(request);

      switch (request.type) {
        case "foryou":
          {
            const [userId, imageUrl, prompt, options] = request.args as [
              string,
              string[],
              string,
              AIRequestOptions?
            ];
            await webWorkerAIService.aiRequestForYou(
              request.id,
              userId,
              imageUrl,
              prompt,
              options || {}
            );
          }
          break;

        case "lookbook":
          {
            const [userId, imageUrl, styleOptions, numImages, options] = request.args as [
              string,
              string,
              string[],
              number,
              AIRequestOptions?
            ];
            await webWorkerAIService.aiRequestLookbook(
              userId,
              imageUrl,
              styleOptions,
              numImages,
              options || {}
            );
          }
          break;

        case "chat":
          // 如果有聊天请求类型，可以在这里添加
          break;

        case "analyze":
          // 如果有分析请求类型，可以在这里添加
          break;

        default:
          console.warn(`⚠️ 未知的请求类型: ${(request as any).type}`);
      }

      // 成功后移除持久化
      await this.removePersistedRequest(request.id);
    } catch (error) {
      // 如果已达最大重试次数，移除
      if (request.retryCount >= request.maxRetries) {
        await this.removePersistedRequest(request.id);
      }
      throw error;
    }
  }

  /**
   * 包装 ForYou 请求（带持久化）
   */
  async requestForYou(
    userId: string,
    requestId: string,
    imageUrl: string[],
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<string[]> {
    // const requestId = generateRequestId("foryou", userId);

    const persistedRequest: PersistedRequest = {
      id: requestId,
      type: "foryou",
      args: [userId, imageUrl, prompt],
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
    };

    try {
      // 持久化请求
      await this.persistRequest(persistedRequest);

      // 执行请求
      const result = await webWorkerAIService.aiRequestForYou(
        persistedRequest.id,
        userId,
        imageUrl,
        prompt,
        options
      );

      // 成功后移除持久化
      await this.removePersistedRequest(requestId);

      return result;
    } catch (error) {
      console.error(`❌ ForYou 请求失败: ${requestId}`, error);

      // 增加重试计数
      persistedRequest.retryCount++;
      await this.persistRequest(persistedRequest);

      throw error;
    }
  }

  /**
   * 包装 Lookbook 请求（带持久化）
   */
  async requestLookbook(
    userId: string,
    imageUrl: string,
    styleOptions: string[],
    numImages: number,
    options: AIRequestOptions = {}
  ): Promise<string[]> {
    const requestId = generateRequestId("lookbook", userId);
    const persistedRequest: PersistedRequest = {
      id: requestId,
      type: "lookbook",
      args: [userId, imageUrl, styleOptions, numImages],
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
    };

    try {
      await this.persistRequest(persistedRequest);

      const result = await webWorkerAIService.aiRequestLookbook(
        userId,
        imageUrl,
        styleOptions,
        numImages,
        options
      );

      await this.removePersistedRequest(requestId);

      return result;
    } catch (error) {

      persistedRequest.retryCount++;
      await this.persistRequest(persistedRequest);

      throw error;
    }
  }

  /**
   * 手动重试失败的请求
   */
  async retryFailedRequests(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const queue: PersistedRequest[] = JSON.parse(stored);

      for (const request of queue) {
        if (request.retryCount >= request.maxRetries) {
          continue;
        }

        try {
          // 根据类型重新执行
          switch (request.type) {
            case "foryou":
              await this.requestForYou.apply(this, request.args as [string, string, string[], string, AIRequestOptions]);
              break;
            case "lookbook":
              await this.requestLookbook.apply(this, request.args as [string, string, string[], number, AIRequestOptions]);
              break;
          }
            // 可以添加更多类型
        } catch (error) {
          // 重试失败，继续下一个
        }
      }
    } catch (error) {
      // 静默失败
    }
  }

  /**
   * 获取待处理的请求数量
   */
  async getPendingRequestCount(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return 0;

      const queue: PersistedRequest[] = JSON.parse(stored);
      return queue.length;
    } catch (error) {
      console.error("❌ 获取待处理请求数量失败:", error);
      return 0;
    }
  }

  /**
   * 清除所有持久化的请求
   */
  async clearAllPersistedRequests(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      // 清除缓存
      this.requestCache = [];
    } catch (error) {
      // 清除缓存
      this.requestCache = null;
    }
  }

  /**
   * 获取所有持久化的请求（带缓存）
   */
  async getAllPersistedRequests(): Promise<PersistedRequest[]> {
    try {
      // 如果有缓存，直接返回
      if (this.requestCache !== null) {
        return this.requestCache;
      }

      // 从存储读取
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        this.requestCache = [];
        return [];
      }

      const requests = JSON.parse(stored);
      this.requestCache = requests;
      return requests;
    } catch (error) {
      console.error("❌ 获取持久化请求失败:", error);
      return [];
    }
  }

  /**
   * 设置是否自动恢复请求
   */
  setAutoRestore(enabled: boolean): void {
    this.autoRestore = enabled;
  }

  /**
   * 获取自动恢复状态
   */
  isAutoRestoreEnabled(): boolean {
    return this.autoRestore;
  }

  /**
   * 设置请求恢复回调
   */
  setOnRequestRestored(callback: (request: PersistedRequest) => void): void {
    this.onRequestRestored = callback;
  }

  /**
   * 手动恢复指定的请求
   */
  async manuallyRestoreRequest(requestId: string): Promise<void> {
    try {
      const requests = await this.getAllPersistedRequests();
      const request = requests.find((r) => r.id === requestId);

      if (!request) {
        console.warn(`⚠️ 未找到请求: ${requestId}`);
        return;
      }

      if (request.retryCount >= request.maxRetries) {
        await this.removePersistedRequest(requestId);
        return;
      }

      await this.executeRestoredRequest(request);
    } catch (error) {
      console.error(`❌ 手动恢复请求失败: ${requestId}`, error);
      throw error;
    }
  }

  /**
   * 手动恢复所有待处理的请求
   */
  async manuallyRestoreAllRequests(): Promise<void> {
    try {
      const requests = await this.getAllPersistedRequests();
      const validRequests = requests.filter(
        (r) => r.retryCount < r.maxRetries
      );

      if (validRequests.length === 0) {
        return;
      }

      for (const request of validRequests) {
        try {
          await this.executeRestoredRequest(request);
        } catch (error) {
          // 继续处理下一个请求
        }
      }
    } catch (error) {
      throw error;
    }
  }
}

export const persistentAIService = PersistentAIService.getInstance();

// 导出类型供外部使用
export type { PersistedRequest };

