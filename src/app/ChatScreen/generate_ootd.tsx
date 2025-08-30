import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Chat, ChatHeader } from '@/components/Chat';
import { Message, MessageButton, ImageUploadCallback } from '@/components/types';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { ChatSessionService, ChatSession } from '@/services/ChatSessionService';

export default function GenerateOOTDScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Generate OOTD`,
      sender: 'user',
      senderName: '我',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: '2',
      text: `告诉我您的风格偏好和场合，我来为您生成完美的穿搭！`,
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
        description: '选择您的风格偏好和场合',
        uploadImage: false,
        buttons: [
          {
            id: 'style_casual',
            text: '休闲风格',
            type: 'secondary',
            action: 'select_style'
          },
          {
            id: 'style_formal',
            text: '正式风格',
            type: 'secondary',
            action: 'select_style'
          },
          {
            id: 'style_street',
            text: '街头风格',
            type: 'secondary',
            action: 'select_style'
          },
          {
            id: 'style_vintage',
            text: '复古风格',
            type: 'secondary',
            action: 'select_style'
          },
          {
            id: 'occasion_work',
            text: '工作场合',
            type: 'secondary',
            action: 'select_occasion'
          },
          {
            id: 'occasion_date',
            text: '约会场合',
            type: 'secondary',
            action: 'select_occasion'
          },
          {
            id: 'occasion_party',
            text: '派对场合',
            type: 'secondary',
            action: 'select_occasion'
          }
        ],
        commitButton: {
          id: 'commit_btn',
          text: '生成穿搭',
          action: 'generate_outfit'
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
        session = await ChatSessionService.createSession('generate_ootd');
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
        '我来为您生成合适的穿搭',
        '根据您的偏好，我推荐以下搭配',
        '这个风格很适合您',
        '让我为您设计一套完美的穿搭',
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
      case 'select_style':
        console.log('选择风格:', button.text);
        const styleMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: `已选择风格: ${button.text}`,
          sender: 'user',
          senderName: '用户',
          timestamp: new Date(),
        };
        addMessage(styleMessage);
        break;
      case 'select_occasion':
        console.log('选择场合:', button.text);
        const occasionMessage: Message = {
          id: (Date.now() + 3).toString(),
          text: `已选择场合: ${button.text}`,
          sender: 'user',
          senderName: '用户',
          timestamp: new Date(),
        };
        addMessage(occasionMessage);
        break;
      case 'generate_outfit':
        console.log('生成穿搭');
        // 模拟生成过程
        const generatingMessage: Message = {
          id: (Date.now() + 4).toString(),
          text: '正在为您生成穿搭...',
          sender: 'ai',
          senderName: 'AI助手',
          timestamp: new Date(),
          showAvatars: true,
        };
        addMessage(generatingMessage);
        
        // 模拟生成结果
        setTimeout(() => {
          const resultMessage: Message = {
            id: (Date.now() + 5).toString(),
            text: '为您生成的穿搭：\n\n👕 白色基础款T恤\n👖 高腰直筒牛仔裤\n👟 白色运动鞋\n👜 简约单肩包\n\n这套搭配既舒适又时尚，适合日常穿着！',
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
          title={currentSession?.title || "生成穿搭"}
          subtitle="AI为您设计完美搭配"
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
