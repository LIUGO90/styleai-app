import React, { useState, useEffect, useRef } from 'react';
import { View, SafeAreaView, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Chat, ChatHeader } from '@/components/Chat';
import { Message, MessageButton, ImageUploadCallback } from '@/components/types';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiRequest, aiRequestKling, aisuggest } from '@/services/aiReuest';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { ChatSessionService, ChatSession } from '@/services/ChatSessionService';


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
    senderName: '我',
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: '2',
    text: `Sure! Please upload the photo of your garment and tell me more the occasion`,
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
      description: 'What occasion would you wear this for？',
      uploadImage: true, // 启用图片上传功能
      buttons: buttons,
      commitButton: {
        id: 'commit_btn',
        text: 'Generate My Outfit',
        action: 'confirm_selection'
      }
    }
  }
]

export default function StyleAnItemScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [selectedButtons, setSelectedButtons] = useState<string>("");
  const selectedImageRef = useRef<string>("");
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

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
      setSelectedButtons('');
      
      let session: ChatSession | null = null;
      if (sessionId) {
        // 如果路由参数中有sessionId，加载指定会话
        session = await ChatSessionService.getSession(sessionId);
        if (session) {
          await ChatSessionService.setCurrentSession(session.id);
        }
        console.log('session', session);
      }

      if (!session) {
        // 如果没有指定会话或会话不存在，获取当前会话
        session = await ChatSessionService.getCurrentSession();

        // 如果仍然没有会话，创建一个新的
        session = await ChatSessionService.createSession('style_an_item');
      }

      setCurrentSession(session);

      // 如果会话中有消息，加载会话消息
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages);
        // 检查是否有上传的图片
        const messageWithImage = session.messages.find(msg => 
          msg.card && msg.card.image && msg.card.image !== ''
        );
        if (messageWithImage && messageWithImage.card && messageWithImage.card.image) {
          selectedImageRef.current = messageWithImage.card.image;
        }
      } else {
        // 如果是新会话，设置初始消息
        setMessages(initMessages );
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

  const updateMessage = (message: Message) => {
    setMessages(prev => prev.map(msg => msg.id === message.id ? message : msg));
  }

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  }

  const dateleMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
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
        console.log('Style an Item');
        router.push('/tabs/styling/style_an_item');
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
      case 'confirm_selection':
        
        if (selectedImageRef.current === '') {
          Alert.alert('请上传一张图片' + selectedImageRef.current);
          return;
        }
        if (selectedButtons === '') {
          Alert.alert('请选择一个场合');
          return;
        }

        // await AsyncStorage.setItem('garmentImage', imageUrl)
        const { jobId, message } = await aiRequest();
        if (jobId === 'error') {
          Alert.alert('AI请求失败');
          return;
        }
        // const id = (Date.now() + 2).toString()
        // 处理确认选择逻辑
        const confirmMessage: Message = {
          id: (Date.now() + 2).toString(),
          // text: `Your selection has been confirmed! Generating outfit suggestions...`,
          text: message,
          sender: 'ai',
          senderName: 'AI助手',
          timestamp: new Date(),
          showAvatars: true,
        };

        addMessage(confirmMessage);

        const resultKling = await aiRequestKling(jobId, 0);
        if (resultKling === 'error') {
          Alert.alert('AI请求失败');
          return;
        }

        const klingMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: "",
          sender: 'ai',
          senderName: 'AI助手',
          timestamp: new Date(),
          showAvatars: true,
          images: [
            {
              id: 'image1',
              url: resultKling,
              // alt: 'Kling Image',
            }
          ]
        };
        addMessage(klingMessage);

        const twoklingMessage: Message = {
          id: (Date.now() + 3).toString(),
          text: "",
          sender: 'ai',
          senderName: 'AI助手',
          timestamp: new Date(),
          showAvatars: true,
          buttons: [
            {
              id: 'button1',
              text: 'one more outfit',
              type: 'secondary',
              action: 'generate_more_outfit',
              data: jobId
            }
          ]
        };
        addMessage(twoklingMessage);


        break;
      case 'generate_more_outfit':
        const jobId2 = button.data;

        const aiResponse = await aisuggest(jobId2, 1);
        if (!aiResponse || aiResponse.jobId === 'error') {
          Alert.alert('AI请求失败');
          return;
        }

        const suggestTwo: Message = {
          id: (Date.now() + 2).toString(),
          // text: `Your selection has been confirmed! Generating outfit suggestions...`,
          text: aiResponse.message,
          sender: 'ai',
          senderName: 'AI助手',
          timestamp: new Date(),
          showAvatars: true,

        };
        addMessage(suggestTwo);

        const resultKling2 = await aiRequestKling(jobId2, 1);
        if (resultKling2 === 'error') {
          Alert.alert('AI请求失败');
          return;
        }
        const klingMessage2: Message = {
          id: (Date.now() + 3).toString(),
          text: "",
          sender: 'ai',
          senderName: 'AI助手',
          timestamp: new Date(),
          showAvatars: true,
          images: [
            {
              id: 'image1',
              url: resultKling2,
              // alt: 'Kling Image',
            }
          ]
        };
        addMessage(klingMessage2);

      case 'add_to_cart':
        console.log('选择场合:', button.text);
        setSelectedButtons(button.text);
        break;
      case 'random':
        console.log('随机选择');
        // 生成随机数字
        const randomNumber = Math.floor(Math.random() * 5);
        // 根据数字设置按钮文本
        const buttonText = buttons[randomNumber].text;
        setSelectedButtons(buttonText);

        break;
    }
  }

  const handleImageUpload: ImageUploadCallback = {
    onImageSelect: (imageUri: string, messageId?: string) => {
      console.log('选择的图片:', imageUri, '消息ID:', messageId);
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
          subtitle="检查您的搭配是否合适"
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
          clickHighlight={selectedButtons}
        />
      </View>
    </SafeAreaView>
  );
}


