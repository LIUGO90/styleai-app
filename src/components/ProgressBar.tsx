import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../utils/cn';

export interface ProgressBarProps {
  current: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
  showPercentage?: boolean;
  showStatus?: boolean;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  status,
  message,
  showPercentage = true,
  showStatus = true,
  className,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-gray-400';
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'processing':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'error':
        return '错误';
      default:
        return '处理中';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔄';
    }
  };

  return (
    <View className={cn("w-full", className)}>
      {/* 进度条容器 */}
      <View className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <View
          className={cn(
            "h-2 rounded-full transition-all duration-300 ease-out",
            getStatusColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </View>

      {/* 状态信息 */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          {message && (
            <Text className="text-sm text-gray-600 mb-1">
              {message}
            </Text>
          )}
          
          {showStatus && (
            <View className="flex-row items-center">
              <Text className="text-xs mr-1">{getStatusIcon()}</Text>
              <Text className="text-xs text-gray-500">
                {getStatusText()}
              </Text>
            </View>
          )}
        </View>

        {showPercentage && (
          <Text className="text-xs text-gray-500 font-medium">
            {Math.round(percentage)}%
          </Text>
        )}
      </View>

      {/* 详细进度信息 */}
      <View className="flex-row items-center justify-between mt-1">
        <Text className="text-xs text-gray-400">
          {current} / {total}
        </Text>
      </View>
    </View>
  );
}
