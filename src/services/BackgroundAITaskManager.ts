import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetch } from "expo/fetch";

export interface AIRequestResponse {
  jobId: string;
  message: string;
}

export interface AIRequestData {
  type: "ai" | "suggest" | "kling" | "gemini";
  garmentImage?: string;
  jobId?: string;
  index?: number;
  requestId: string;
}

export interface TaskResult {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

// 任务标识符
const AI_REQUEST_TASK_NAME = "ai-request-background-task";

// 任务状态存储
const TASK_STATUS_KEY = "ai_task_status";
const TASK_RESULTS_KEY = "ai_task_results";

class BackgroundAITaskManager {
  private static instance: BackgroundAITaskManager;
  private taskStatusListeners: Map<string, (status: any) => void> = new Map();
  private taskResults: Map<string, TaskResult> = new Map();

  static getInstance(): BackgroundAITaskManager {
    if (!BackgroundAITaskManager.instance) {
      BackgroundAITaskManager.instance = new BackgroundAITaskManager();
    }
    return BackgroundAITaskManager.instance;
  }

  constructor() {
    this.defineTask();
    this.loadStoredResults();
  }

  /**
   * 定义后台任务
   */
  private defineTask(): void {
    TaskManager.defineTask(
      AI_REQUEST_TASK_NAME,
      async ({ data, error, executionInfo }) => {
        console.log("Background AI task started:", executionInfo);

        if (error) {
          console.error("Background task error:", error);
          return BackgroundTask.BackgroundTaskResult.Failed;
        }

        try {
          const requestData = data as AIRequestData;
          const result = await this.executeAIRequest(requestData);

          // 存储结果
          await this.storeTaskResult(result);

          console.log("Background AI task completed:", result);
          return BackgroundTask.BackgroundTaskResult.Success;
        } catch (error: any) {
          console.error("Background AI task failed:", error);

          // 存储错误结果
          const errorResult: TaskResult = {
            requestId: (data as AIRequestData).requestId,
            success: false,
            error: error.message || "Unknown error",
          };
          await this.storeTaskResult(errorResult);

          return BackgroundTask.BackgroundTaskResult.Failed;
        }
      },
    );
  }

  /**
   * 执行AI请求
   */
  private async executeAIRequest(
    requestData: AIRequestData,
  ): Promise<TaskResult> {
    const { type, garmentImage, jobId, index, requestId } = requestData;

    try {
      let result: any;

      switch (type) {
        case "ai":
          result = await this.executeAIRequestInternal(garmentImage!);
          break;
        case "suggest":
          result = await this.executeSuggestRequestInternal(jobId!, index!);
          break;
        case "kling":
          result = await this.executeKlingRequestInternal(jobId!, index!);
          break;
        case "gemini":
          result = await this.executeGeminiRequestInternal(jobId!, index!);
          break;
        default:
          throw new Error(`Unknown request type: ${type}`);
      }

      return {
        requestId,
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        requestId,
        success: false,
        error: error.message || "Request failed",
      };
    }
  }

