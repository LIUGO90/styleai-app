import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Chat, ChatHeader } from '@/components/Chat';
import { Message, MessageButton, ImageUploadCallback } from '@/components/types';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { ChatSessionService, ChatSession } from '@/services/ChatSessionService';

export default function OutfitCheckScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Outfit Check`,
      sender: 'user',
      senderName: '我',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: '2',
      text: `请上传您的穿搭照片，我来帮您检查搭配是否合适！`,
      sender: 'system',
      senderName: 'AI助手',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: '3',
      text: '',
      sender: 'system',
      senderName: 'AI助手',
      timestamp: new Date(Date.now() - 60000),
      type: 'card',
      card: {
        id: 'card1',
        title: '',
        subtitle: '',
        description: '上传您的穿搭照片，AI将为您分析搭配效果',
        uploadImage: true,
        buttons: [
          {
            id: 'card_btn1',
            text: '上传照片',
            type: 'primary',
            action: 'upload_photo'
          },
          {
            id: 'card_btn2',
            text: '查看历史',
            type: 'secondary',
            action: 'view_history'
          }
        ],
        commitButton: {
          id: 'commit_btn',
          text: '开始分析',
          action: 'analyze_outfit'
        }
      }
    }
  ]);

  // 加载当前会话
  useEffect(() => {
    loadCurrentSession();
  }, [sessionId]);

  // 当消息更新时，保存到会话
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      saveMessagesToSession();
    }
  }, [messages, currentSession]);

  const loadCurrentSession = async () => {
    try {
      let session: ChatSession | null = null;
      
      if (sessionId) {
        // 如果路由参数中有sessionId，加载指定会话
        session = await ChatSessionService.getSession(sessionId);
        if (session) {
          await ChatSessionService.setCurrentSession(session.id);
        }
      }
      
      if (!session) {
        // 如果没有指定会话或会话不存在，获取当前会话
        session = await ChatSessionService.getCurrentSession();
      }
      
      if (!session) {
        // 如果仍然没有会话，创建一个新的
        session = await ChatSessionService.createSession('outfit_check');
      }
      
      setCurrentSession(session);
      
      // 如果会话中有消息，加载会话消息
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  };

  const saveMessagesToSession = async () => {
    if (currentSession) {
      try {
        await ChatSessionService.updateSessionMessages(currentSession.id, messages);
      } catch (error) {
        console.error('保存消息到会话失败:', error);
      }
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  }

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      senderName: '用户',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);

    // 模拟AI回复
    setTimeout(() => {
      const replies = [
        '我来分析一下您的穿搭效果',
        '这个搭配很有创意！',
        '建议可以尝试不同的配饰',
        '整体风格很协调',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: randomReply,
        sender: 'ai',
        senderName: 'AI助手',
        timestamp: new Date(),
        showAvatars: true,
      };
      setMessages(prev => [...prev, reply]);
    }, 1000 + Math.random() * 2000);
  };

  const handleButtonPress = async (button: MessageButton, message: Message) => {
    console.log('按钮点击:', button.action, button.data);

    switch (button.action) {
      case 'upload_photo':
        console.log('上传照片');
        // 这里可以触发图片选择
        break;
      case 'view_history':
        console.log('查看历史');
        // 这里可以显示历史分析记录
        break;
      case 'analyze_outfit':
        console.log('开始分析');
        // 模拟分析过程
        const analysisMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: '正在分析您的穿搭...',
          sender: 'ai',
          senderName: 'AI助手',
          timestamp: new Date(),
          showAvatars: true,
        };
        addMessage(analysisMessage);
        
        // 模拟分析结果
        setTimeout(() => {
          const resultMessage: Message = {
            id: (Date.now() + 3).toString(),
            text: '分析完成！您的穿搭整体效果很好，建议可以尝试添加一些配饰来提升整体造型。',
            sender: 'ai',
            senderName: 'AI助手',
            timestamp: new Date(),
            showAvatars: true,
          };
          setMessages(prev => [...prev, resultMessage]);
        }, 3000);
        break;
    }
  }
  
  const handleImageUpload: ImageUploadCallback = {
    onImageSelect: (imageUri: string, messageId?: string) => {
      console.log('选择的图片:', imageUri, '消息ID:', messageId);
      if (messageId) {
        // 更新指定消息的卡片图片
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId && msg.card) {
            return {
              ...msg,
              card: {
                ...msg.card,
                image: imageUri || undefined
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
      Alert.alert('上传失败', error);
    }
  };

  const handleDrawerOpen = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ flex: 1 }}>
        <ChatHeader
          title={currentSession?.title || "搭配检查"}
          subtitle="AI帮您分析穿搭效果"
          isOnline={true}
          showAvatar={true}
          onBack={() => router.back()}
          onMore={handleDrawerOpen}
          showDrawerButton={true}
        />

        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          onButtonPress={handleButtonPress}
          onImageUpload={handleImageUpload}
          placeholder="输入消息..."
          showAvatars={true}
        />
      </View>
    </SafeAreaView>
  );
}
