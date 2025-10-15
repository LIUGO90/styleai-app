import { webWorkerAIService } from "./WebWorkerAIService";

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
  userId:string,
  bodyShape: string,
  bodySize: string,
  skinTone: string,
  stylePreferences: string,
  message: string,
  imageUrl: string[],
  sessionId: string,
): Promise<AiRequestResponse> => {
  return await webWorkerAIService.chatRequest(userId,bodyShape, bodySize, skinTone, stylePreferences, message, imageUrl, sessionId,{
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
    console.error("AI request failed:", error);
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
    console.error("AI suggest request failed:", error);
    return {status:"error", jobId: "error", message: "error", images: [] };
  }
};

// 使用Web Worker模拟处理Kling请求
export const aiRequestKling = async (
  jobId: string,
  index: number,
): Promise<string> => {
  try {
    return await webWorkerAIService.aiRequestKling(jobId, index, {
      onProgress: (progress) => {

      },
      onStatusChange: (status) => {

      },
    });
  } catch (error) {
    console.error("Kling request failed:", error);
    return "error";
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
    console.error("Gemini request failed:", error);
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
    console.error("Gemini request failed:", error);
    return [];
  }
};

export const aiRequestForYou = async (
  userId: string,
  imageUrl: string[],
  prompt: string,
): Promise<string[]> => {
  return await webWorkerAIService.aiRequestForYou(userId, imageUrl, prompt, {
    onProgress: (progress) => {

    },
    onStatusChange: (status) => {

    },
  });
};