import { View, Text, Alert, Dimensions, Pressable } from "react-native";
import { Image } from "expo-image";
import { ImageUploadCallback, Message, MessageCard, MessageImage } from "./types";
import { cn } from "@/utils/cn";
import { Avatar } from "./Avatar";

export function renderAvatar(avatar?: string, isUser: boolean = false, senderName?: string, senderType?: 'user' | 'ai' | 'system' | 'other') {
  // 根据发送者类型确定默认头像类型
  let defaultAvatarType: 'user' | 'ai' | 'system' = 'user';
  if (senderType === 'ai') {
    defaultAvatarType = 'ai';
  } else if (senderType === 'system') {
    defaultAvatarType = 'system';
  }

  return (
    <Avatar
      source={avatar}
      name={senderName || (isUser ? '我' : '他')}
      size="small"
      defaultAvatar={defaultAvatarType}
      className={cn(
        isUser ? "ml-1" : "mr-1"
      )}
    />
  );
};

// 渲染图片消息 - 使用 expo-image 优化
export function renderMessageImages(images: MessageImage[], isUser: boolean) {
  if (!images || images.length === 0) return null;

  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = screenWidth * 0.6;
  const maxImageHeight = 200;

  // 计算并排显示的图片尺寸
  const imageCount = images.length;
  const gap = 2; // 图片间距
  let imageWidth, imageHeight;

  if (imageCount === 1) {
    // 单张图片
    imageWidth = Math.min(images[0].width || maxImageWidth, maxImageWidth);
    imageHeight = Math.min(images[0].height || maxImageHeight, maxImageHeight);
  } else if (imageCount === 2) {
    // 两张图片并排
    imageWidth = (maxImageWidth - gap) / 2;
    imageHeight = Math.max(maxImageHeight, imageWidth * 1.2);
  } else {
    // 三张或更多图片，使用网格布局
    imageWidth = (maxImageWidth - gap) / 2;
    imageHeight = Math.max(maxImageHeight, imageWidth * 1.2);
  }

  return (
    <View className="mt-2">
      {imageCount === 1 ? (
        // 单张图片
        <View className="mb-2 items-center justify-center bg-gray-50 rounded-xl">
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Image
              source={images[0].url}
              style={{
                width: imageWidth,
                height: imageHeight,
                borderRadius: 12,
              }}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
              placeholder="https://via.placeholder.com/150x150?text=Loading..."
              placeholderContentFit="cover"
            />
          </View>
          {images[0].alt && (
            <Text
              className={cn(
                "text-xs mt-1 opacity-70",
                isUser ? "text-blue-100" : "text-gray-500"
              )}
            >
              {images[0].alt}
            </Text>
          )}
        </View>
      ) : imageCount === 2 ? (
        // 两张图片并排
        <View className="mb-2 flex-row" style={{ gap }}>
          {images.map((image) => (
            <View key={image.id}>
              <View>
                <Image
                  source={image.url}
                  style={{
                    width: imageWidth,
                    height: imageHeight,
                    borderRadius: 12,
                  }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  placeholder="https://via.placeholder.com/150x150?text=Loading..."
                  placeholderContentFit="cover"
                />
              </View>
              {image.alt && (
                <Text
                  className={cn(
                    "text-xs mt-1 opacity-70",
                    isUser ? "text-blue-100" : "text-gray-500"
                  )}
                >
                  {image.alt}
                </Text>
              )}
            </View>
          ))}
        </View>
      ) : (
        // 三张或更多图片，网格布局
        <View className="mb-2 flex-row" style={{ gap }}>
          {images.map((image) => (
            <View key={image.id}>
              <View>
                <Image
                  source={image.url}
                  style={{
                    width: imageWidth,
                    height: imageHeight,
                    borderRadius: 12,
                  }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  placeholder="https://via.placeholder.com/150x150?text=Loading..."
                  placeholderContentFit="cover"
                />
              </View>
              {image.alt && (
                <Text
                  className={cn(
                    "text-xs mt-1 opacity-70",
                    isUser ? "text-blue-100" : "text-gray-500"
                  )}
                >
                  {image.alt}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// 渲染消息卡片
export function renderMessageCard(card: MessageCard, isUser: boolean, onButtonPress?: (button: any) => void) {
  return (
    <View className="mt-2">
      <View
        className={cn(
          "bg-white rounded-xl p-4 border",
          isUser ? "border-blue-200" : "border-gray-200"
        )}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {card.title && (
          <Text className="text-lg font-semibold mb-2 text-gray-800">
            {card.title}
          </Text>
        )}

        {card.description && (
          <Text className="text-gray-600 mb-3">
            {card.description}
          </Text>
        )}

        {card.image && (
          <View className="mb-3">
            <Image
              source={card.image}
              style={{
                width: '100%',
                height: 150,
                borderRadius: 8,
              }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              placeholder="https://via.placeholder.com/300x150?text=Loading..."
              placeholderContentFit="cover"
            />
          </View>
        )}

        {card.buttons && card.buttons.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {card.buttons.map((button, index) => (
              <Pressable
                key={index}
                onPress={() => onButtonPress?.(button)}
                className={cn(
                  "px-4 py-2 rounded-lg border",
                  button.type === 'primary'
                    ? "bg-blue-500 border-blue-500"
                    : "bg-white border-gray-300"
                )}
              >
                <Text
                  className={cn(
                    "text-sm font-medium",
                    button.type === 'primary' ? "text-white" : "text-gray-700"
                  )}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// 主渲染函数
export default function OptimizedRenderMessage({
  item,
  onButtonPress,
  onImageUpload
}: {
  item: Message;
  onButtonPress?: (button: any) => void;
  onImageUpload?: ImageUploadCallback;
}) {
  const isUser = item.sender === 'user';
  const isAi = item.sender === 'ai';

  return (
    <View
      className={cn(
        "flex-row mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {isAi && !item.showAvatars && renderAvatar(item.avatar, isUser, item.senderName, item.sender)}

      <View
        className={cn(
          "max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* 文本消息 */}
        {item.text && (
          <View
            className={cn(
              "px-4 py-3 rounded-2xl",
              isUser
                ? "bg-blue-500 rounded-br-md"
                : "bg-gray-100 rounded-bl-md"
            )}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              className={cn(
                "text-base",
                isUser ? "text-white" : "text-gray-800"
              )}
            >
              {item.text}
            </Text>
          </View>
        )}

        {/* 图片消息 */}
        {item.images && renderMessageImages(item.images, isUser)}

        {/* 卡片消息 */}
        {item.card && renderMessageCard(item.card, isUser, onButtonPress)}

      </View>

      {isUser && !!item.showAvatars && renderAvatar(item.avatar, isUser, item.senderName, item.sender)}
    </View>
  );
}
