// import React, { useState, useEffect } from 'react';
// import { View, SafeAreaView, Alert } from 'react-native';
// import { Chat, ChatHeader } from '@/components/Chat';
// import { Message, MessageButton, ImageUploadCallback } from '@/components/types';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { DrawerActions, useNavigation } from '@react-navigation/native';
// import { ChatSessionService, ChatSession } from '@/services/ChatSessionService';

// interface ChatPageProps {
//   sessionType: ChatSession['type'];
//   defaultTitle: string;
//   defaultSubtitle: string;
//   initialMessages: Message[];
//   onButtonPress?: (button: MessageButton, message: Message) => void;
//   onImageUpload?: ImageUploadCallback;
// }

// export function ChatPage({
//   sessionType,
//   defaultTitle,
//   defaultSubtitle,
//   initialMessages,
//   onButtonPress,
//   onImageUpload,
// }: ChatPageProps) {
//   const router = useRouter();
//   const navigation = useNavigation();
//   const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

//   const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
//   const [messages, setMessages] = useState<Message[]>(initialMessages);

//   // 加载当前会话
//   useEffect(() => {
//     loadCurrentSession();
//   }, [sessionId]);

//   // 当消息更新时，保存到会话
//   useEffect(() => {
//     if (currentSession && messages.length > 0) {
//       saveMessagesToSession();
//     }
//   }, [messages, currentSession]);

//   const loadCurrentSession = async () => {
//     try {
//       let session: ChatSession | null = null;

//       if (sessionId) {
//         // 如果路由参数中有sessionId，加载指定会话
//         session = await ChatSessionService.getSession(sessionId);
//         if (session) {
//           await ChatSessionService.setCurrentSession(session.id);
//         }
//       }

//       if (!session) {
//         // 如果没有指定会话或会话不存在，获取当前会话
//         session = await ChatSessionService.getCurrentSession();
//       }

//       if (!session) {
//         // 如果仍然没有会话，创建一个新的
//         session = await ChatSessionService.createSession(sessionType);
//       }

//       setCurrentSession(session);

//       // 如果会话中有消息，加载会话消息
//       if (session.messages && session.messages.length > 0) {
//         setMessages(session.messages);
//       }
//     } catch (error) {
//       console.error('加载会话失败:', error);
//     }
//   };

//   const saveMessagesToSession = async () => {
//     if (currentSession) {
//       try {
//         await ChatSessionService.updateSessionMessages(currentSession.id, messages);
//       } catch (error) {
//         console.error('保存消息到会话失败:', error);
//       }
//     }
//   };

//   const addMessage = (message: Message) => {
//     setMessages(prev => [...prev, message]);
//   }

//   const handleSendMessage = (text: string) => {
//     const newMessage: Message = {
//       id: Date.now().toString(),
//       text,
//       sender: 'user',
//       senderName: '用户',
//       timestamp: new Date(),
//     };
//     setMessages(prev => [...prev, newMessage]);

//     // 模拟AI回复
//     setTimeout(() => {
//       const replies = [
//         '我明白了！',
//         '好的，我来帮您处理',
//         '这个想法很不错',
//         '让我为您分析一下',
//       ];
//       const randomReply = replies[Math.floor(Math.random() * replies.length)];

//       const reply: Message = {
//         id: (Date.now() + 1).toString(),
//         text: randomReply,
//         sender: 'ai',
//         senderName: 'AI助手',
//         timestamp: new Date(),
//         showAvatars: true,
//       };
//       setMessages(prev => [...prev, reply]);
//     }, 1000 + Math.random() * 2000);
//   };

//   const handleButtonPress = (button: MessageButton, message: Message) => {
//     if (onButtonPress) {
//       onButtonPress(button, message);
//     } else {
//       console.log('按钮点击:', button.action, button.data);
//     }
//   }

//   const handleImageUpload: ImageUploadCallback = {
//     onImageSelect: (imageUri: string, messageId?: string) => {
//       console.log('选择的图片:', imageUri, '消息ID:', messageId);
//       if (messageId) {
//         setMessages(prev => prev.map(msg => {
//           if (msg.id === messageId && msg.card) {
//             return {
//               ...msg,
//               card: {
//                 ...msg.card,
//                 image: imageUri || undefined
//               }
//             };
//           }
//           return msg;
//         }));
//       }
//     },
//     onImageUpload: async (imageUri: string) => {
//       // 模拟图片上传到服务器
//       return new Promise((resolve) => {
//         setTimeout(() => {
//           resolve('https://example.com/uploaded/' + Date.now() + '.jpg');
//         }, 2000);
//       });
//     },
//     onImageError: (error: string) => {
//       Alert.alert('上传失败', error);
//     }
//   };

//   const handleDrawerOpen = () => {
//     navigation.dispatch(DrawerActions.openDrawer());
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <View style={{ flex: 1 }}>
//         <ChatHeader
//           title={currentSession?.title || defaultTitle}
//           subtitle={defaultSubtitle}
//           isOnline={true}
//           showAvatar={true}
//           onBack={() => router.back()}
//           onMore={handleDrawerOpen}
//           showDrawerButton={true}
//         />

//         <Chat
//           messages={messages}
//           onSendMessage={handleSendMessage}
//           onButtonPress={handleButtonPress}
//           onImageUpload={onImageUpload || handleImageUpload}
//           placeholder="输入消息..."
//           showAvatars={true}
//         />
//       </View>
//     </SafeAreaView>
//   );
// }
