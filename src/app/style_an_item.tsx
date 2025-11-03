import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Chat, ChatHeader, createProgressMessage } from '@/components/Chat';
import { Message, MessageButton, ImageUploadCallback, OnboardingData } from '@/components/types';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiRequest, aiRequestGemini, aisuggest, chatRequest } from '@/services/aiReuest';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { ChatSessionService, ChatSession } from '@/services/ChatSessionService';
import { uploadImageWithFileSystem } from '@/services/FileUploadService';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from "react-native-safe-area-context";
import { addImageLook } from '@/services/addLookBook';
import { useCredits } from '@/hooks/usePayment';
import { useCredit } from '@/contexts/CreditContext';
import paymentService from '@/services/PaymentService';
import { analytics } from '@/services/AnalyticsService';

// 生成唯一ID的辅助函数
const generateUniqueId = (prefix: string = '') => {
  return `${prefix}${Date.now()}_${(Math.random() * 10000).toString()}`;
};


export const buttons: MessageButton[] = [
  {
    id: 'card_btn1',
    text: 'Work',
    type: 'secondary',
    action: 'add_to_cart'
  },
  {
    id: 'card_btn2',
    text: 'Casual',
    type: 'secondary',
    action: 'add_to_cart'
  },
  {
    id: 'card_btn3',
    text: 'Date',
    type: 'secondary',
    action: 'add_to_cart'
  },
  {
    id: 'card_btn4',
    text: 'Cocktail',
    type: 'secondary',
    action: 'add_to_cart'
  },
  {
    id: 'card_btn5',
    text: 'Vacation',
    type: 'secondary',
    action: 'add_to_cart'
  },
  {
    id: 'card_btn6',
    text: '🎲',
    type: 'secondary',
    action: 'random'
  }
]

const initMessages: Message[] = [
  {
    id: '1',
    text: `Style an Item`,
    sender: 'user',
    senderName: 'Me',
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: '2',
    text: `Sure! Please upload the photo of your garment and tell me more the occasion`,
    sender: 'system',
    senderName: 'AI Assistant',
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: '3',
    text: '',
    sender: 'system',
    senderName: 'AI Assistant',
    timestamp: new Date(Date.now() - 60000),
    type: 'card',
    card: {
      id: 'card1',
      title: '',
      subtitle: '',
      description: 'What occasion would you wear this for？',
      uploadImage: true, // Enable image upload functionality
      buttons: buttons,
      commitButton: {
        id: 'commit_btn',
        text: 'Generate My Outfit',
        action: 'confirm_selection'
      }
    }
  }
]

const deepClone = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  const cloned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
};


