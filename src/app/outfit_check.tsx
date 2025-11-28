import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chat, ChatHeader, createProgressMessage } from "@/components/Chat";
import {
  Message,
  MessageButton,
  ImageUploadCallback,
  OnboardingData,
} from "@/components/types";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImageForGeminiAnalyze, uploadImageWithFileSystem } from "@/services/FileUploadService";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { ChatSession, ChatSessionService } from "@/services/ChatSessionService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatRequest } from "@/services/aiReuest";
import { useCredits } from "@/hooks/usePayment";
import { useCredit } from "@/contexts/CreditContext";
import { addImageLook } from "@/services/addLookBook";
import { useMessages } from "@/hooks/useMessages";
import paymentService from "@/services/PaymentService";
import analytics from "@/services/AnalyticsService";

// 生成唯一ID的辅助函数
const generateUniqueId = (prefix: string = "") => {
  return `${prefix}${Date.now()}_${(Math.random() * 10000).toString()}`;
};

const initMessages: Message[] = [
  {
    id: "1",
    text: "Outfit Check",
    sender: "user",
    senderName: "AI",
    timestamp: new Date(Date.now() - 60000),
    showAvatars: true,
  },
  {
    id: "2",
    text: "Sure!  Send me photo of your outfit today.",
    sender: "system",
    timestamp: new Date(Date.now() - 60000),
    showAvatars: false,
  },
  {
    id: "3",
    text: "",
    sender: "ai",
    senderName: "AI",
    timestamp: new Date(Date.now() - 30000),
    showAvatars: false,
    card: {
      id: "card1",
      title: "",
      subtitle: "",
      description: "",
      uploadImage: true, // 启用图片上传功能
    },
  },
];
export default function OutfitCheckScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [canInput, setCanInput] = useState<boolean>(false);
  const { credits, loading: creditsLoading, refresh: refreshCredits } = useCredits();
  const { showCreditModal } = useCredit();
  const { messages, setMessages, getMessage, hideMessage, updateMessage, addMessage, dateleMessage } = useMessages();

  // 加载当前会话
  useEffect(() => {
    loadCurrentSession();
  }, [sessionId]);

  // 当消息更新时，保存到会话
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      // 避免在会话切换时立即保存
      const timer = setTimeout(() => {
        saveMessagesToSession();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, currentSession]);

  const loadCurrentSession = async () => {
    try {

      // 重置状态，避免会话切换时的混淆
      setMessages([]);

      let session: ChatSession | null = null;
      if (sessionId) {
        // 如果路由参数中有sessionId，加载指定会话
        session = await ChatSessionService.getSession(sessionId);
      }

      if (session) {

        await ChatSessionService.setCurrentSession(session.id);
      }


      setCurrentSession(session);

      // 如果会话中有消息，加载会话消息
      if (session && session.messages && session.messages.length > 0) {

        setMessages(session.messages);
        if (session.messages.length > 4) {
          setCanInput(true);
        }
      } else {
        // 如果是新会话，设置初始消息

        setMessages(initMessages);
      }

    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const saveMessagesToSession = async () => {

    if (currentSession) {
      try {
        await ChatSessionService.updateSessionMessages(currentSession.id, messages);
        // 触发会话列表刷新
        triggerSessionListRefresh();
      } catch (error) {
        console.error('Failed to save messages to session:', error);
      }
    }
  };
  // 触发会话列表刷新（通过 AsyncStorage 标志）
  const triggerSessionListRefresh = () => {
    AsyncStorage.setItem('sessionListRefresh', Date.now().toString());
  };


  const handleSendMessage = async (text: string, imageUri?: string) => {

  };



  const handleImageUpload: ImageUploadCallback = {
    onImageSelect: async (imageUri: string, messageId?: string) => {

      const requiredCreditsFirst = 10; // 第一次AI请求需要10积分
      const availableCreditsFirst = credits?.available_credits || 0;
      if (availableCreditsFirst < requiredCreditsFirst) {
        analytics.credits('insufficient', {
          required_credits: requiredCreditsFirst,
          available_credits: availableCreditsFirst,
          source: 'outfit_check',
          session_id: currentSession?.id || '',
        });
        Alert.alert(
          'Insufficient Credits',
          `Outfit analysis requires ${requiredCreditsFirst} credits, but you only have ${availableCreditsFirst} credits. Please purchase more credits and try again.`,
          [
            {
              text: 'Buy Credits',
              onPress: () => showCreditModal(user?.id || '', "outfit_check_credit_insufficient")
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }


      if (messageId) {
        // 直接更新指定消息的卡片图片
        setMessages((prev: Message[]) => prev.map((msg: Message) => {
          if (msg.id === messageId && msg.card) {
            return {
              ...msg,
              card: {
                isDeleted: true,
                ...msg.card,
                image: imageUri || undefined // 如果 imageUri 为空字符串，则删除图片
              }
            };
          }
          return msg;
        }));
      }


      let progressMessage = createProgressMessage(5, "Analyzing your outfit...");
      addMessage(progressMessage);
      analytics.chat('image_uploading', {
        has_image: imageUri && imageUri.length > 0,
        source: 'outfit_check',
        session_id: currentSession?.id || '',
      });

      let image: string = '';
      if (imageUri.startsWith('http')) {
        image = imageUri;
      } else {
        image = await uploadImageWithFileSystem(user?.id || '', imageUri) || '';
      }
      analytics.chat('send', {
        has_text: 0,
        has_images: 0,
        image_count: 0,
        source: 'style_an_item',
        session_id: currentSession?.id || '',
      });
      let images: string[] = [];
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const data: OnboardingData = JSON.parse(onboardingData);
        images = [data.fullBodyPhoto];
        images.push(image);


        // uploadImageForGeminiAnalyze(user?.id || '', imageUri || '').then(({ message, image, uploadedImage }) => {
        await chatRequest('outfitcheck', user?.id || '',
          data.bodyType,
          data.bodyStructure,
          data.skinTone,
          "",
          "",
          images, currentSession?.id || '').then(async ({ status, message, images }) => {
            analytics.chat('image_uploaded', {
              has_image: image && image.length > 0,
              source: 'outfit_check',
              session_id: currentSession?.id || '',
            });

            dateleMessage('3')
            dateleMessage(progressMessage.id);
            addMessage({
              id: generateUniqueId('msg_'),
              text: "",
              sender: 'user',
              images: [
                ...(images ? [{
                  id: generateUniqueId('img_'),
                  url: image,
                  alt: 'Garment Image',
                }] : []),
              ],
              timestamp: new Date(),
            });
            addMessage({
              id: generateUniqueId('msg_'),
              text: "",
              sender: 'ai',
              images: [
                ...(image ? [{
                  id: generateUniqueId('img_'),
                  url: image,
                  alt: 'Garment Image',
                }] : []),
              ],
              timestamp: new Date(),
            });
            addMessage({
              id: generateUniqueId('msg_'),
              text: message,
              sender: 'ai',
              timestamp: new Date(),
            });

            if (image.length > 0) {
              addImageLook(user?.id || "", Date.now().toString(), 'outfit_check', [image], {
                state: 'success'
              });

              // 成功生成图片后，扣除积分
              try {
                const deductSuccess = await paymentService.useCredits(
                  user?.id || '',
                  requiredCreditsFirst,
                  'style_analysis',
                  currentSession?.id || '',
                  `Outfit check for occasion: ${currentSession?.title || ''}`
                );

                if (deductSuccess) {
                  console.log(`✅ [StyleAnItem] 成功扣除 ${requiredCreditsFirst} 积分`);
                  // 刷新积分信息
                  await refreshCredits();
                } else {
                  console.warn('⚠️ [StyleAnItem] 积分扣除失败，但图片已生成');
                }
              } catch (creditError) {
                console.error('❌ [StyleAnItem] 积分扣除异常:', creditError);
              }
            }
          });
      }
      setCanInput(true);

    },
    onImageUpload: async (imageUri: string) => {
      // 模拟图片上传到服务器
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve("https://example.com/uploaded/" + Date.now() + ".jpg");
        }, 2000);
      });
    },
    onImageError: (error: string) => {
      Alert.alert("上传失败", error);
    },
  };

  const handleDrawerOpen = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView className="flex-1 bg-white" >
      <ChatHeader
        title={currentSession?.title || "Outfit Check"}
        // subtitle="AI智能搭配分析"
        isOnline={true}
        showAvatar={false}
        onBack={() => {
          router.replace({
            pathname: "/tabs/",
          });
        }}
        // onMore={handleDrawerOpen}
        showDrawerButton={false}
      />

      <Chat
        messages={messages}
        currentSessionId={currentSession?.id || ''}
        chatType="outfitcheck"
        setMessages={setMessages}
        getMessage={getMessage}
        hideMessage={hideMessage}
        updateMessage={updateMessage}
        addMessage={addMessage}
        dateleMessage={dateleMessage}
        onSendMessage={handleSendMessage}
        onImageUpload={handleImageUpload}
        placeholder="Describe outfit ..."
        showAvatars={false}
        canInput={canInput}
      />
    </SafeAreaView >
  );
}
