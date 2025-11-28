import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetch } from "expo/fetch";
import { addImageLook, updateImageLook } from "./addLookBook";
import { supabase } from "@/utils/supabase";
import analytics from "./AnalyticsService";

export interface AIRequestResponse {
  status: string;
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
  type: "ai" | "suggest" | "gemini" | "chat" | "analyze" | "lookbook" | "delchat" | "foryou";
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
    console.log("🧐 执行请求", url, data)
    analytics.http('makeRequest', {
      url: url,
      data: data,
      source: 'web_worker_ai_service',
    });
    const access_token = await AsyncStorage.getItem("access_token");
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      signal: abortController.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
    });
    console.log("🧐 执行请求响应", response)
    if (!response.ok) {
      analytics.http('request_failed', {
        url: url,
        data: data,
        source: 'web_worker_ai_service',
      });
      throw new Error(`${response.status}`);
    }

    const result = await response.json();
    analytics.http('request_success', {
      url: url,
      data: data,
      source: 'web_worker_ai_service',
    });
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
            args[5],
            args[6],
            args[7],
            args[8],
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
        case "foryou":
          result = await this.executeForYouRequest(
            args[0],
            args[1],
            args[2],
            args[3],
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


  async checkImageExist(requestId: string) {
    const { data: user_images, error } = await supabase.from("user_images").select("image_url").eq("request_id", requestId).single();
    if (error) {
      console.log("🧐 检查图片是否存在错误", error)
      return false;
    }
    if (user_images && user_images.image_url && user_images.image_url.length > 0) {
      return true;
    }
    return false;
  }



  aiRequestForYou(requestId: string, userId: string, imageUrl: string[], prompt: string, options: AIRequestOptions = {}): string[] | PromiseLike<string[]> {
    return new Promise((resolve, reject) => {
      const task: RequestTask = {
        id: `foryou_${Date.now()}`,
        type: "foryou",
        args: [requestId, userId, imageUrl, prompt],
        options,
        resolve,
        reject,
        abortController: new AbortController(),
      };
      this.addToQueue(task);
    }).then(async (result) => {
      console.log("🧐 执行ForYou请求", result)
      if (result && (result as string[]).length > 0) {
        // 使用 Promise.all 等待所有异步操作完成，而不是 forEach
        try {
          const updatePromises = (result as string[]).map(async (imageUrl: string) => {
            try {
              console.log("🧐 更新图片到数据库", requestId, imageUrl)
              await updateImageLook(requestId, imageUrl);
              console.log("✅ 图片更新成功", requestId, imageUrl)
            } catch (error) {
              console.error(`❌ 更新图片失败 [${imageUrl}]:`, error);
              // 不抛出错误，继续处理其他图片
            }
          });
          
          // 等待所有更新操作完成
          await Promise.all(updatePromises);
          console.log(`✅ 所有图片更新完成，共 ${(result as string[]).length} 张`);
        } catch (error) {
          console.error('❌ 批量更新图片时发生错误:', error);
          // 即使更新失败，也返回结果，因为图片已经生成
        }
        return result as string[];
      }
      return [];
    }).catch((error) => {
      console.error('❌ ForYou请求处理失败:', error);
      throw error;
    });
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
    chatType: string,
    userId: string,
    bodyShape: string,
    bodySize: string,
    skinTone: string,
    stylePreferences: string,
    message: string,
    imageUrl: string[],
    sessionId: string,
    options: AIRequestOptions = {},
  ): Promise<AIRequestResponse> {
    for (var i = 0; i < 3; i++) {
      var trycount = i
      try {
        const controller = new AbortController()
        const response = await this.makeRequest(
          `${process.env.EXPO_PUBLIC_API_URL}/api/apple/chat`,
          { chatType, userId, bodyShape, bodySize, skinTone, stylePreferences, message, imageUrl, sessionId, trycount },
          controller
        );
        setTimeout(() => {
          controller.abort()
        }, 6000 * 10)
        return { status: "success", jobId: response.jobId, message: response.message.text, images: response.message.images };
      } catch (error) {
        console.log("🧐 执行Chat请求错误", error)
        if (error instanceof Error && error.message === '401') {
          return { status: "success", jobId: "", message: "unauthorized, please ask for help", images: [] };
        }
        await new Promise((resolve) => setTimeout(resolve, 3000 * (i + 1)));
      }
    }
    return { status: 'error', jobId: "", message: "request failed, please try again", images: [] };
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
    chatType: string,
    userId: string,
    bodyShape: string,
    bodySize: string,
    skinTone: string,
    stylePreferences: string,
    message: string,
    imageUrl: string[],
    sessionId: string,
    options: AIRequestOptions,
    abortController: AbortController,
  ): Promise<AIRequestResponse> {
    options.onProgress?.(50);

    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/chat`,
      { chatType, userId, bodyShape, bodySize, skinTone, stylePreferences, message, imageUrl, sessionId },
      abortController,
    );
    options.onProgress?.(80);
    return { status: response.status, jobId: response.jobId, message: response.message.text, images: response.message.images };
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

    return { status: response.status, jobId: response.jobId, message: response.message, images: [] };
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

    return { status: response.status, jobId: response.jobId, message: response.message, images: [] };
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

    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/generate`,
      { userId, jobId, index },
      abortController,
    );

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

    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/gemini`,
      { imageUrl },
      abortController,
    );

    options.onProgress?.(80);

    return response.data.analysis;
  }

  async executeForYouRequest(requestId: string, userId: string, imageUrl: string[], prompt: string, options: AIRequestOptions, abortController: AbortController): Promise<string[]> {
    options.onStatusChange?.("processing");
    options.onProgress?.(40);

    const response = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/foryou`,
      { requestId, userId, imageUrl, prompt },
      abortController,
    );

    options.onProgress?.(80);
    if (response.data.images && response.data.images.length > 0) {
      return response.data.images;
    }
    return [];
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

    const result = await this.makeRequest(
      `${process.env.EXPO_PUBLIC_API_URL}/api/apple/chat/delete`,
      { sessionIds },
      abortController,
    );

    options.onProgress?.(80);

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

    for (let i = 0; i < 3; i++) {
      console.log("🧐 执行Lookbook请求", userId, imageUrl, styleOptions, numImages)
      const response = await this.makeRequest(
        `${process.env.EXPO_PUBLIC_API_URL}/api/apple/lookbook`,
        { userId, imageUrl, styleOptions, numImages },
        abortController,
      );
      options.onProgress?.(80);
      if (response.data.images && response.data.images.length > 0) {
        return response.data.images;
      }
      console.log("🧐 执行Lookbook请求失败", response)
    }
    return [];
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

