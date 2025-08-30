import React, { useState } from 'react';
import { View, SafeAreaView, Text, Pressable, ScrollView } from 'react-native';
import { Chat, ChatHeader } from '@/components/Chat';
import { Message, MessageButton } from '@/components/types';
import { useRouter } from 'expo-router';
import { ChatSessionService } from '@/services/ChatSessionService';

export default function StylingScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Good morning, Jessie! It’s cloudy☁️ and 62° outside. Grey skies can’t dim your inner light. Carry your sunshine within.

How can I help to make your outfit shine today? `,
      sender: 'system',
      senderName: 'AI助手',
      showAvatars: false,
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: '2',
      text: '',
      sender: 'system',
      senderName: 'AI助手',
      timestamp: new Date(Date.now() - 60000),
      showAvatars: false,
      card: {
        id: 'card1',
        title: '',
        subtitle: '',
        description: '',
        isShell: 'none',
        buttons: [
          {
            id: 'card_btn1',
            text: 'Style an Item',
            type: 'primary',
            action: 'style_an_item'
          },
          {
            id: 'card_btn2',
            text: 'Outfit Check',
            type: 'secondary',
            action: 'outfit_check'
          },
          {
            id: 'card_btn3',
            text: 'Generate OOTD',
            type: 'secondary',
            action: 'generate_ootd'
          }
        ]
      }
    },
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
      const replies = [
        '我明白了！默认头像功能确实很实用',
        '是的，不同类型的头像有不同的颜色和样式',
        '用户头像是蓝色的，AI头像是绿色的',
        '系统头像则是橙色的，很容易区分',
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
    // 根据按钮动作处理不同的逻辑
    switch (button.action) {
      case 'style_an_item':
        const newSession = await ChatSessionService.createOrCurrent('style_an_item');
        console.log('Style an Item');
        router.push({
          pathname: '/ChatScreen/style_an_item',
          params: { sessionId: newSession?.id }
        });
        break;
      case 'outfit_check':
        console.log('Outfit Check');
        // 可以添加其他页面的跳转
        router.push('/tabs/styling/outfit_check');
        break;
      case 'generate_ootd':
        console.log('Generate OOTD');
        // 可以添加其他页面的跳转
        router.push('/tabs/styling/generate_ootd');
        break;
    }
  }
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ChatHeader
        title="Styleme"
        // subtitle="在线"
        isOnline={true}
        showAvatar={false}
        // onBack={() => console.log('返回')}
        // onMore={() => console.log('更多选项')}
      />
      
      <Chat
        messages={messages}
        onSendMessage={handleSendMessage}
        onButtonPress={handleButtonPress}
        placeholder="输入消息..."
        showAvatars={true}
      />
    </SafeAreaView>
  );
}
