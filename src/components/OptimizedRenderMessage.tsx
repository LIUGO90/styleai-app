import { View, Text, Alert, Dimensions, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import {
  ImageUploadCallback,
  Message,
  MessageCard,
  MessageImage,
} from "./types";
import { cn } from "@/utils/cn";
import { Avatar } from "./Avatar";

export function renderAvatar(
  avatar?: string,
  isUser: boolean = false,
  senderName?: string,
  senderType?: "user" | "ai" | "system" | "other",
) {
  // 根据发送者类型确定默认头像类型
  let defaultAvatarType: "user" | "ai" | "system" = "user";
  if (senderType === "ai") {
    defaultAvatarType = "ai";
  } else if (senderType === "system") {
    defaultAvatarType = "system";
  }

  return (
    <Avatar
      source={avatar}
      name={senderName || (isUser ? "Me" : "他")}
      size="small"
      defaultAvatar={defaultAvatarType}
      className={cn(isUser ? "ml-1" : "mr-1")}
    />
  );
}

// 渲染图片消息 - 使用 expo-image 优化，流式布局，统一高度
export function renderMessageImages(images: MessageImage[], isUser: boolean) {
  if (!images || images.length === 0) return null;

  const imageCount = images.length;
  const isSingleImage = imageCount === 1;

  if (Platform.OS === "web") {
    return (
      <View
        className="mt-2 flex-row flex-wrap items-center"
        style={{ gap: 8 }}
      >
        {images.map((image, index) => (
          <Image
            key={image.id || `image-${index}`}
            source={image.url}
            style={{
              width: 90,
              height: 180,
              borderRadius: 16
            }}
            contentFit="cover"
            transition={200}
          />
        ))}
      </View>
    );

  }
  if (images.length === 3) {
    return (
      <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: 8 }}>
        {images.map((image, index) => (
          <Image key={image.id || `image-${index}`} source={image.url} style={{
            height: 180, flexGrow: 1, flexShrink: 0, flexBasis: '30%', borderRadius: 16
          }} contentFit="cover" transition={200} />
        ))}
      </View>
    );
  }

  // 统一高度设置
  const imageHeight = 180;

  return (
    <View
      className="mt-2 flex-row flex-wrap items-center"
      style={{ gap: 8 }}
    >
      {images.map((image, index) => (
        <Image
          key={image.id || `image-${index}`}
          source={image.url}
          style={{
            height: imageHeight,
            flexGrow: 1,
            flexShrink: 0,
            flexBasis: isSingleImage ? '100%' : 100, // 单张占满，多张最小100宽度
            borderRadius: 16,
          }}
          contentFit="cover"
          transition={200}
        />
      ))}
    </View>
  );
}


// 主渲染函数
export default function OptimizedRenderMessage({
  item,
  onButtonPress,
  onImageUpload,
}: {
  item: Message;
  onButtonPress?: (button: any) => void;
  onImageUpload?: ImageUploadCallback;
}) {
  const isUser = item.sender === "user";
  const isAi = item.sender === "ai";

  return (
    <View
      className={cn("flex-row mb-4", isUser ? "justify-end" : "justify-start")}
    >
      {isAi &&
        !item.showAvatars &&
        renderAvatar(item.avatar, isUser, item.senderName, item.sender)}

      <View className={cn("max-w-[80%]", isUser ? "items-end" : "items-start")}>
        {/* 文本消息 */}
        {item.text && (
          <View
            className={cn(
              "px-4 py-3 rounded-2xl",
              isUser
                ? "bg-blue-500 rounded-br-md"
                : "bg-gray-100 rounded-bl-md",
            )}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              className={cn(
                "text-base",
                isUser ? "text-white" : "text-gray-800",
              )}
            >
              {item.text}
            </Text>
          </View>
        )}

        {/* 图片消息 */}
        {item.images && renderMessageImages(item.images, isUser)}

      </View>

      {isUser &&
        !!item.showAvatars &&
        renderAvatar(item.avatar, isUser, item.senderName, item.sender)}
    </View>
  );
}