export default function StyleAnItemScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { imageUrl } = useLocalSearchParams<{ imageUrl?: string }>();

  const [selectedButtons, setSelectedButtons] = useState<string>("");
  const selectedImageRef = useRef<string>("");
  const selectedIdRef = useRef<string>("");
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [canInput, setCanInput] = useState<boolean>(false);

  // 积分相关状态
  const { credits, loading: creditsLoading, refresh: refreshCredits } = useCredits();
  const { showCreditModal } = useCredit();
  
  // 页面浏览追踪
  useFocusEffect(
    useCallback(() => {
      analytics.page('style_an_item', {
        category: 'features',
        source: 'drawer',
      });
    }, [])
  );

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
      selectedImageRef.current = '';
      selectedIdRef.current = '3';
      setSelectedButtons('');

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
        if (session.messages.length > 3) {
          const messageZero = session.messages.find(msg => msg.id === '0');
          setJobId(messageZero?.text || '');
        }
        // 检查是否有上传的图片
        const messageWithImage = session.messages.find(msg =>
          msg.card && msg.card.image && msg.card.image !== ''
        );
        if (messageWithImage && messageWithImage.card && messageWithImage.card.image) {
          selectedImageRef.current = messageWithImage.card.image;
          selectedIdRef.current = messageWithImage.id;
          setSelectedButtons(messageWithImage.card.selectedButton || '');
        }
        if (session.messages.length > 3) {
          setCanInput(true);
        }
      } else {
        // 如果是新会话，设置初始消息

        if (imageUrl) {
          selectedImageRef.current = imageUrl;
          selectedIdRef.current = '3';
          const messagesTmp = deepClone(initMessages);

          // 修复：initMessages只有3个元素（索引0-2），应该访问索引2
          if (messagesTmp[2] && messagesTmp[2].card) {
            messagesTmp[2].card.image = selectedImageRef.current;
          }
          setMessages(messagesTmp);

        } else {
          setMessages(initMessages);
        }
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

  const getMessage = (messageId: string) => {
    return messages.find(msg => msg.id === messageId);
  }

  const hideMessage = (messageId: string) => {

    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isHidden: true } : msg));
  }

  const updateMessage = (message: Message) => {

    setMessages(prev => prev.map(msg => msg.id === message.id ? message : msg));
  }

  const addMessage = (message: Message) => {

    setMessages(prev => [...prev, message]);
  }

  const dateleMessage = (messageId: string) => {

    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }

  const handleSendMessage = async (text: string, imageUri?: string) => {
    const usermessageId = generateUniqueId('user_');
    let newMessage: Message = {
      id: usermessageId,
      text,
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
    setMessages((prev) => [...prev, newMessage]);
    let progressMessage = createProgressMessage(1, "Analyzing your message...");
    addMessage(progressMessage);
    let image: string = '';
    if (imageUri && imageUri.length > 0) {
      image = await uploadImageWithFileSystem(user?.id || '', imageUri) || '';
      newMessage.images = [{
        id: generateUniqueId('img_'),
        url: image,
        alt: 'Garment Image',
      },]
    }

    // 追踪发送消息
    const startTime = Date.now();
    analytics.track('chat_message_sent', {
      has_text: text.length > 0,
      has_image: imageUri && imageUri.length > 0,
      text_length: text.length,
      source: 'style_an_item',
      session_id: currentSession?.id || null,
    });

    progressMessage.progress = {
      current: 5,
      total: 10,
      status: 'processing',
      message: 'Analyzing your message...',
    };
    updateMessage(progressMessage);
    const { message, images } = await chatRequest(user?.id || '', '', '', '', '', text, [image], currentSession?.id || '');
    dateleMessage(progressMessage.id);
    
    const responseTime = Date.now() - startTime;
    
    // 追踪接收AI回复
    analytics.track('chat_message_received', {
      has_text: message.length > 0,
      has_images: images.length > 0,
      image_count: images.length,
      response_time_ms: responseTime,
      source: 'style_an_item',
      session_id: currentSession?.id || null,
    });
    
    addMessage({
      id: Date.now().toString(),
      text: message,
      sender: 'ai',
      senderName: 'AI Assistant',
      timestamp: new Date(),
      images: images.map(image => ({
        id: generateUniqueId('img_'),
        url: image,
        alt: 'Garment Image',
      })),
    });

    if (images.length > 0) {
      addImageLook(user?.id || "", "chat", images);
    }
  };


  const handleButtonPress = async (button: MessageButton, message: Message) => {

    const messageId = message.id;
    // Handle different logic based on button action
    switch (button.action) {
      case 'style_an_item':

        router.push('/tabs/styling/style_an_item');
        break;
      case 'outfit_check':

        // 可以添加其他页面的跳转
        router.push('/tabs/styling/outfit_check');
        break;
      case 'generate_ootd':

        // 可以添加其他页面的跳转
        router.push('/tabs/styling/generate_ootd');
        break;

      case 'change_accessories':
        // 生成新的配置
        const message2 = initMessages[2];
        message2.id = generateUniqueId('msg_');
        addMessage(message2);
        selectedIdRef.current = message2.id;

        // 清空卡片状态信息
        setSelectedButtons('');
        selectedImageRef.current = ""
        selectedIdRef.current = ""
        break;

      case 'confirm_selection':

        if (selectedImageRef.current === '') {
          Alert.alert('Please upload an image' + selectedImageRef.current);
          return;
        }
        if (selectedButtons === '') {
          Alert.alert('Please select an occasion');
          return;
        }
        dateleMessage(selectedIdRef.current);
        const usermessageId = generateUniqueId('user_');
        let newMessage: Message = {
          id: usermessageId,
          text: "",
          images: [],
          sender: "user",
          senderName: "用户",
          timestamp: new Date(),
        };
        newMessage.images = [
          {
            id: generateUniqueId('img_'),
            url: selectedImageRef.current,
            alt: 'Garment Image',
          },
        ];
        setMessages((prev) => [...prev, newMessage]);
        let progressMessage1 = createProgressMessage(1, "Analyzing your message...");
        addMessage(progressMessage1);
        let image: string = '';
        if (selectedImageRef.current &&
          selectedImageRef.current.length > 0
        ) {
          if (selectedImageRef.current.startsWith('http')) {
            image = selectedImageRef.current;
          } else {
            image = await uploadImageWithFileSystem(user?.id || '', selectedImageRef.current) || '';
          }
          newMessage.images = [{
            id: generateUniqueId('img_'),
            url: image,
            alt: 'Garment Image',
          },]

          updateMessage(newMessage);
        }

        // 检查用户积分是否足够（第一次AI请求）
        const requiredCreditsFirst = 20; // 第一次AI请求需要10积分
        const availableCreditsFirst = credits?.available_credits || 0;

        if (availableCreditsFirst < requiredCreditsFirst) {
          Alert.alert(
            'Insufficient Credits',
            `Style analysis requires ${requiredCreditsFirst} credits, but you only have ${availableCreditsFirst} credits. Please purchase more credits and try again.`,
            [
              {
                text: 'Buy Credits',
                onPress: () => showCreditModal(user?.id || '', "style_an_item_credit_insufficient")
              },
              {
                text: 'Cancel',
                style: 'cancel'
              }
            ]
          );
          return;
        }

        progressMessage1.progress = {
          current: 5,
          total: 10,
          status: 'processing',
          message: 'Analyzing your message...',
        };
        updateMessage(progressMessage1);
        let images: string[] = [];
        const onboardingData = await AsyncStorage.getItem("onboardingData");
        if (onboardingData) {
          const data: OnboardingData = JSON.parse(onboardingData);
          images = [data.fullBodyPhoto];
          images.push(image);

          chatRequest(user?.id || '',
            data.bodyType,
            data.bodyStructure,
            data.skinTone,
            selectedButtons,
            "",
            images, currentSession?.id || '').then(async ({ status, message, images }) => {
              if (status == "success") {
                // 成功生成图片后，扣除积分
                try {
                  const deductSuccess = await paymentService.useCredits(
                    user?.id || '',
                    requiredCreditsFirst,
                    'style_analysis',
                    currentSession?.id || '',
                    `Style analysis for occasion: ${selectedButtons}`
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

                dateleMessage(progressMessage1.id);
                addMessage({
                  id: Date.now().toString(),
                  text: message,
                  sender: 'ai',
                  senderName: 'AI Assistant',
                  timestamp: new Date(),
                  images: images.map(image => ({
                    id: generateUniqueId('img_'),
                    url: image,
                    alt: 'Garment Image',
                  })),
                });
                addImageLook(user?.id || "", selectedButtons, images);
              } else {
                dateleMessage(progressMessage1.id);
                Alert.alert('AI request failed');
              }
            });

        }
        setCanInput(true);
        break;
      case 'generate_more_outfit':
        const jobId2 = button.data;
        hideMessage(messageId);
        // 进度消息 1
        let progressMessage2: Message = {
          id: generateUniqueId('progress_'),
          text: '',
          sender: 'ai',
          timestamp: new Date(),
          type: 'progress',
          progress: {
            current: 1,
            total: 10,
            status: 'processing', // 'pending' | 'processing' | 'completed' | 'error'
            message: 'Putting together outfit for you...'
          }
        };
        addMessage(progressMessage2);

        // 进度消息 2
        progressMessage2.progress!.current = 5;
        dateleMessage(progressMessage2.id)
        const aiResponse = await aisuggest(jobId2, 1);
        if (!aiResponse || aiResponse.jobId === 'error') {
          Alert.alert('AI request failed');
          return;
        }

        const suggestTwo: Message = {
          id: generateUniqueId('suggest_'),
          // text: `Your selection has been confirmed! Generating outfit suggestions...`,
          text: aiResponse.message,
          sender: 'ai',
          senderName: 'AI Assistant',
          timestamp: new Date(),
          showAvatars: true,

        };
        addMessage(suggestTwo);

        addMessage(progressMessage2);

        // 检查用户积分是否足够
        const requiredCredits = 20; // 需要20积分
        const availableCredits = credits?.available_credits || 0;

        if (availableCredits < requiredCredits) {
          Alert.alert(
            'Insufficient Credits',
            `Outfit generation requires ${requiredCredits} credits, but you only have ${availableCredits} credits. Please purchase more credits and try again.`,
            [
              {
                text: 'Buy Credits',
                onPress: () => showCreditModal(user?.id || '', "style_an_item_credit_insufficient")
              },
              {
                text: 'Cancel',
                style: 'cancel'
              }
            ]
          );
          return;
        }

        const resultGemini2 = await aiRequestGemini(user?.id || '', jobId2, 1);
        if (resultGemini2.length === 0) {
          Alert.alert('AI request failed');
          return;
        }

        const GeminiMessage2: Message = {
          id: generateUniqueId('gemini2_'),
          text: "",
          sender: 'ai',
          senderName: 'AI Assistant',
          timestamp: new Date(),
          showAvatars: true,
          images: []
        };

        // 成功生成图片后，扣除积分
        try {
          const deductSuccess = await paymentService.useCredits(
            user?.id || '',
            requiredCredits,
            'outfit_generation',
            jobId2 || null,
            `Generated outfit for occasion: ${selectedButtons}`
          );

          if (deductSuccess) {
            console.log(`✅ [StyleAnItem] 成功扣除 ${requiredCredits} 积分`);
            // 刷新积分信息
            await refreshCredits();
          } else {
            console.warn('⚠️ [StyleAnItem] 积分扣除失败，但图片已生成');
          }
        } catch (creditError) {
          console.error('❌ [StyleAnItem] 积分扣除异常:', creditError);
        }

        for (const image of resultGemini2) {
          GeminiMessage2.images!.push({
            id: generateUniqueId('img_'),
            url: image,
          });
        }
        dateleMessage(progressMessage2.id)
        addMessage(GeminiMessage2);

        break;

      case 'add_to_cart':

        setSelectedButtons(button.text);
        const message0 = getMessage(selectedIdRef.current) as Message;
        if (message0 && message0.card) {
          message0.card.selectedButton = button.text;
        }
        updateMessage(message0);
        break;
      case 'random':

        // Generate random number
        const randomNumber = Math.floor(Math.random() * 5);
        // Set button text based on number
        const buttonText = buttons[randomNumber].text;
        setSelectedButtons(buttonText);

        const message1 = getMessage(selectedIdRef.current) as Message;
        if (message1 && message1.card) {
          message1.card.selectedButton = button.text;
        }
        updateMessage(message1);
        break;
    }
  }

  const handleImageUpload: ImageUploadCallback = {
    onImageSelect: (imageUri: string, messageId?: string) => {

      if (messageId) {
        selectedImageRef.current = imageUri;
        // 直接更新指定消息的卡片图片
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId && msg.card) {
            return {
              ...msg,
              card: {
                ...msg.card,
                image: imageUri || undefined // 如果 imageUri 为空字符串，则删除图片
              }
            };
          }
          return msg;
        }));
      }
    },
    onImageUpload: async (imageUri: string) => {
      // 模拟图片上传到服务器
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('https://example.com/uploaded/' + Date.now() + '.jpg');
        }, 2000);
      });
    },
    onImageError: (error: string) => {
      Alert.alert('Upload failed', error);
    }
  };

  const handleDrawerOpen = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* <View style={{ flex: 1 }}> */}
      <ChatHeader
        title={currentSession?.title || "Style an item"}
        // subtitle="检查您的搭配是否合适"
        isOnline={true}
        showAvatar={false}
        onBack={() => {
          router.replace({
            pathname: "/tabs/",
          });
        }}
        //   onMore={handleDrawerOpen}
        showDrawerButton={false}
      />

      <Chat
        messages={messages}
        onSendMessage={handleSendMessage}
        onButtonPress={handleButtonPress}
        onImageUpload={handleImageUpload}
        placeholder="Type a message..."
        showAvatars={true}
        clickHighlight={selectedButtons}
        canInput={canInput}
      />
      {/* </View> */}
    </SafeAreaView>
  );
}


