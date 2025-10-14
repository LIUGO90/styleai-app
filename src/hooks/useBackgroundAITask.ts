import { useState, useEffect, useCallback, useRef } from "react";
import {
  backgroundAITaskManager,
  TaskResult,
} from "@/services/BackgroundAITaskManager";

export interface BackgroundTaskState {
  status: "idle" | "submitted" | "processing" | "completed" | "error";
  progress: number;
  error: string | null;
  data: any;
  requestId: string | null;
}

export interface UseBackgroundAITaskReturn {
  taskState: BackgroundTaskState;
  submitTask: (
    type: "ai" | "suggest" | "kling" | "gemini",
    garmentImage?: string,
    jobId?: string,
    index?: number,
  ) => Promise<string>;
  getTaskResult: (requestId: string) => Promise<TaskResult | null>;
  resetState: () => void;
  isTaskActive: boolean;
}

export const useBackgroundAITask = (): UseBackgroundAITaskReturn => {
  const [taskState, setTaskState] = useState<BackgroundTaskState>({
    status: "idle",
    progress: 0,
    error: null,
    data: null,
    requestId: null,
  });

  const [isTaskActive, setIsTaskActive] = useState(false);
  const statusListenerRef = useRef<(() => void) | null>(null);

  const submitTask = useCallback(
    async (
      type: "ai" | "suggest" | "kling" | "gemini",
      garmentImage?: string,
      jobId?: string,
      index?: number,
    ): Promise<string> => {
      try {
        setIsTaskActive(true);
        setTaskState((prev) => ({
          ...prev,
          status: "submitted",
          progress: 0,
          error: null,
          data: null,
        }));

        const requestId = await backgroundAITaskManager.submitAIRequest(
          type,
          garmentImage,
          jobId,
          index,
        );

        setTaskState((prev) => ({
          ...prev,
          requestId,
          status: "submitted",
          progress: 10,
        }));

        // 设置状态监听器
        if (statusListenerRef.current) {
          statusListenerRef.current();
        }

        statusListenerRef.current = backgroundAITaskManager.onTaskStatusChange(
          requestId,
          (status) => {

            if (status.success !== undefined) {
              // 这是任务结果
              setTaskState((prev) => ({
                ...prev,
                status: status.success ? "completed" : "error",
                progress: status.success ? 100 : prev.progress,
                error: status.success ? null : status.error,
                data: status.success ? status.data : null,
              }));
              setIsTaskActive(false);
            } else {
              // 这是状态更新
              setTaskState((prev) => ({
                ...prev,
                status: status.status || prev.status,
                progress: Math.min(prev.progress + 10, 90),
              }));
            }
          },
        );

        return requestId;
      } catch (error: any) {
        setTaskState((prev) => ({
          ...prev,
          status: "error",
          error: error.message || "Failed to submit task",
        }));
        setIsTaskActive(false);
        throw error;
      }
    },
    [],
  );

  const getTaskResult = useCallback(
    async (requestId: string): Promise<TaskResult | null> => {
      return await backgroundAITaskManager.getTaskResult(requestId);
    },
    [],
  );

  const resetState = useCallback(() => {
    setTaskState({
      status: "idle",
      progress: 0,
      error: null,
      data: null,
      requestId: null,
    });
    setIsTaskActive(false);

    if (statusListenerRef.current) {
      statusListenerRef.current();
      statusListenerRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (statusListenerRef.current) {
        statusListenerRef.current();
      }
    };
  }, []);

  return {
    taskState,
    submitTask,
    getTaskResult,
    resetState,
    isTaskActive,
  };
};
