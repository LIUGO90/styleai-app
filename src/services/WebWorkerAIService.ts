import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetch } from "expo/fetch";

export interface AIRequestResponse {
  jobId: string;
  message: string;
}

export interface AIRequestOptions {
  onProgress?: (progress: number) => void;
  onStatusChange?: (
    status: "pending" | "processing" | "completed" | "error",
  ) => void;
}

export interface RequestTask {
  id: string;
  type: "ai" | "suggest" | "kling" | "gemini";
  args: any[];
  options: AIRequestOptions;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  abortController: AbortController;
}

class WebWorkerAIService {
  private static instance: WebWorkerAIService;
  private requestQueue: RequestTask[] = [];
  private isProcessing = false;
  private maxConcurrentRequests = 2;
  private activeRequests = 0;
  private workerId = 0;

  static getInstance(): WebWorkerAIService {
    if (!WebWorkerAIService.instance) {
      WebWorkerAIService.instance = new WebWorkerAIService();
    }
    return WebWorkerAIService.instance;
  }

  /**
   * 添加请求到队列
   */
  private addToQueue(task: RequestTask): void {
    this.requestQueue.push(task);
    this.processQueue();
  }

  /**
   * 处理请求队列 - 使用 setTimeout 模拟 Web Worker
   */
  private async processQueue(): Promise<void> {
    if (
      this.isProcessing ||
      this.activeRequests >= this.maxConcurrentRequests
    ) {
      return;
    }

    const task = this.requestQueue.shift();
    if (!task) return;

    this.isProcessing = true;
    this.activeRequests++;

    // 使用 setTimeout 将任务放到下一个事件循环中执行
    // 这样可以避免阻塞主线程
    setTimeout(async () => {
      try {
        await this.executeTask(task);
      } catch (error) {
        task.reject(error);
      } finally {
        this.activeRequests--;
        this.isProcessing = false;
        // 继续处理队列中的下一个请求
        setTimeout(() => this.processQueue(), 500);
      }
    }, 0);
  }

  /**
   * 执行具体任务
   */
  private async executeTask(task: RequestTask): Promise<void> {
    const { type, args, options, resolve, reject, abortController } = task;

    try {
      options.onStatusChange?.("pending");
      options.onProgress?.(0);

      let result: any;

      switch (type) {
        case "ai":
          result = await this.executeAIRequest(
            args[0],
            options,
            abortController,
          );
          break;
        case "suggest":
          result = await this.executeSuggestRequest(
            args[0],
            args[1],
            options,
            abortController,
          );
          break;
        case "kling":
          result = await this.executeKlingRequest(
            args[0],
            args[1],
            options,
            abortController,
          );
          break;
        case "gemini":
          result = await this.executeGeminiRequest(
            args[0],
            args[1],
            options,
            abortController,
          );
          break;
        default:
          throw new Error(`Unknown request type: ${type}`);
      }

      options.onStatusChange?.("completed");
      options.onProgress?.(100);
      resolve(result);
    } catch (error: any) {
      options.onStatusChange?.("error");
      reject(error);
    }
  }

  /**
   * 基础AI请求
   */
  async aiRequest(
    garmentImage: string,
    options: AIRequestOptions = {},
  ): Promise<AIRequestResponse> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `ai_${Date.now()}_${Math.random()}`,
        type: "ai",
        args: [garmentImage],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    });
  }

  /**
   * AI建议请求
   */
  async aiSuggest(
    jobId: string,
    index: number,
    options: AIRequestOptions = {},
  ): Promise<AIRequestResponse> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `suggest_${jobId}_${index}_${Date.now()}`,
        type: "suggest",
        args: [jobId, index],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    });
  }

  /**
   * Kling AI请求
   */
  async aiRequestKling(
    jobId: string,
    index: number,
    options: AIRequestOptions = {},
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `kling_${jobId}_${index}_${Date.now()}`,
        type: "kling",
        args: [jobId, index],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    });
  }

  /**
   * Gemini AI请求
   */
  async aiRequestGemini(
    fullBodyPhoto: string,
    garmentImage: string,
    options: AIRequestOptions = {},
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `gemini_${Date.now()}`,
        type: "gemini",
        args: [fullBodyPhoto, garmentImage],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    });
  }

  /**
   * 执行AI请求的具体实现
   */
  private async executeAIRequest(
    garmentImage: string,
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<AIRequestResponse> {
    options.onStatusChange?.("processing");
    options.onProgress?.(10);

    const onboardingData = await AsyncStorage.getItem("onboardingData");

    if (!onboardingData) {
      throw new Error("Onboarding data not found");
    }

    const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
    if (!onboardingDataObj.fullBodyPhoto) {
      throw new Error("Full body photo not found");
    }

    options.onProgress?.(30);

    const body = {
      garmentImage: garmentImage,
      onboardingData: { ...onboardingDataObj },
    };

    options.onProgress?.(50);

    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/openai`,
      { body },
      abortController,
    );

    options.onProgress?.(80);

    return { jobId: response.jobId, message: response.message };
  }

  /**
   * 执行建议请求的具体实现
   */
  private async executeSuggestRequest(
    jobId: string,
    index: number,
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<AIRequestResponse> {
    options.onStatusChange?.("processing");
    options.onProgress?.(20);

    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/suggest`,
      { jobId, index },
      abortController,
    );

    options.onProgress?.(80);

    return { jobId: response.jobId, message: response.message };
  }

  /**
   * 执行Kling请求的具体实现
   */
  private async executeKlingRequest(
    jobId: string,
    index: number,
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<string> {
    options.onStatusChange?.("processing");
    options.onProgress?.(30);

    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/kling`,
      { jobId, index },
      abortController,
    );

    options.onProgress?.(80);

    return response.data;
  }

  /**
   * 执行Gemini请求的具体实现
   */
  private async executeGeminiRequest(
    fullBodyPhoto: string,
    garmentImage: string,
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<string[]> {
    options.onStatusChange?.("processing");
    options.onProgress?.(40);

    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/gemini`,
      { fullBodyPhoto, garmentImage },
      abortController,
    );

    options.onProgress?.(80);

    return response.data;
  }

  /**
   * 通用请求方法
   */
  private async makeRequest(
    url: string,
    data: any,
    abortController: AbortController,
  ): Promise<any> {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      signal: abortController.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 取消所有请求
   */
  cancelAllRequests(): void {
    this.requestQueue.forEach((task) => {
      task.abortController.abort();
      task.reject(new Error("Request cancelled"));
    });
    this.requestQueue = [];
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): { queueLength: number; activeRequests: number } {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests,
    };
  }
}

export const webWorkerAIService = WebWorkerAIService.getInstance();
