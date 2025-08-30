import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { cn } from '../utils/cn';
import { Avatar } from './Avatar';
import { shadowStyles } from '../utils/shadow';
import { Message, MessageButton, MessageImage, MessageCard, ChatProps } from './types';
import { ImageUpload } from './ImageUpload';
import { uploadImageWithFileSystem } from '@/services/FileUploadService';

export function Chat({
  messages = [],
  onSendMessage,
  onTyping,
  onButtonPress,
  onImageUpload,
  placeholder = "输入消息...",
  sendButtonText = "发送",
  className,
  disabled = false,
  clickHighlight = '',
}: ChatProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedButtons, setSelectedButtons] = useState("");
  const [deleteButtonPressed, setDeleteButtonPressed] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  console.log(clickHighlight);
  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 处理发送消息
  const handleSend = () => {
    if (inputText.trim() && !disabled) {
      onSendMessage?.(inputText.trim());
      setInputText('');
      setIsTyping(false);
      onTyping?.(false);
      // 发送后收起键盘
      Keyboard.dismiss();
    }
  };



  // 处理输入变化
  const handleInputChange = (text: string) => {
    // 检查是否包含回车符
    if (text.includes('\n')) {
      // 移除回车符并发送消息
      const cleanText = text.replace(/\n/g, '').trim();
      if (cleanText && !disabled) {
        onSendMessage?.(cleanText);
        setInputText('');
        setIsTyping(false);
        onTyping?.(false);
        Keyboard.dismiss();
        return;
      }
    }

    setInputText(text);
    const typing = text.length > 0;
    if (typing !== isTyping) {
      setIsTyping(typing);
      onTyping?.(typing);
    }
  };

  // 渲染头像组件
  const renderAvatar = (avatar?: string, isUser: boolean = false, senderName?: string, senderType?: 'user' | 'ai' | 'system' | 'other') => {

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

  const clickButton = (button: MessageButton, message: Message) => {
    setSelectedButtons(button.text);
    onButtonPress?.(button, message);
  };

  // 渲染消息按钮
  const renderMessageButtons = (buttons: MessageButton[], message: Message) => {
    if (!buttons || buttons.length === 0) return null;

    return (
      <View className="flex-row flex-wrap gap-2 mt-2">
        {buttons.map((button) => {

          let isSelected = false;
          if (clickHighlight == button.text) {
            isSelected = true
          }

          return (
            <Pressable
              key={button.id}
              onPress={() => clickButton(button, message)}
              className={cn(
                "px-3 py-1.5 rounded-lg border flex-shrink-0 transition-all duration-200",
                button.type === 'primary' && "bg-[#007AFF] border-[#007AFF]",
                button.type === 'secondary' && (isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300 hover:bg-gray-50"),
                button.type === 'danger' && "bg-red-500 border-red-500",
                !button.type && "bg-white border-gray-300"
              )}
              accessibilityRole="button"
              accessibilityLabel={button.text}
              accessibilityHint={`点击${button.text}`}
            >
              <View className="flex-row items-center p-2">
                <Text
                  className={cn(
                    "text-sm font-medium",
                    button.type === 'primary' && "text-white",
                    button.type === 'secondary' && ("text-gray-700"),
                    button.type === 'danger' && "text-white",
                    !button.type && "text-gray-700"
                  )}
                >
                  {button.text}
                </Text>

              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  // 渲染提交按钮
  const renderCommitButtons = (commitButton: MessageButton, message: Message) => {
    if (!commitButton) return null;


    return (
      <View className="mt-3 pt-3 border-gray-100">
        <Pressable
          onPress={() => onButtonPress?.(commitButton, message)}
          className={cn(
            "w-full py-2 rounded-lg border flex-row items-center justify-center transition-all duration-200",
            commitButton.type === 'primary' && ("bg-[#007AFF] border-[#007AFF]"),
            commitButton.type === 'secondary' && ("bg-white border-gray-300"),
            commitButton.type === 'danger' && ("bg-red-500 border-red-500"),
            !commitButton.type && ("bg-black border-gray-300"),
          )}
          accessibilityRole="button"
          accessibilityLabel={commitButton.text}
          accessibilityHint={`点击${commitButton.text}提交`}
          accessibilityState={{ disabled: false }}
        >
          {/* <Ionicons
            name="checkmark-circle"
            size={16}
            color={commitButton.type === 'primary' || !commitButton.type ? "white" : "black"}
            style={{ marginRight: 6 }}
          /> */}
          <Text
            className={cn(
              "text-sm font-semibold py-2",
              commitButton.type === 'primary' && ("text-white"),
              commitButton.type === 'secondary' && ("text-gray-700"),
              commitButton.type === 'danger' && ("text-white"),
              !commitButton.type && ("text-white")
            )}
          >
            {commitButton.text}
          </Text>
        </Pressable>
      </View>
    );
  };

  // 渲染图片消息
  const renderMessageImages = (images: MessageImage[], isUser: boolean) => {
    if (!images || images.length === 0) return null;

    const screenWidth = Dimensions.get('window').width;
    const maxImageWidth = screenWidth * 0.6;
    const maxImageHeight = 200;

    return (
      <View className="mt-2">
        {images.map((image) => (
          <View key={image.id} className="mb-2">
            <Image
              source={{ uri: image.url }}
              style={{
                width: Math.min(image.width || maxImageWidth, maxImageWidth),
                height: Math.min(image.height || maxImageHeight, maxImageHeight),
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
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
    );
  };



  // 渲染卡片消息
  const renderMessageCard = (card: MessageCard, message: Message) => {
    const handleImageSelect = (imageUri: string) => {
      console.log('handleImageSelect', imageUri, message.id);
      if (imageUri) {
        uploadImageWithFileSystem(imageUri).then((imageUrl) => {
          onImageUpload?.onImageSelect?.(imageUrl, message.id);
        });
      }

    };

    const handleDeleteImage = () => {
      Alert.alert(
        '删除图片',
        '确定要删除这张图片吗？删除后可以重新上传。',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '删除',
            style: 'destructive',
            onPress: () => {
              onImageUpload?.onImageSelect?.('', message.id);
            },
          },
        ]
      );
    };

    const handleLongPress = () => {
      Alert.alert(
        '删除图片',
        '长按删除按钮可以删除已上传的图片',
        [{ text: '知道了', style: 'default' }]
      );
    };

    return (
      <View className={cn(
        "bg-white rounded-xl overflow-hidden",
        card.isShell === 'circle' && "rounded-full border border-gray-200",
        card.isShell !== 'none' && "mt-2 border border-gray-200"
      )}>
        {/* 渲染图片 */}
        {card.image && (
          <View className="relative overflow-hidden bg-gray-50">
            <Image
              source={{ uri: card.image }}
              style={{
                width: '100%',
                height: 300,
              }}
              resizeMode="contain"
            />
            {card.uploadImage && (
              <Pressable
                onPress={handleDeleteImage}
                // onLongPress={handleLongPress}
                // onPressIn={() => setDeleteButtonPressed(message.id)}
                // onPressOut={() => setDeleteButtonPressed(null)}
                className={cn(
                  "absolute top-3 right-3 backdrop-blur-sm rounded-full w-8 h-8 items-center justify-center border border-white/20 transition-all duration-150",
                  deleteButtonPressed === message.id
                    ? "bg-red-500/90 scale-95"
                    : "bg-black/70 hover:bg-black/80"
                )}
                accessibilityRole="button"
                accessibilityLabel="删除图片"
                accessibilityHint="点击删除已上传的图片，长按查看帮助"
                style={shadowStyles.medium}
              >
                <Ionicons
                  name="trash-outline"
                  size={14}
                  color="white"
                />
              </Pressable>
            )}
          </View>
        )}

        {card.uploadImage && !card.image && (
          <ImageUpload
            onImageSelect={handleImageSelect}
            placeholder="上传搭配图片"
          />
        )}

        <View className="p-3">
          {card.title.length > 0 &&
            <Text className="text-sm font-semibold text-black mb-1">
              {card.title}
            </Text>
          }
          {card.subtitle.length > 0 && (
            <Text className="text-xs text-gray-500 mb-2">
              {card.subtitle}
            </Text>
          )}
          {card.description.length > 0 && (
            <Text className="text-sm text-gray-700 mb-3">
              {card.description}
            </Text>
          )}

          {card.buttons && renderMessageButtons(card.buttons, message)}
          {card.commitButton && renderCommitButtons(card.commitButton, message)}
        </View>
      </View>
    );
  };

  // 渲染消息气泡
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    const isAi = item.sender === 'ai';

    return (
      <View
        className={cn(
          "flex-row mb-2 items-end",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {isAi && !!item.showAvatars && renderAvatar(item.avatar, false, item.senderName, item.sender)}

        <View className={cn(
          "flex-1",
          isUser ? "items-end" : "items-start"
        )}>
          {!isUser && !!item.showAvatars && item.senderName && (
            <Text className="text-sm text-gray-500 mb-1 ml-1">
              {item.senderName}
            </Text>
          )}

          {/* 渲染文本内容 */}
          {item.text.length > 0 && (
            <View
              className={cn(
                "px-3 py-2 rounded-xl",
                isUser
                  ? "bg-blue-500 rounded-br-md self-end"
                  : item.sender === 'ai' ? "bg-gray-200 rounded-bl-md self-start" : "bg-white rounded-bl-md self-start"
              )}
              style={{
                maxWidth: '95%',
                minWidth: 50,
              }}
              accessibilityRole="text"
              accessibilityLabel={`${isUser ? '我' : item.senderName || 'AI助手'}说：${item.text}`}
            >
              <Text
                className={cn(
                  "text-base leading-5",
                  isUser ? "text-white" : "text-black"
                )}
              >
                {item.text}
              </Text>
              {!!item.showAvatars &&
                <Text
                  className={cn(
                    "text-xs mt-1 opacity-70",
                    isUser ? "text-blue-100" : "text-gray-500"
                  )}
                >
                  {item.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              }
            </View>
          )}

          {/* 渲染图片内容 */}
          {item.images && item.images.length > 0 && renderMessageImages(item.images, isUser)}

          {/* 渲染卡片内容 */}
          {item.card && renderMessageCard(item.card, item)}

          {/* 渲染消息按钮 */}
          {!isUser && item.buttons && renderMessageButtons(item.buttons, item)}
        </View>

        {isUser && renderAvatar(item.avatar, true, item.senderName, item.sender)}
      </View>
    );
  };

  // 渲染输入区域
  const renderInputArea = () => (
    <View className="flex-row items-end bg-white border-t border-gray-200 px-3 py-2">
      <View className="flex-1 mr-2">
        <TextInput
          ref={inputRef}
          value={inputText}
          onChangeText={handleInputChange}

          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          editable={!disabled}

          className={cn(
            "bg-gray-100 rounded-xl px-3 py-2 text-base",
            "min-h-[40px] max-h-[100px]",
            disabled && "opacity-50"
          )}
          style={{
            textAlignVertical: 'center',
          }}
          accessibilityRole="text"
          accessibilityLabel="消息输入框"
          accessibilityHint="输入您要发送的消息，按回车键发送"
          accessibilityState={{ disabled }}
        />
      </View>

      <Pressable
        onPress={handleSend}
        disabled={!inputText.trim() || disabled}
        className={cn(
          "bg-[#007AFF] rounded-full w-10 h-10 items-center justify-center",
          (!inputText.trim() || disabled) && "opacity-50"
        )}
        accessibilityRole="button"
        accessibilityLabel="发送消息"
        accessibilityState={{ disabled: !inputText.trim() || disabled }}
      >
        <Ionicons
          name="send"
          size={16}
          color="white"
        />
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={cn("flex-1", className)}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={{ flex: 1 }}
      accessibilityRole="none"
    >
      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1 px-3 pt-2"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 4,
        }}
        accessibilityRole="list"
        accessibilityLabel="聊天消息列表"
        ListEmptyComponent={
          <View
            className="flex-1 items-center justify-center py-16"
            accessibilityRole="text"
            accessibilityLabel="开始聊天吧！发送第一条消息开始对话"
          >
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-base mt-3 text-center">
              开始聊天吧！
            </Text>
            <Text className="text-gray-400 text-sm mt-1 text-center">
              发送第一条消息开始对话
            </Text>
          </View>
        }
      />

      {/* 输入区域 */}
      {renderInputArea()}
    </KeyboardAvoidingView>
  );
}

// 聊天头部组件
interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  isOnline?: boolean;
  onBack?: () => void;
  onMore?: () => void;
  showAvatar?: boolean;
  showDrawerButton?: boolean;
}

export function ChatHeader({
  title,
  subtitle,
  avatar,
  isOnline = false,
  onBack,
  onMore,
  showAvatar = true,
  showDrawerButton = false,
}: ChatHeaderProps) {
  return (
    <View className="flex-row items-center bg-white border-b border-gray-200 px-3 py-2">
      {onBack && (
        <Pressable
          onPress={onBack}
          className="mr-2"
          accessibilityRole="button"
          accessibilityLabel="返回"
          accessibilityHint="返回上一页"
        >
          <Ionicons name="arrow-back" size={22} color="#007AFF" />
        </Pressable>
      )}

      <View className="flex-1 flex-row items-center">
        {showAvatar && (
          <Avatar
            source={avatar}
            name={title}
            size="medium"
            defaultAvatar="user"
            className="mr-2"
            showOnline={true}
            isOnline={isOnline}
          />
        )}

        <View className="flex-1">
          <Text className="text-base font-semibold text-black">{title}</Text>
          {subtitle && (
            <Text className="text-xs text-gray-500">{subtitle}</Text>
          )}
        </View>
      </View>

      {showDrawerButton && (
        <Pressable
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel="打开菜单"
          accessibilityHint="打开侧边菜单"
        >
          <Ionicons name="menu" size={22} color="#007AFF" />
        </Pressable>
      )}

      {!showDrawerButton && onMore && (
        <Pressable
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel="更多选项"
          accessibilityHint="查看更多选项"
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#007AFF" />
        </Pressable>
      )}
    </View>
  );
}
