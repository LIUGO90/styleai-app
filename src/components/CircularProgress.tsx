import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { cn } from "../utils/cn";

export interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress?: number; // 0-100
  status: "pending" | "processing" | "completed" | "error";
  message?: string;
  showText?: boolean;
  className?: string;
}

export function CircularProgress({
  size = 40,
  strokeWidth = 3,
  progress = 0,
  status,
  message,
  showText = true,
  className,
}: CircularProgressProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  // 旋转动画
  useEffect(() => {
    if (status === "processing") {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    } else {
      spinValue.setValue(0);
    }
  }, [status, spinValue]);

  // 进度动画
  useEffect(() => {
    Animated.timing(progressValue, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "#9CA3AF"; // gray-400
      case "processing":
        return "#3B82F6"; // blue-500
      case "completed":
        return "#10B981"; // green-500
      case "error":
        return "#EF4444"; // red-500
      default:
        return "#3B82F6";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return "⏳";
      case "processing":
        return "🔄";
      case "completed":
        return "✅";
      case "error":
        return "❌";
      default:
        return "🔄";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "等待中";
      case "processing":
        return "处理中";
      case "completed":
        return "已完成";
      case "error":
        return "错误";
      default:
        return "处理中";
    }
  };

  return (
    <View className={cn("flex-row items-center", className)}>
      {/* 圆形进度条 */}
      <View className="relative items-center justify-center mr-3">
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: "#E5E7EB", // gray-200
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* 进度弧线 */}
          {status === "processing" && (
            <Animated.View
              style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: "transparent",
                borderTopColor: getStatusColor(),
                transform: [{ rotate: spin }],
              }}
            />
          )}

          {/* 静态进度条 */}
          {status !== "processing" && (
            <View
              style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: "transparent",
                borderTopColor: getStatusColor(),
                transform: [{ rotate: `${(progress / 100) * 360}deg` }],
              }}
            />
          )}

          {/* 中心图标或百分比 */}
          <View className="items-center justify-center">
            {status === "completed" || status === "error" ? (
              <Text style={{ fontSize: size * 0.3 }}>{getStatusIcon()}</Text>
            ) : (
              <Text
                style={{
                  fontSize: size * 0.2,
                  fontWeight: "600",
                  color: getStatusColor(),
                }}
              >
                {Math.round(progress)}%
              </Text>
            )}
          </View>
        </View>
      </View>
      <Text className="text-sm text-gray-700 mb-1">{message}</Text>
      {/* 文字信息 */}
      {/* {showText && (
        <View className="flex-1">
          {message && (
            <Text className="text-sm text-gray-700 mb-1">
              {message}
            </Text>
          )}
          <View className="flex-row items-center">
            <Text className="text-xs mr-1">{getStatusIcon()}</Text>
            <Text className="text-xs text-gray-500">
              {getStatusText()}
            </Text>
          </View>
        </View>
      )} */}
    </View>
  );
}