  /**
   * 执行AI请求的具体实现
   */
  private async executeAIRequestInternal(
    garmentImage: string,
  ): Promise<AIRequestResponse> {
    const onboardingData = await AsyncStorage.getItem("onboardingData");

    if (!onboardingData) {
      throw new Error("Onboarding data not found");
    }

    const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
    if (!onboardingDataObj.fullBodyPhoto) {
      throw new Error("Full body photo not found");
    }

    const body = {
      garmentImage: garmentImage,
      onboardingData: { ...onboardingDataObj },
    };

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/openai`,
      {
        method: "POST",
        body: JSON.stringify({ body }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { jobId: result.jobId, message: result.message };
  }

  /**
   * 执行建议请求的具体实现
   */
  private async executeSuggestRequestInternal(
    jobId: string,
    index: number,
  ): Promise<AIRequestResponse> {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/suggest`,
      {
        method: "POST",
        body: JSON.stringify({ jobId, index }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { jobId: result.jobId, message: result.message };
  }

  /**
   * 执行Kling请求的具体实现
   */
  private async executeKlingRequestInternal(
    jobId: string,
    index: number,
  ): Promise<string> {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/kling`,
      {
        method: "POST",
        body: JSON.stringify({ jobId, index }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * 执行Gemini请求的具体实现
   */
  private async executeGeminiRequestInternal(
    jobId: string,
    index: number,
  ): Promise<string[]> {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/gemini`,
      {
        method: "POST",
        body: JSON.stringify({ jobId, index }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * 注册后台任务
   */
  async registerBackgroundTask(): Promise<void> {
    try {
      const status = await BackgroundTask.getStatusAsync();
      if (status === BackgroundTask.BackgroundTaskStatus.Available) {
        // 不设置 minimumInterval，这样就不会成为定时任务
        // 任务只会在手动触发时执行
        await BackgroundTask.registerTaskAsync(AI_REQUEST_TASK_NAME, {
          //   stopOnTerminate: false,
          //   startOnBoot: false, // 不在启动时自动执行
        });
        console.log("Background AI task registered successfully");
      } else {
        console.warn("Background tasks are not available");
      }
    } catch (error) {
      console.error("Failed to register background task:", error);
    }
  }

  /**
   * 取消注册后台任务
   */
  async unregisterBackgroundTask(): Promise<void> {
    try {
      await BackgroundTask.unregisterTaskAsync(AI_REQUEST_TASK_NAME);
      console.log("Background AI task unregistered successfully");
    } catch (error) {
      console.error("Failed to unregister background task:", error);
    }
  }

  /**
   * 提交AI请求到后台任务
   */
  async submitAIRequest(
    type: "ai" | "suggest" | "kling" | "gemini",
    garmentImage?: string,
    jobId?: string,
    index?: number,
  ): Promise<string> {
    const requestId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const requestData: AIRequestData = {
      type,
      garmentImage,
      jobId,
      index,
      requestId,
    };

    // 存储请求数据
    await this.storeRequestData(requestId, requestData);

    // 触发后台任务
    await this.triggerBackgroundTask(requestData);

    return requestId;
  }

  /**
   * 触发后台任务
   */
  private async triggerBackgroundTask(
    requestData: AIRequestData,
  ): Promise<void> {
    try {
      // 在开发模式下，我们可以手动触发任务
      if (__DEV__) {
        await BackgroundTask.triggerTaskWorkerForTestingAsync();
      }

      // 更新任务状态
      await this.updateTaskStatus(requestData.requestId, {
        status: "submitted",
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to trigger background task:", error);
      throw error;
    }
  }

  /**
   * 存储请求数据
   */
  private async storeRequestData(
    requestId: string,
    data: AIRequestData,
  ): Promise<void> {
    try {
      const key = `ai_request_${requestId}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to store request data:", error);
    }
  }

  /**
   * 存储任务结果
   */
  private async storeTaskResult(result: TaskResult): Promise<void> {
    try {
      this.taskResults.set(result.requestId, result);

      // 持久化存储
      const results = Array.from(this.taskResults.entries());
      await AsyncStorage.setItem(TASK_RESULTS_KEY, JSON.stringify(results));

      // 通知监听器
      this.notifyStatusListeners(result.requestId, result);
    } catch (error) {
      console.error("Failed to store task result:", error);
    }
  }

  /**
   * 加载存储的结果
   */
  private async loadStoredResults(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TASK_RESULTS_KEY);
      if (stored) {
        const results = JSON.parse(stored) as [string, TaskResult][];
        this.taskResults = new Map(results);
      }
    } catch (error) {
      console.error("Failed to load stored results:", error);
    }
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(
    requestId: string,
    status: any,
  ): Promise<void> {
    try {
      const key = `${TASK_STATUS_KEY}_${requestId}`;
      await AsyncStorage.setItem(key, JSON.stringify(status));

      // 通知监听器
      this.notifyStatusListeners(requestId, status);
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  }

  /**
   * 获取任务结果
   */
  async getTaskResult(requestId: string): Promise<TaskResult | null> {
    return this.taskResults.get(requestId) || null;
  }

  /**
   * 监听任务状态
   */
  onTaskStatusChange(
    requestId: string,
    callback: (status: any) => void,
  ): () => void {
    this.taskStatusListeners.set(requestId, callback);

    // 返回取消监听的函数
    return () => {
      this.taskStatusListeners.delete(requestId);
    };
  }

  /**
   * 通知状态监听器
   */
  private notifyStatusListeners(requestId: string, status: any): void {
    const listener = this.taskStatusListeners.get(requestId);
    if (listener) {
      listener(status);
    }
  }

  /**
   * 清理过期的任务结果
   */
  async cleanupExpiredResults(
    maxAge: number = 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [requestId, result] of this.taskResults.entries()) {
      // 假设结果中包含时间戳，这里需要根据实际情况调整
      if (now - (result as any).timestamp > maxAge) {
        expiredIds.push(requestId);
      }
    }

    for (const id of expiredIds) {
      this.taskResults.delete(id);
    }

    if (expiredIds.length > 0) {
      const results = Array.from(this.taskResults.entries());
      await AsyncStorage.setItem(TASK_RESULTS_KEY, JSON.stringify(results));
    }
  }
}

export const backgroundAITaskManager = BackgroundAITaskManager.getInstance();
