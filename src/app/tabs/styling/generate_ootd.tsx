import React, { useState } from 'react';
import { View, SafeAreaView, Text, Pressable, ScrollView } from 'react-native';
import { Chat, ChatHeader } from '@/components/Chat';
import { Message, MessageButton } from '@/components/types';
import { useRouter } from 'expo-router';

export default function GenerateOOTDScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '欢迎来到今日穿搭生成页面！请告诉我您的风格偏好和场合需求，我来为您生成完美的穿搭方案。',
      sender: 'ai',
      senderName: 'AI助手',
      timestamp: new Date(Date.now() - 60000),
      showAvatars: true,
      buttons: [
        {
          id: 'btn1',
          text: '休闲风格',
          type: 'primary',
          action: 'casual_style'
        },
        {
          id: 'btn2',
          text: '商务风格',
          type: 'secondary',
          action: 'business_style'
        },
        {
          id: 'btn3',
          text: '运动风格',
          type: 'secondary',
          action: 'sport_style'
        },
        {
          id: 'btn4',
          text: '约会风格',
          type: 'secondary',
          action: 'date_style'
        }
      ]
    }
  ]);

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
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: `收到您的需求："${text}"。我正在为您生成今日穿搭方案...`,
        sender: 'ai',
        senderName: 'AI助手',
        timestamp: new Date(),
        showAvatars: true,
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  const handleButtonPress = (button: MessageButton, message: Message) => {
    console.log('按钮点击:', button.action, button.data);
    
    switch (button.action) {
      case 'casual_style':
        console.log('休闲风格');
        // 可以添加休闲风格穿搭生成逻辑
        break;
      case 'business_style':
        console.log('商务风格');
        // 可以添加商务风格穿搭生成逻辑
        break;
      case 'sport_style':
        console.log('运动风格');
        // 可以添加运动风格穿搭生成逻辑
        break;
      case 'date_style':
        console.log('约会风格');
        // 可以添加约会风格穿搭生成逻辑
        break;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ChatHeader
        title="今日穿搭"
        subtitle="AI智能穿搭生成"
        isOnline={true}
        showAvatar={true}
        onBack={() => router.back()}
        onMore={() => console.log('更多选项')}
      />
      
      <Chat
        messages={messages}
        onSendMessage={handleSendMessage}
        onButtonPress={handleButtonPress}
        placeholder="描述您的穿搭需求..."
        showAvatars={true}
      />
    </SafeAreaView>
  );
}
