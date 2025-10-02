import React from "react";
import { View, Text } from "react-native";
import { cn } from "../utils/cn";
import { Image } from "expo-image";
interface AvatarProps {
  source?: string;
  name?: string;
  size?: "small" | "medium" | "large";
  className?: string;
  showOnline?: boolean;
  isOnline?: boolean;
  defaultAvatar?: "user" | "ai" | "system" | "random";
}

export function Avatar({
  source,
  name,
  size = "medium",
  className,
  showOnline = false,
  isOnline = false,
  defaultAvatar = "user",
}: AvatarProps) {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-10 h-10",
    large: "w-12 h-12",
  };

  const textSizeClasses = {
    small: "text-sm",
    medium: "text-lg",
    large: "text-xl",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // 获取默认头像颜色和图标
  const getDefaultAvatarStyle = (type: string) => {
    const styles = {
      user: {
        bgColor: "bg-[#007AFF]",
        icon: "👤",
        text: "Me",
      },
      ai: {
        bgColor: "bg-[#34D399]",
        icon: "🤖",
        text: "AI",
      },
      system: {
        bgColor: "bg-[#F59E0B]",
        icon: "⚙️",
        text: "系统",
      },
      random: {
        bgColor: "bg-[#8B5CF6]",
        icon: "🎲",
        text: name ? getInitials(name) : "?",
      },
    };
    return styles[type as keyof typeof styles] || styles.user;
  };

  return (
    <View className={cn("relative", className)}>
      <View className={cn("rounded-full overflow-hidden", sizeClasses[size])}>
        {source ? (
          <Image
            source={{ uri: source }}
            className="w-full h-full"
            resizeMode="cover"
            cachePolicy="memory-disk"  
          />
        ) : (
          <View
            className={cn(
              "w-full h-full rounded-full items-center justify-center",
              getDefaultAvatarStyle(defaultAvatar).bgColor,
            )}
          >
            <Text
              className={cn("text-white font-semibold", textSizeClasses[size])}
            >
              {getDefaultAvatarStyle(defaultAvatar).text}
            </Text>
          </View>
        )}
      </View>

      {showOnline && (
        <View
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            size === "small" ? "w-2 h-2" : "w-3 h-3",
            isOnline ? "bg-green-500" : "bg-gray-400",
          )}
        />
      )}
    </View>
  );
}
