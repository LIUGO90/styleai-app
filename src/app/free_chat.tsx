import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chat, ChatHeader, createProgressMessage, generateUniqueId } from "@/components/Chat";
import {
    Message,
    MessageButton,
    ImageUploadCallback,
} from "@/components/types";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImageForGeminiAnalyze, uploadImageWithFileSystem } from "@/services/FileUploadService";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { ChatSession, ChatSessionService } from "@/services/ChatSessionService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatRequest } from "@/services/aiReuest";
import { analytics } from "@/services/AnalyticsService";
import { addImageLook } from "@/services/addLookBook";
import { useMessages } from "@/hooks/useMessages";
import paymentService from "@/services/PaymentService";
import { useCredits } from "@/hooks/usePayment";


export default function FreeChatScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { user } = useAuth();
    const { messages, setMessages, getMessage, hideMessage, updateMessage, addMessage, dateleMessage } = useMessages();
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

    const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
    const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
    const { message } = useLocalSearchParams<{ message?: string }>();
    const { credits, loading: creditsLoading, refresh: refreshCredits } = useCredits();
    // 调试参数接收
    // console.log('FreeChat received params:', { sessionId, imageUri, message });

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
                setCurrentSession(session);
            } else {
                Alert.alert('No sessionId provided');
                router.replace({
                    pathname: "/tabs/",
                });
            }


            // 如果会话中有消息，加载会话消息
            if (session && session.messages && session.messages.length > 0) {

                setMessages(session.messages);
            } else {

                // 如果是新会话，设置初始消息

                const id = generateUniqueId('msg_');
                var initmessages: Message = {
                    id: id,
                    text: "",
                    sender: "user",
                    timestamp: new Date(),
                };

                if (imageUri && message) {
                    handleSendMessage(message, imageUri);
                } else if (imageUri) {
                    initmessages.images = [
                        ...(imageUri ? [{
                            id: generateUniqueId('img_'),
                            url: imageUri,
                            alt: 'Garment Image',
                        }] : []),
                    ],

                        setMessages([initmessages]);
                    await ChatSessionService.updateSessionMessages(session?.id || '', [initmessages]);
                    let progressMessage = createProgressMessage(5);
                    addMessage(progressMessage);
                    uploadImageForGeminiAnalyze(user?.id || '', imageUri || '').then(({ message, image, uploadedImage }) => {
                        updateMessage({
                            ...initmessages,
                            images: [
                                ...(uploadedImage ? [{
                                    id: generateUniqueId('img_'),
                                    url: uploadedImage,
                                    alt: 'Garment Image',
                                }] : []),
                            ],
                            timestamp: new Date(),
                        });
                        dateleMessage(progressMessage.id);
                        addMessage({
                            id: generateUniqueId('msg_'),
                            text: message,
                            sender: "ai",
                            images: [
                                ...(image ? [{
                                    id: generateUniqueId('img_'),
                                    url: image,
                                    alt: 'Garment Image',
                                }] : []),
                            ],
                            timestamp: new Date(),
                        });
                    });
                } else if (message) {
                    handleSendMessage(message);
                } else {
                    Alert.alert('No message or image provided');
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
        const currentSessionId = currentSession?.id || '';
        // 追踪发送消息
        const startTime = Date.now();
        analytics.track('chat_message_sent', {
          has_text: message.length > 0,
          has_image: imageUri && imageUri.length > 0,
          text_length: message.length,
          source: 'free_chat',
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
            addImageLook(user?.id || "", 'free_chat', images);
            try {
              const deductSuccess = await paymentService.useCredits(
                user?.id || '',
                10 * images.length,
                'style_analysis',
                currentSessionId || '',
                `Free chat for occasion: ${currentSession?.title || ''}`
              );
    
              if (deductSuccess) {
                console.log(`✅ [StyleAnItem] 成功扣除 ${10 * images.length} 积分`);
                await refreshCredits();
              } else {
                console.warn('⚠️ [StyleAnItem] 积分扣除失败，但图片已生成');
              }
    
            } catch (error) {
              console.error('❌ [StyleAnItem] 积分扣除异常:', error);
            }
          }
        });
    
      };


    const handleDrawerOpen = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <SafeAreaView className="flex-1 bg-white ">
            <ChatHeader
                title={currentSession?.title || "Free Chat"}
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
                chatType="free_chat"
                currentSessionId={currentSession?.id || ''}
                messages={messages}
                onSendMessage={handleSendMessage}
                // onImageUpload={handleImageUpload}
                placeholder="Describe outfit ..."
                showAvatars={false}
                canInput={true}
                setMessages={setMessages}
                getMessage={getMessage}
                hideMessage={hideMessage}
                updateMessage={updateMessage}
                addMessage={addMessage}
                dateleMessage={dateleMessage}
            />
        </SafeAreaView>
    );
}
