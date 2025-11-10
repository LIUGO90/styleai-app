import React, { useState, useRef, useEffect } from "react";
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
  Dimensions,
  Alert,
  Modal,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { cn } from "../utils/cn";
import { Avatar } from "./Avatar";
import { shadowStyles } from "../utils/shadow";
import { useKeyboard } from "../hooks/useKeyboard";
import {
  Message,
  MessageButton,
  MessageImage,
  MessageCard,
  ChatProps,
} from "./types";
import { ImageUpload } from "./ImageUpload";
import { uploadImageWithFileSystem } from "@/services/FileUploadService";
import { Image } from "expo-image";
import { CircularProgress } from "./CircularProgress";
import { analytics } from "@/services/AnalyticsService";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useImagePicker } from "@/hooks/useImagePicker";
import { add } from "@amplitude/analytics-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { chatRequest } from "@/services/aiReuest";
import { addImageLook } from "@/services/addLookBook";
import paymentService from "@/services/PaymentService";
import { useCredits } from "@/hooks/usePayment";
import { useCredit } from "@/contexts/CreditContext";

const imageHeight = Math.max(180, Dimensions.get("window").height * 0.2);
const imageWidth = Dimensions.get("window").width * 0.4;
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

// 生成唯一ID的辅助函数
export const generateUniqueId = (prefix: string = "") => {
  return `${prefix}${Date.now()}_${(Math.random() * 10000).toString()}`;
};

export const createProgressMessage = (current: number, message?: string): Message => {
  return {
    id: generateUniqueId('progress_'),
    text: '',
    sender: 'ai',
    timestamp: new Date(),
    type: 'progress',
    progress: {
      current: current,
      total: 10,
      status: 'processing', // 'pending' | 'processing' | 'completed' | 'error'
      message: message || 'Putting together outfit for you...'
    }
  };
}

