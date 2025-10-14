import React, { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { BackgroundAITaskButton } from "@/components/BackgroundAITaskButton";

export const BackgroundAITaskExample: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);

  const handleAISuccess = (data: any) => {

    setResults((prev) => [
      ...prev,
      { type: "AI", data, timestamp: new Date() },
    ]);
    Alert.alert("成功", "AI请求完成！");
  };

  const handleKlingSuccess = (data: string) => {

    setResults((prev) => [
      ...prev,
      { type: "Kling", data, timestamp: new Date() },
    ]);
    Alert.alert("成功", "Kling请求完成！");
  };

  const handleGeminiSuccess = (data: string[]) => {

    setResults((prev) => [
      ...prev,
      { type: "Gemini", data, timestamp: new Date() },
    ]);
    Alert.alert("成功", "Gemini请求完成！");
  };

  const handleError = (error: string) => {
    console.error("Request Error:", error);
    Alert.alert("错误", `请求失败: ${error}`);
  };

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-6 text-center">
        后台AI任务示例
      </Text>

      <View className="space-y-4">
        {/* AI基础请求 */}
        <View className="bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-semibold mb-2">AI基础请求</Text>
          <BackgroundAITaskButton
            requestType="ai"
            garmentImage="test_image_uri"
            onSuccess={handleAISuccess}
            onError={handleError}
            className="mb-2"
          >
            <Text className="text-white font-medium text-center">
              开始AI请求
            </Text>
          </BackgroundAITaskButton>
        </View>

        {/* Kling请求 */}
        <View className="bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-semibold mb-2">Kling AI请求</Text>
          <BackgroundAITaskButton
            requestType="kling"
            jobId="test_job_id"
            index={0}
            onSuccess={handleKlingSuccess}
            onError={handleError}
            className="mb-2"
          >
            <Text className="text-white font-medium text-center">
              开始Kling请求
            </Text>
          </BackgroundAITaskButton>
        </View>

        {/* Gemini请求 */}
        <View className="bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-semibold mb-2">Gemini AI请求</Text>
          <BackgroundAITaskButton
            requestType="gemini"
            jobId="test_job_id"
            index={0}
            onSuccess={handleGeminiSuccess}
            onError={handleError}
            className="mb-2"
          >
            <Text className="text-white font-medium text-center">
              开始Gemini请求
            </Text>
          </BackgroundAITaskButton>
        </View>

        {/* 建议请求 */}
        <View className="bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-semibold mb-2">AI建议请求</Text>
          <BackgroundAITaskButton
            requestType="suggest"
            jobId="test_job_id"
            index={0}
            onSuccess={handleAISuccess}
            onError={handleError}
            className="mb-2"
          >
            <Text className="text-white font-medium text-center">
              开始建议请求
            </Text>
          </BackgroundAITaskButton>
        </View>
      </View>

      {/* 结果显示 */}
      {results.length > 0 && (
        <View className="mt-6 p-4 bg-blue-50 rounded-lg">
          <Text className="text-lg font-semibold mb-3">请求结果:</Text>
          {results.map((result, index) => (
            <View key={index} className="mb-3 p-3 bg-white rounded border">
              <Text className="font-medium text-blue-600">
                {result.type} - {result.timestamp.toLocaleTimeString()}
              </Text>
              <Text className="text-sm text-gray-700 mt-1">
                {JSON.stringify(result.data, null, 2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <Text className="text-sm text-yellow-800">
          <Text className="font-semibold">注意:</Text>{" "}
          这些请求将在后台任务中处理，不会阻塞UI。
          在开发模式下，任务会立即执行；在生产环境中，任务会在系统允许的时间窗口内执行。
        </Text>
      </View>
    </ScrollView>
  );
};
