import React, { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useBackgroundAITask } from "@/hooks/useBackgroundAITask";
import { CircularProgress } from "./CircularProgress";

interface BackgroundAITaskButtonProps {
  requestType: "ai" | "suggest" | "kling" | "gemini";
  garmentImage?: string;
  jobId?: string;
  index?: number;
  onSuccess: (data: any) => void;
  onError?: (error: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const BackgroundAITaskButton: React.FC<BackgroundAITaskButtonProps> = ({
  requestType,
  garmentImage,
  jobId,
  index,
  onSuccess,
  onError,
  children,
  disabled = false,
  className = "",
}) => {
  const { taskState, submitTask, resetState, isTaskActive } =
    useBackgroundAITask();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      const requestId = await submitTask(
        requestType,
        garmentImage,
        jobId,
        index,
      );
      console.log("Task submitted with ID:", requestId);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to submit task";
      onError?.(errorMessage);
      Alert.alert("错误", `任务提交失败: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetState();
    setIsSubmitting(false);
  };

  const getStatusText = () => {
    switch (taskState.status) {
      case "submitted":
        return "任务已提交...";
      case "processing":
        return "后台处理中...";
      case "completed":
        return "处理完成";
      case "error":
        return "处理失败";
      default:
        return "";
    }
  };

  const showProgress =
    taskState.status === "submitted" || taskState.status === "processing";
  const isActive = isTaskActive || isSubmitting;

  // 处理任务完成
  React.useEffect(() => {
    if (taskState.status === "completed" && taskState.data) {
      onSuccess(taskState.data);
      setIsSubmitting(false);
    } else if (taskState.status === "error" && taskState.error) {
      onError?.(taskState.error);
      setIsSubmitting(false);
    }
  }, [taskState.status, taskState.data, taskState.error, onSuccess, onError]);

  return (
    <View className="relative">
      {/* 提交按钮 */}
      <Pressable
        onPress={handleSubmit}
        disabled={disabled || isActive}
        className={`p-4 rounded-lg ${disabled || isActive
            ? "bg-gray-300"
            : "bg-blue-500 active:bg-blue-600"
          } ${className}`}
      >
        {children}
      </Pressable>

      {/* 进度覆盖层 */}
      {showProgress && (
        <View className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          <View className="bg-white p-6 rounded-lg items-center min-w-[200px]">
            <CircularProgress
              progress={taskState.progress}
              size={60}
              strokeWidth={4} 
              status={"processing"} />
            <Text className="mt-3 text-gray-700 font-medium text-center">
              {getStatusText()}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {Math.round(taskState.progress)}%
            </Text>
            {taskState.requestId && (
              <Text className="text-xs text-gray-400 mt-2 text-center">
                ID: {taskState.requestId.slice(-8)}
              </Text>
            )}
            <Pressable
              onPress={handleCancel}
              className="mt-3 px-4 py-2 bg-red-500 rounded-lg"
            >
              <Text className="text-white font-medium">取消</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 错误状态 */}
      {taskState.status === "error" && (
        <View className="mt-2 p-3 bg-red-100 rounded-lg">
          <Text className="text-red-700 text-sm">错误: {taskState.error}</Text>
          <Pressable
            onPress={resetState}
            className="mt-2 px-3 py-1 bg-red-500 rounded self-start"
          >
            <Text className="text-white text-xs">重试</Text>
          </Pressable>
        </View>
      )}

      {/* 成功状态 */}
      {taskState.status === "completed" && (
        <View className="mt-2 p-3 bg-green-100 rounded-lg">
          <Text className="text-green-700 text-sm">任务完成！</Text>
        </View>
      )}
    </View>
  );
};