// 图片放大组件
const ZoomableImage: React.FC<{
  imageUrl: string;
  visible: boolean;
  onClose: () => void;
}> = ({ imageUrl, visible, onClose }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetValues = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event: any) => {
      scale.value = Math.max(0.5, Math.min(savedScale.value * event.scale, 3));
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event: any) => {
      if (scale.value > 1) {
        const maxTranslateX = (screenWidth * (scale.value - 1)) / 2;
        const maxTranslateY = (screenHeight * (scale.value - 1)) / 2;

        translateX.value = Math.max(
          -maxTranslateX,
          Math.min(maxTranslateX, savedTranslateX.value + event.translationX)
        );
        translateY.value = Math.max(
          -maxTranslateY,
          Math.min(maxTranslateY, savedTranslateY.value + event.translationY)
        );
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleClose = () => {
    resetValues();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <View className="flex-1 bg-black/90 justify-center items-center">
        {/* 关闭按钮 */}
        <Pressable
          onPress={handleClose}
          className="absolute top-16 right-4 z-10 bg-black/50 rounded-full w-16 h-16 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Close image"
        >
          <Ionicons name="close" size={28} color="white" />
        </Pressable>

        {/* 手势处理容器 */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={animatedStyle}>
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: screenWidth,
                height: screenHeight * 0.8,
              }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </Animated.View>
        </GestureDetector>

        {/* 背景点击关闭 */}
        <Pressable
          onPress={handleClose}
          className="absolute inset-0 -z-10"
          accessibilityRole="button"
          accessibilityLabel="Close image by tapping background"
        />
      </View>
    </Modal>
  );
};

// 图片组件，支持异步获取尺寸
export const ImageWithDimensions: React.FC<{
  image: MessageImage;
  isUser: boolean;
}> = ({ image, isUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);

  return (
    <View className={`mb-2 `}
    >
      <Pressable
        onPress={() => setShowZoomModal(true)}
        accessibilityRole="button"
        accessibilityLabel="Tap to zoom image"
        accessibilityHint="Double tap to view full size image"
      >
        <Image
          source={typeof image.url === "string" ? { uri: image.url } : image.url}
          style={{
            height: imageHeight,
            width: imageHeight >= 180 ? "auto" : 200,
            borderRadius: 12,
            backgroundColor: "#f0f0f0",
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          placeholder="https://via.placeholder.com/150x150?text=Loading..."
          placeholderContentFit="cover"
          onError={(error) => {

            setError(true);
            setLoading(false);
          }}
          onLoad={() => {

            setLoading(false);
            setError(false);
          }}
        />
      </Pressable>

      {loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text className="text-white text-xs">Loading...</Text>
        </View>
      )}

      {error && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f0f0f0',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text className="text-gray-500 text-xs">Image failed to load</Text>
        </View>
      )}
      {/* 
      {image.alt && (
        <Text
          className={cn(
            "text-xs mt-1 opacity-70",
            isUser ? "text-blue-100" : "text-gray-500",
          )}
        >
          {image.alt}
        </Text>
      )} */}

      {/* 图片放大模态 */}
      <ZoomableImage
        imageUrl={typeof image.url === "string" ? image.url : image.url.uri}
        visible={showZoomModal}
        onClose={() => setShowZoomModal(false)}
      />
    </View>
  );
};

// 消息管理辅助函数
const isMessageVisible = (message: Message): boolean => {
  return !message.isHidden;
};

const filterVisibleMessages = (messages: Message[]): Message[] => {
  return messages.filter(isMessageVisible);
};

export function Chat({
  chatType,
  currentSessionId,
  messages = [],
  onSendMessage,
  onTyping,
  onButtonPress,
  onImageUpload,
  placeholder = "Type a message...",
  sendButtonText = "Send",
  className,
  disabled = false,
  clickHighlight = "",
  canInput = false,
  setMessages,
  getMessage,
  hideMessage,
  updateMessage,
  addMessage,
  dateleMessage,
}: ChatProps) {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const { credits, loading: creditsLoading, refresh: refreshCredits } = useCredits();
  const { showCreditModal } = useCredit();
  
  const [isTyping, setIsTyping] = useState(false);
  const [selectedButtons, setSelectedButtons] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [deleteButtonPressed, setDeleteButtonPressed] = useState<string | null>(null);
  const [showCardImageZoom, setShowCardImageZoom] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 键盘显示时自动滚动到底部
  useEffect(() => {
    if (isKeyboardVisible && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [isKeyboardVisible, messages]);

  // 处理发送消息
  const handleSend = () => {
    if ((inputText.trim() || selectedImage.trim()) && !disabled) {
      const messageText = inputText.trim();
      const hasImage = selectedImage.trim().length > 0;

      // 检查用户积分是否足够
      // const requiredCredits = 10; // 需要10积分
      // const availableCredits = credits?.available_credits || 0;

      // if (availableCredits < requiredCredits) {
      //   Alert.alert(
      //     'Insufficient Credits',
      //     `This chat may generate images and requires ${requiredCredits} credits per request. You currently have ${availableCredits} credits. Please purchase more credits and try again.`,
      //     [
      //       {
      //         text: 'Buy Credits',
      //         onPress: () => showCreditModal(user?.id || '', "style_an_item_credit_insufficient")
      //       },
      //       {
      //         text: 'Cancel',
      //         style: 'cancel'
      //       }
      //     ]
      //   );
      //   return;
      // }

      // 追踪发送消息事件
      analytics.track('chat_message_sent', {
        has_text: messageText.length > 0,
        has_image: hasImage,
        text_length: messageText.length,
        source: 'chat_component',
      });

      handleSendMessage(messageText, selectedImage);
      setInputText("");
      setSelectedImage("");
      setIsTyping(false);
      onTyping?.(false);
      // 发送后收起键盘
      Keyboard.dismiss();
    }
  };

  const handleSendMessage = async (message: string, imageUri?: string) => {
    const usermessageId = generateUniqueId('user_');
    let newMessage: Message = {
      id: usermessageId,
      text: message,
      images: [],
      sender: "user",
      senderName: "用户",
      timestamp: new Date(),
    };
    if (imageUri && imageUri.length > 0) {
      newMessage.images = [
        {
          id: generateUniqueId('img_'),
          url: imageUri,
          alt: 'Garment Image',
        },
      ];
    }
    addMessage(newMessage);
    let progressMessage = createProgressMessage(1, "Analyzing your message...");
    addMessage(progressMessage);


    let image: string = '';
    if (imageUri && imageUri.length > 0) {

      if (imageUri.startsWith('http')) {
        image = imageUri;
      } else {
        // 上传图片到服务器
        image = await uploadImageWithFileSystem(user?.id || '', imageUri) || '';
      }

      newMessage.images = [{
        id: generateUniqueId('img_'),
        url: image,
        alt: 'Garment Image',
      },]
    }

    // 追踪发送消息
    const startTime = Date.now();
    analytics.track('chat_message_sent', {
      has_text: message.length > 0,
      has_image: imageUri && imageUri.length > 0,
      text_length: message.length,
      source: chatType,
      session_id: currentSessionId,
    });
    progressMessage.progress = {
      current: 5,
      total: 10,
      status: 'processing',
      message: 'Analyzing your message...',
    };
    updateMessage(progressMessage);

    chatRequest(user?.id || '', '', '', '', '', message, [image], currentSessionId).then(async ({ status, message, images }) => {
      const responseTime = Date.now() - startTime;
      // 追踪接收AI回复
      analytics.track('chat_message_received', {
        has_text: message.length > 0,
        has_images: images.length > 0,
        image_count: images.length,
        response_time_ms: responseTime,
        source: 'free_chat',
        session_id: currentSessionId,
      });

      dateleMessage(progressMessage.id);
      addMessage({
        id: Date.now().toString(),
        text: message,
        sender: 'ai',
        senderName: 'AI Assistant',
        timestamp: new Date(),
        images: images?.map((image: string) => ({
          id: generateUniqueId('img_'),
          url: image,
          alt: 'Garment Image',
        })),
      });
      if (images?.length > 0) {
        addImageLook(user?.id || "", chatType, images);
        // try {
        //   const deductSuccess = await paymentService.useCredits(
        //     user?.id || '',
        //     10 * images.length,
        //     'style_analysis',
        //     currentSessionId || '',
        //     `Style analysis for occasion: ${selectedButtons}`
        //   );

        //   if (deductSuccess) {
        //     console.log(`✅ [StyleAnItem] 成功扣除 ${10 * images.length} 积分`);
        //     await refreshCredits();
        //   } else {
        //     console.warn('⚠️ [StyleAnItem] 积分扣除失败，但图片已生成');
        //   }

        // } catch (error) {
        //   console.error('❌ [StyleAnItem] 积分扣除异常:', error);
        // }
      }
    });

  };

  // 处理输入变化
  const handleInputChange = (text: string) => {
    setInputText(text);
    const typing = text.length > 0;
    if (typing !== isTyping) {
      setIsTyping(typing);
      onTyping?.(typing);
    }
  };

  // 渲染头像组件
  // 支持用户、AI 和系统头像
  // 使用方法：
  // 1. 在 Message 对象中设置 avatar 字段（图片 URL）
  // 2. 设置 showAvatars: true 来显示头像
  // 3. 可选：设置 senderName 来显示发送者名称
  // 示例：
  // const message: Message = {
  //   id: '1',
  //   text: 'Hello!',
  //   sender: 'user',
  //   timestamp: new Date(),
  //   showAvatars: true,
  //   avatar: 'https://example.com/user-avatar.jpg',
  //   senderName: 'John Doe'
  // }
  const renderAvatar = (
    avatar?: string,
    isUser: boolean = false,
    senderName?: string,
    senderType?: "user" | "ai" | "system" | "other",
  ) => {
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
        name={senderName || (isUser ? "Me" : "AI")}
        size="small"
        defaultAvatar={defaultAvatarType}
        className={cn(isUser ? "ml-1" : "mr-1", "mt-2")}
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
            isSelected = true;
          }

          return (
            <Pressable
              key={button.id}
              onPress={() => clickButton(button, message)}
              className={cn(
                "px-3 py-1.5 rounded-lg border flex-shrink-0",
                button.type === "primary" && "bg-[#007AFF] border-[#007AFF]",
                button.type === "secondary" &&
                (isSelected
                  ? "bg-blue-500 border-blue-500"
                  : "bg-white border-gray-300"),
                button.type === "danger" && "bg-red-500 border-red-500",
                !button.type && "bg-white border-gray-300",
              )}
              accessibilityRole="button"
              accessibilityLabel={button.text}
              accessibilityHint={`Tap ${button.text}`}
            >
              <View className="flex-row items-center p-2">
                <Text
                  className={cn(
                    "text-sm font-medium",
                    button.type === "primary" && "text-white",
                    button.type === "secondary" && "text-gray-700",
                    button.type === "danger" && "text-white",
                    !button.type && "text-gray-700",
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
  const renderCommitButtons = (
    commitButton: MessageButton,
    message: Message,
  ) => {
    if (!commitButton) return null;

    return (
      <View className="mt-3 pt-3 border-gray-100">
        <Pressable
          onPress={() => onButtonPress?.(commitButton, message)}
          className={cn(
            "w-full py-2 rounded-lg border flex-row items-center justify-center",
            commitButton.type === "primary" && "bg-[#007AFF] border-[#007AFF]",
            commitButton.type === "secondary" && "bg-white border-gray-300",
            commitButton.type === "danger" && "bg-red-500 border-red-500",
            !commitButton.type && "bg-black border-gray-300",
          )}
          accessibilityRole="button"
          accessibilityLabel={commitButton.text}
          accessibilityHint={`Tap ${commitButton.text} to submit`}
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
              commitButton.type === "primary" && "text-white",
              commitButton.type === "secondary" && "text-gray-700",
              commitButton.type === "danger" && "text-white",
              !commitButton.type && "text-white",
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

    return (
      <View
        className={cn(
          "mt-2 flex-row gap-2",
          isUser ? "flex-end" : "flex-start"
        )}
      >

        {images.map((image) => {

          return (
            <View key={image.id} className={imageHeight > 180 ? "w-[180px]" : "w-[100px]"}>
              <ImageWithDimensions
                image={image}
                isUser={isUser}
              />
            </View>
          );
        })}
      </View>
    );
  };

  // 渲染进度条消息
  const renderMessageProgress = (progress: any, message: Message) => {
    if (!progress) return null;

    const percentage =
      progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

    return (
      <View className="mt-2">
        <CircularProgress
          size={50}
          strokeWidth={3}
          progress={percentage}
          status={progress.status}
          message={progress.message}
          showText={true}
          className="p-3 bg-gray-50 rounded-lg"
        />
      </View>
    );
  };

  /*
  使用示例：
  const progressMessage: Message = {
    id: 'progress-1',
    text: '',
    sender: 'ai',
    timestamp: new Date(),
    type: 'progress',
    progress: {
      current: 3,
      total: 10,
      status: 'processing',
      message: '正在生成您的搭配...'
    }
  };
  */

  // 渲染卡片消息
  const renderMessageCard = (card: MessageCard, message: Message, showCardImageZoom: boolean, setShowCardImageZoom: (show: boolean) => void) => {

    const handleImageSelect = (imageUri: string) => {

      onImageUpload?.onImageSelect?.(imageUri, message.id);

      // 上传到服务器
      // if (imageUri) {
      //   uploadImageWithFileSystem(imageUri).then((imageUrl) => {
      //     onImageUpload?.onImageSelect?.(imageUrl, message.id);
      //   });
      // }
    };

    const handleDeleteImage = () => {
      Alert.alert("Delete Image", "Are you sure you want to delete this image? You can upload a new one after deletion.", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onImageUpload?.onImageSelect?.("", message.id);
          },
        },
      ]);
    };

    const handleLongPress = () => {
      Alert.alert("Delete Image", "Long press the delete button to remove uploaded images", [
        { text: "Got it", style: "default" },
      ]);
    };

    return (
      <View
        className={cn(
          "bg-white rounded-xl overflow-hidden w-full mb-3",
          card.isShell === "circle" && "rounded-full border border-gray-200",
          card.isShell !== "none" && "mt-2 border border-gray-200",
        )}
      >
        {/* 渲染图片 */}
        {card.image && (
          <View className="relative overflow-hidden bg-gray-50">
            <Pressable
              onPress={() => setShowCardImageZoom(true)}
              accessibilityRole="button"
              accessibilityLabel="Tap to zoom image"
              accessibilityHint="Tap to view full size image"
            >
              <Image
                source={{ uri: card.image }}
                style={{
                  width: "100%",
                  height: imageHeight,
                }}
                resizeMode="contain"
                cachePolicy="memory-disk"
              />
            </Pressable>
            {card.uploadImage && !card.isDeleted && (
              <Pressable
                onPress={handleDeleteImage}
                // onLongPress={handleLongPress}
                // onPressIn={() => setDeleteButtonPressed(message.id)}
                // onPressOut={() => setDeleteButtonPressed(null)}
                className={cn(
                  "absolute top-3 right-3 backdrop-blur-sm rounded-full w-8 h-8 items-center justify-center border border-white/20",
                  deleteButtonPressed === message.id
                    ? "bg-red-500/90"
                    : "bg-black/70",
                )}
                accessibilityRole="button"
                accessibilityLabel="Delete image"
                accessibilityHint="Tap to delete uploaded image, long press for help"
                style={shadowStyles.medium}
              >
                <Ionicons name="trash-outline" size={14} color="white" />
              </Pressable>
            )}
          </View>
        )}

        {card.uploadImage && !card.image && (
          <ImageUpload
            onImageSelect={handleImageSelect}
            placeholder="Upload Styling Picture"
          />
        )}

        <View className="p-3">
          {card.title.length > 0 && (
            <Text className="text-sm font-semibold text-black mb-1">
              {card.title}
            </Text>
          )}
          {card.subtitle.length > 0 && (
            <Text className="text-xs text-gray-500 mb-2">{card.subtitle}</Text>
          )}
          {card.description.length > 0 && (
            <Text className="text-sm text-gray-700 mb-3">
              {card.description}
            </Text>
          )}

          {card.buttons && renderMessageButtons(card.buttons, message)}
          {card.commitButton && renderCommitButtons(card.commitButton, message)}
        </View>

        {/* 卡片图片放大模态 */}
        {card.image && (
          <ZoomableImage
            imageUrl={card.image}
            visible={showCardImageZoom}
            onClose={() => setShowCardImageZoom(false)}
          />
        )}
      </View>
    );
  };

  // 渲染消息气泡
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    const isAi = item.sender === "ai";

    return (
      <View
        className={cn(
          "flex-row mb-3 items-start",
          isUser ? "justify-end" : "justify-start",
        )}
      >
        {isAi &&
          !!item.showAvatars &&
          renderAvatar(item.avatar, false, item.senderName, item.sender)}

        <View className={cn("flex-1", isUser ? "items-end" : "items-start")}>
          {/* 显示发送者名称 */}
          {!isUser && !!item.showAvatars && item.senderName && (
            <Text className="text-sm text-gray-500 mb-1 ml-1">
              {item.senderName}
            </Text>
          )}
          {isUser && !!item.showAvatars && item.senderName && (
            <Text className="text-sm text-gray-500 mb-1 mr-1">
              {item.senderName}
            </Text>
          )}

          {/* 渲染文本内容 */}
          {item.text.length > 0 && (
            <View
              className={cn(
                "px-2 rounded-xl",
                isUser
                  ? "bg-blue-500 rounded-br-md self-end"
                  : item.sender === "ai"
                    ? "bg-gray-200 rounded-bl-md self-start"
                    : "bg-white rounded-bl-md self-start",
              )}
              style={{
                maxWidth: "95%",
                minWidth: 50,
              }}
              accessibilityRole="text"
              accessibilityLabel={`${isUser ? "Me" : item.senderName || "AI Assistant"} said: ${item.text}`}
            >
              <Text
                className={cn(
                  "p-2 my-2",
                  "text-lg leading-5",
                  isUser ? "text-white" : "text-black",
                )}
              >
                {item.text}
              </Text>
              {!!item.showAvatars && (
                <Text
                  className={cn(
                    "text-xs mt-1 opacity-70",
                    isUser ? "text-blue-100" : "text-gray-500",
                  )}
                >
                  {item.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              )}
            </View>
          )}

          {/* 渲染图片内容 */}
          {item.images && item.images.length > 0 &&
            <>
              {renderMessageImages(item.images, isUser)}
            </>}

          {/* 渲染卡片内容 */}
          {item.card && renderMessageCard(item.card, item, showCardImageZoom, setShowCardImageZoom)}

          {/* 渲染进度条内容 */}
          {item.progress && renderMessageProgress(item.progress, item)}

          {/* 渲染消息按钮 */}
          {!isUser && item.buttons && renderMessageButtons(item.buttons, item)}
        </View>

        {/* 渲染用户头像 */}
        {isUser &&
          !!item.showAvatars &&
          renderAvatar(item.avatar, true, item.senderName, item.sender)
        }
      </View>
    );
  };
  // 使用图片选择 hook
  const { showImagePickerOptions } = useImagePicker({
    onImageSelected: (imageUri: string) => {
      setSelectedImage(imageUri);
    },
  })
  // 渲染输入区域
  const renderInputArea = () => (
    <View className="flex-col items-center justify-between rounded-2xl w-full  bg-white border-gray-300 mb-4">
      {selectedImage && (
        <View className="w-full flex-row items-start justify-start mb-3 px-2">
          <View className="relative w-[25%]">
            <Image
              source={{ uri: selectedImage }}
              style={{
                height: 180,
                width: "100%",
                borderRadius: 16,
                borderWidth: 2,
                borderColor: "#D1D5DB",
              }}
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => setSelectedImage("")}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View
        className="flex-row items-center justify-between rounded-full w-[95%] bg-white border-gray-300 px-2 py-2 border-2 mx-2"
      >
        <TouchableOpacity
          className="bg-gray-200 rounded-xl p-2 flex-row items-center justify-center"
          onPress={showImagePickerOptions}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="camera" size={24} color="gray-500" />
        </TouchableOpacity>

        <View className="flex-1 mx-2 rounded-xl border border-gray-200 max-w-[95%]">
          <TextInput
            ref={inputRef}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            // maxLength={windowWidth}
            editable={!disabled}
            className={cn(
              "bg-gray-100 rounded-xl p-2 text-lg",
              "min-h-[45px] max-h-[100px] ",
              disabled && "opacity-50",
            )}
            style={{
              textAlignVertical: "center",
            }}
            accessibilityRole="text"
            accessibilityLabel="add styling message..."
            accessibilityHint="Type your message and press send to submit"
            accessibilityState={{ disabled }}
          />
        </View>

        <Pressable
          onPress={handleSend}
          disabled={(!inputText.trim() && !selectedImage.trim()) || disabled}
          className={cn(
            "bg-[#007AFF] rounded-full w-12 h-12 items-center justify-center",
            ((!inputText.trim() && !selectedImage.trim()) || disabled) && "opacity-50",
          )}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: (!inputText.trim() && !selectedImage.trim()) || disabled }}
        >
          <Ionicons name="airplane" size={26} color="white" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={"padding"}
      className={cn("flex-1")}
      accessibilityRole="none"
    >
      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={filterVisibleMessages(messages)}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1 p-3 mb-10"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 4,
        }}
        onContentSizeChange={() => {
          // 当内容大小变化时自动滚动到底部
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }}
        accessibilityRole="list"
        accessibilityLabel="Chat messages list"
        ListEmptyComponent={
          <View
            className="flex-1 items-center justify-center py-16"
            accessibilityRole="text"
            accessibilityLabel="Start chatting! Send your first message to begin"
          >
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-base mt-3 text-center">
              Start chatting!
            </Text>
            <Text className="text-gray-400 text-sm mt-1 text-center">
              Send your first message to begin
            </Text>
          </View>
        }
      />

      {/* 输入区域 */}
      {canInput && renderInputArea()}
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
  onStar?: () => void;
  showAvatar?: boolean;
  showDrawerButton?: boolean;
  startNumber?: number;
}

export function ChatHeader({
  title,
  subtitle,
  avatar,
  isOnline = false,
  onBack,
  onMore,
  showAvatar,
  showDrawerButton = false,
  onStar,
  startNumber = 0,
}: ChatHeaderProps) {
  return (
    <View className="flex-row items-center bg-transparent border-b border-gray-200 px-4 py-2">
      {onBack && (
        <Pressable
          onPress={onBack}
          className="mr-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous page"
        >
          <Ionicons name="arrow-back" size={28} color="black" />
        </Pressable>
      )}

      {showDrawerButton && (
        <Pressable
          className="mx-1"
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          accessibilityHint="Open side menu"
        >
          <Ionicons name="menu" size={28} color="black" />
        </Pressable>
      )}

      <View className="flex-1 flex-row items-center mx-4">
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
          <Text
            className="text-xl font-semibold text-black"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="text-xs text-gray-500"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {!showDrawerButton && onMore && (
        <Pressable
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel="More options"
          accessibilityHint="View more options"
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#007AFF" />
        </Pressable>
      )}
      {onStar && (
        <Pressable
          onPress={onStar}
          accessibilityRole="button"
          accessibilityLabel="Star"
          accessibilityHint="Star"
        >
          <View className="flex-row items-center justify-center">
            <MaterialCommunityIcons name="star-outline" size={22} color="#FFA500" />
            <Text className="text-base text-black mx-1">{startNumber}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

