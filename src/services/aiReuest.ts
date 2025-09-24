import { webWorkerAIService } from "./WebWorkerAIService";

interface AiRequestResponse {
  jobId: string;
  message: string;
}

// 使用Web Worker模拟处理AI请求，避免UI阻塞
export const aiRequest = async (
  garmentImage: string,
): Promise<AiRequestResponse> => {
  try {
    return await webWorkerAIService.aiRequest(garmentImage, {
      onProgress: (progress) => {
        console.log(`AI Request Progress: ${progress}%`);
      },
      onStatusChange: (status) => {
        console.log(`AI Request Status: ${status}`);
      },
    });
  } catch (error) {
    console.error("AI request failed:", error);
    return { jobId: "error", message: "error" };
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
        console.log(`AI Suggest Progress: ${progress}%`);
      },
      onStatusChange: (status) => {
        console.log(`AI Suggest Status: ${status}`);
      },
    });
  } catch (error) {
    console.error("AI suggest request failed:", error);
    return { jobId: "error", message: "error" };
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
        console.log(`Kling Request Progress: ${progress}%`);
      },
      onStatusChange: (status) => {
        console.log(`Kling Request Status: ${status}`);
      },
    });
  } catch (error) {
    console.error("Kling request failed:", error);
    return "error";
  }
};

// 使用Web Worker模拟处理Gemini请求
export const aiRequestGemini = async (
  fullBodyPhoto: string,
  garmentImage: string,
): Promise<string[]> => {
  try {
    return await webWorkerAIService.aiRequestGemini(fullBodyPhoto, garmentImage, {
      onProgress: (progress) => {
        console.log(`Gemini Request Progress: ${progress}%`);
      },
      onStatusChange: (status) => {
        console.log(`Gemini Request Status: ${status}`);
      },
    });
  } catch (error) {
    console.error("Gemini request failed:", error);
    return [];
  }
};
