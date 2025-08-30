import React, { useState } from 'react';
import { View, SafeAreaView, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Chat, ChatHeader } from '@/components/Chat';
import { Message, MessageButton, ImageUploadCallback } from '@/components/types';
import { useRouter } from 'expo-router';

export default function OutfitCheckScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '欢迎来到搭配检查页面！请上传您的穿搭照片，我来为您分析搭配效果。',
      sender: 'ai',
      senderName: 'AI助手',
      timestamp: new Date(Date.now() - 60000),
      showAvatars: true,
    },
    {
      id: '2',
      text: '',
      sender: 'ai',
      senderName: 'AI助手',
      timestamp: new Date(Date.now() - 30000),
      showAvatars: false,
      card: {
        id: 'card1',
        title: '搭配检查',
        subtitle: '上传您的穿搭照片',
        description: '请上传一张清晰的全身穿搭照片，我将为您提供专业的搭配分析和建议。',
        uploadImage: true, // 启用图片上传功能
                            buttons: [
                      {
                        id: 'btn1',
                        text: '开始分析',
                        type: 'primary',
                        action: 'analyze_outfit'
                      },
                      {
                        id: 'btn2',
                        text: '查看历史',
                        type: 'secondary',
                        action: 'view_history'
                      }
                    ],
                    commitButton: {
                      id: 'commit_btn',
                      text: '提交分析',
                      type: 'primary',
                      action: 'submit_analysis'
                    }
      }
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
        text: `收到您的消息："${text}"。我正在分析您的搭配...`,
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
        case 'analyze_outfit':
          console.log('分析搭配');
          Alert.alert('分析搭配', '正在分析您的穿搭...');
          break;
        case 'view_history':
          console.log('查看历史');
          Alert.alert('查看历史', '显示历史搭配记录');
          break;
        case 'submit_analysis':
          console.log('提交分析');
          Alert.alert('提交成功', '您的搭配分析已提交，正在生成报告...');
          break;
      }
  };

  const handleImageUpload: ImageUploadCallback = {
    onImageSelect: (imageUri: string, messageId?: string) => {
      console.log('选择的图片:', imageUri, '消息ID:', messageId);
      if (messageId) {
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
      Alert.alert('上传失败', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ChatHeader
        title="搭配检查"
        subtitle="AI智能搭配分析"
        isOnline={true}
        showAvatar={true}
        onBack={() => router.back()}
        onMore={() => console.log('更多选项')}
      />
      
      <Chat
        messages={messages}
        onSendMessage={handleSendMessage}
        onButtonPress={handleButtonPress}
        onImageUpload={handleImageUpload}
        placeholder="描述您的搭配需求..."
        showAvatars={true}
      />
    </SafeAreaView>
  );
}
