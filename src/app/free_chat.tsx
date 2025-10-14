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


export default function FreeChatScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

    const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
    const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
    const { message } = useLocalSearchParams<{ message?: string }>();

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
                if (imageUri) {
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

        progressMessage.progress = {
            current: 5,
            total: 10,
            status: 'processing',
            message: 'Analyzing your message...',
        };
        updateMessage(progressMessage);
        const { message, images } = await chatRequest(user?.id || '', '', text, [image] , currentSession?.id || '');
        dateleMessage(progressMessage.id);
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
                messages={messages}
                onSendMessage={handleSendMessage}
                // onImageUpload={handleImageUpload}
                placeholder="Describe your outfit needs..."
                showAvatars={false}
                canInput={true}
            />
        </SafeAreaView>
    );
}
