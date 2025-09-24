import { useState, useCallback, useRef, useEffect } from "react";
import {
  asyncAIRequestService,
  AIRequestOptions,
} from "@/services/AsyncAIRequestService";

export interface RequestState {
  status: "idle" | "pending" | "processing" | "completed" | "error";
  progress: number;
  error: string | null;
  data: any;
}

export interface UseAsyncAIRequestReturn {
  requestState: RequestState;
  makeRequest: (
    requestType: "ai" | "suggest" | "kling" | "gemini",
    ...args: any[]
  ) => Promise<any>;
  cancelRequest: () => void;
  resetState: () => void;
  isRequesting: boolean;
}

export const useAsyncAIRequest = (): UseAsyncAIRequestReturn => {
  const [requestState, setRequestState] = useState<RequestState>({
    status: "idle",
    progress: 0,
    error: null,
    data: null,
  });

  const [isRequesting, setIsRequesting] = useState(false);
  const currentRequestId = useRef<string | null>(null);

  const makeRequest = useCallback(
    async (
      requestType: "ai" | "suggest" | "kling" | "gemini",
      ...args: any[]
    ) => {
      const requestId = `${requestType}_${Date.now()}`;
      currentRequestId.current = requestId;

      const options: AIRequestOptions = {
        timeout:
          requestType === "kling"
            ? 60000
            : requestType === "gemini"
              ? 45000
              : 30000,
        onProgress: (progress: number) => {
          setRequestState((prev) => ({ ...prev, progress }));
        },
        onStatusChange: (
          status: "pending" | "processing" | "completed" | "error",
        ) => {
          setRequestState((prev) => ({ ...prev, status }));
        },
      };

      try {
        setIsRequesting(true);
        setRequestState({
          status: "pending",
          progress: 0,
          error: null,
          data: null,
        });

        let result: any;

        switch (requestType) {
          case "ai":
            result = await asyncAIRequestService.aiRequest(args[0], options);
            break;
          case "suggest":
            result = await asyncAIRequestService.aiSuggest(
              args[0],
              args[1],
              options,
            );
            break;
          case "kling":
            result = await asyncAIRequestService.aiRequestKling(
              args[0],
              args[1],
              options,
            );
            break;
          case "gemini":
            result = await asyncAIRequestService.aiRequestGemini(
              args[0],
              args[1],
              options,
            );
            break;
          default:
            throw new Error(`Unknown request type: ${requestType}`);
        }

        setRequestState((prev) => ({
          ...prev,
          status: "completed",
          progress: 100,
          data: result,
        }));

        return result;
      } catch (error: any) {
        setRequestState((prev) => ({
          ...prev,
          status: "error",
          error: error.message || "Request failed",
        }));
        throw error;
      } finally {
        setIsRequesting(false);
        currentRequestId.current = null;
      }
    },
    [],
  );

  const cancelRequest = useCallback(() => {
    if (currentRequestId.current) {
      // 注意：这里我们取消所有请求，因为服务没有提供单个请求取消的方法
      asyncAIRequestService.cancelAllRequests();
      setRequestState((prev) => ({
        ...prev,
        status: "error",
        error: "Request cancelled",
      }));
      setIsRequesting(false);
      currentRequestId.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setRequestState({
      status: "idle",
      progress: 0,
      error: null,
      data: null,
    });
    setIsRequesting(false);
    currentRequestId.current = null;
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (currentRequestId.current) {
        cancelRequest();
      }
    };
  }, [cancelRequest]);

  return {
    requestState,
    makeRequest,
    cancelRequest,
    resetState,
    isRequesting,
  };
};
