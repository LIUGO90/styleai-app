import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetch } from "expo/fetch";

export interface AIRequestResponse {
  jobId: string;
  message: string;
  images: string[];
}

export interface AIRequestOptions {
  onProgress?: (progress: number) => void;
  onStatusChange?: (
    status: "pending" | "processing" | "completed" | "error",
  ) => void;
}

export interface RequestTask {
  id: string;
  type: "ai" | "suggest" | "kling" | "gemini" | "chat" | "analyze" | "lookbook" | "delchat";
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
 * 通用请求方法
 */
  private async makeRequest(
    url: string,
    data: any,
    abortController: AbortController,
  ): Promise<any> {
    console.log('makeRequest called with:', { url, data });

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

    const result = await response.json();
    console.log('makeRequest response:', result);
    return result;
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
            args[1],
            options,
            abortController,
          );
          break;
        case "chat":
          result = await this.executeChatRequest(
            args[0],
            args[1],
            args[2],
            args[3],
            args[4],
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
            args[2],
            options,
            abortController,
          );
          break;
        case "analyze":
          result = await this.executeAnalyzeRequest(
            args[0],
            options,
            abortController,
          );
          break;
        case "lookbook":
          result = await this.executeLookbookRequest(
            args[0],
            args[1],
            args[2],
            args[3],
            options,
            abortController,
          );
          break;

        case "delchat":
          result = await this.executeDeleteChatRequest(
            args[0],
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

  async deleteChatRequest(
    sessionIds: string[],
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<AIRequestResponse> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `delete_chat_${Date.now()}`,
        type: "delchat",
        args: [sessionIds],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    });
  }



  aiRequestLookbook(
    userId: string,
    imageUrl: string,
    styleOptions: string[],
    numImages: number,
    options: AIRequestOptions = {},): string[] | PromiseLike<string[]> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `lookbook_${Date.now()}`,
        type: "lookbook",
        args: [userId, imageUrl, styleOptions, numImages],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    });
  }

  async chatRequest(
    userId: string,
    jobId: string,
    message: string,
    imageUrl: string[],
    sessionId: string,
    options: AIRequestOptions = {},
  ): Promise<AIRequestResponse> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `chat_${Date.now()}_${Math.random()}`,
        type: "chat",
        args: [userId, jobId, message, imageUrl, sessionId],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    });
  }
  async analyzeRequest(
    imageUrl: string,
    options: AIRequestOptions = {},
  ): Promise<AIRequestResponse> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `analyze_${Date.now()}_${Math.random()}`,
        type: "analyze",
        args: [imageUrl],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    });
  }

  /**
   * 基础AI请求
   */
  async aiRequest(
    garmentImage: string,
    occasion: string,
    options: AIRequestOptions = {},
  ): Promise<AIRequestResponse> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `ai_${Date.now()}_${Math.random()}`,
        type: "ai",
        args: [garmentImage, occasion],
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
    userId: string,
    jobId: string,
    index: number,
    options: AIRequestOptions = {},
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `gemini_${Date.now()}`,
        type: "gemini",
        args: [userId, jobId, index],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    });
  }

  /**
   * 执行Chat请求的具体实现
   */
  private async executeChatRequest(
    userId: string,
    jobId: string,
    message: string,
    imageUrl: string[],
    sessionId: string,
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<AIRequestResponse> {
    options.onProgress?.(50);
    console.log('executeChatRequest', jobId, message, sessionId,imageUrl);
    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/chat`,
      { userId, jobId, message, imageUrl, sessionId },
      abortController,
    );
    options.onProgress?.(80);
    return { jobId: response.jobId, message: response.message.text, images: response.message.images };
  }
  /**
   * 执行AI请求的具体实现
   */
  private async executeAIRequest(
    garmentImage: string,
    occasion: string,
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
      occasion: occasion,
      onboardingData: { ...onboardingDataObj },
    };

    options.onProgress?.(50);

    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/openai`,
      { body },
      abortController,
    );

    options.onProgress?.(80);

    return { jobId: response.jobId, message: response.message, images: [] };
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

    return { jobId: response.jobId, message: response.message, images: [] };
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
    userId: string,
    jobId: string,
    index: number,
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<string[]> {
    options.onStatusChange?.("processing");
    options.onProgress?.(40);
    console.log('executeGeminiRequest', userId, jobId, index);
    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/generate`,
      { userId, jobId, index },
      abortController,
    );
    console.log('executeGeminiRequest response', response);
    options.onProgress?.(80);

    return response;
  }

  /**
   * 执行分析请求的具体实现 不在使用
   * 
   */
  private async executeAnalyzeRequest(
    imageUrl: string,
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<string[]> {
    options.onStatusChange?.("processing");
    options.onProgress?.(40);
    console.log('executeAnalyzeRequest', imageUrl);
    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/gemini`,
      { imageUrl },
      abortController,
    );
    console.log('executeAnalyzeRequest response', response);
    options.onProgress?.(80);

    return response.data.analysis;
  }

  /**
   * 执行删除聊天请求的具体实现
   * 
   */
  private async executeDeleteChatRequest(
    sessionIds: string[],
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<any> {
    options.onStatusChange?.("processing");
    options.onProgress?.(40);
    console.log('executeDeleteChatRequest', sessionIds);
    const result = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/chat/delete`,
      { sessionIds },
      abortController,
    );
    console.log('executeDeleteChatRequest response', result);
    options.onProgress?.(80);
    console.log('后台批量删除会话成功:', result);
    return result;
  }


  /**
   * 执行Lookbook请求的具体实现
   */
  private async executeLookbookRequest(
    userId: string,
    imageUrl: string,
    styleOptions: string[],
    numImages: number,
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<string[]> {
    // return []
    options.onStatusChange?.("processing");
    options.onProgress?.(40);
    console.log('executeLookbookRequest', userId, imageUrl, styleOptions, numImages);
    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/lookbook`,
      { userId, imageUrl, styleOptions, numImages },
      abortController,
    );
    console.log('executeLookbookRequest response', response);
    options.onProgress?.(80);
    console.log('executeLookbookRequest response images', response);
    return response.data.images;
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
