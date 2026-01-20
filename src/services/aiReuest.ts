import { webWorkerAIService } from "./WebWorkerAIService";
import { logger } from '@/utils/logger';
import { analytics } from '@/services/AnalyticsService';

// 创建模块专用 logger
const log = logger.createModuleLogger('AIRequest');

interface AiRequestResponse {
  status: string,
  jobId: string;
  message: string;
  images: string[];
}

export const analyzeRequest = async (
  imageUrl: string,
): Promise<AiRequestResponse> => {
  return await webWorkerAIService.analyzeRequest(imageUrl, {
    onProgress: (progress) => {

    },
    onStatusChange: (status) => {

    },
  });
};
export const chatRequest = async (
  chatType: string,
  userId:string,
  bodyShape: string,
  bodySize: string,
  skinTone: string,
  stylePreferences: string,
  message: string,
  imageUrl: string[],
  sessionId: string,
): Promise<AiRequestResponse> => {
  return await webWorkerAIService.chatRequest(chatType,userId,bodyShape, bodySize, skinTone, stylePreferences, message, imageUrl, sessionId,{
    onProgress: (progress) => {

    },
    onStatusChange: (status) => {

    },
  });
};

// 使用Web Worker模拟处理AI请求，避免UI阻塞
export const aiRequest = async (
  garmentImage: string,
  occasion: string,
): Promise<AiRequestResponse> => {
  try {
    return await webWorkerAIService.aiRequest(garmentImage, occasion, {
      onProgress: (progress) => {

      },
      onStatusChange: (status) => {

      },
    });
  } catch (error) {
    log.error('AI request failed', error, { garmentImage, occasion });
    analytics.trackAIError('generation_failed', error, { action: 'ai_request', occasion });
    return {status:"error", jobId: "error", message: "error", images: [] };
  }
};

// 使用Web Worker模拟处理建议请求
export const aisuggest = async (
  jobId: string,
  index: number,
): Promise<AiRequestResponse> => {
  try {
    return await webWorkerAIService.aiSuggest(jobId, index, {
      onProgress: (progress) => {

      },
      onStatusChange: (status) => {

      },
    });
  } catch (error) {
    log.error('AI suggest request failed', error, { jobId, index });
    analytics.trackAIError('generation_failed', error, { action: 'ai_suggest', jobId, index });
    return {status:"error", jobId: "error", message: "error", images: [] };
  }
};

// 使用Web Worker模拟处理Gemini请求
export const aiRequestGemini = async (
  userId: string,
  jobId: string,
  index: number,
): Promise<string[]> => {
  try {
    return await webWorkerAIService.aiRequestGemini(userId, jobId, index, {
      onProgress: (progress) => {

      },
      onStatusChange: (status) => {

      },
    });
  } catch (error) {
    log.error('Gemini request failed', error, { userId, jobId, index });
    analytics.trackAIError('api_error', error, { action: 'gemini_request', jobId, index });
    return [];
  }
};

export const aiRequestLookbook = async (
  userId: string,
  imageUrl: string,
  styleOptions: string[],
  numImages: number,
): Promise<string[]> => {
  try {
    return await webWorkerAIService.aiRequestLookbook(userId, imageUrl, styleOptions, numImages, {
      onProgress: (progress) => {

      },
      onStatusChange: (status) => {

      },
    });
  } catch (error) {
    log.error('Lookbook request failed', error, { userId, styleOptions, numImages });
    analytics.trackAIError('generation_failed', error, { action: 'lookbook_request', styleOptions, numImages });
    return [];
  }
};

export const aiRequestForYou = async (
  requestId: string,
  userId: string,
  imageUrl: string[],
  prompt: string,
): Promise<string[]> => {
  return await webWorkerAIService.aiRequestForYou(requestId, userId, imageUrl, prompt, {
    onProgress: (progress) => {

    },
    onStatusChange: (status) => {

    },
  });
};