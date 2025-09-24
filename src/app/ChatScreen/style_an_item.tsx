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
import { uploadImageWithFileSystem } from '@/services/FileUploadService';



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

export default function StyleAnItemScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [selectedButtons, setSelectedButtons] = useState<string>("");
  const selectedImageRef = useRef<string>("");
  const selectedIdRef = useRef<string>("");
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
      selectedIdRef.current = '3';
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
          selectedIdRef.current = messageWithImage.id;
          setSelectedButtons(messageWithImage.card.selectedButton || '');
        }
      } else {
        // 如果是新会话，设置初始消息
        setMessages(initMessages);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const saveMessagesToSession = async () => {
    if (currentSession) {
      try {
        await ChatSessionService.updateSessionMessages(currentSession.id, messages);
      } catch (error) {
        console.error('Failed to save messages to session:', error);
      }
    }
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

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      senderName: 'User',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);

    // Simulate AI reply
    setTimeout(() => {
      const replies = [
        'I understand! The default avatar feature is indeed very practical',
        'Yes, different types of avatars have different colors and styles',
        'User avatars are blue, AI avatars are green',
        'System avatars are orange, easy to distinguish',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: randomReply,
        sender: 'ai',
        senderName: 'AI Assistant',
        timestamp: new Date(),
        showAvatars: true,
      };
      setMessages(prev => [...prev, reply]);
    }, 1000 + Math.random() * 2000);
  };

  const handleButtonPress = async (button: MessageButton, message: Message) => {
    console.log('Button clicked:', button.action, button.data);

    // Handle different logic based on button action
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
          Alert.alert('请上传一张图片' + selectedImageRef.current);
          return;
        }
        if (selectedButtons === '') {
          Alert.alert('请选择一个场合');
          return;
        }
        const messagetmp = getMessage(selectedIdRef.current) as Message;
        if (messagetmp && messagetmp.card) {
          messagetmp.card.image = selectedImageRef.current;
        }
        updateMessage(messagetmp);
        // 隐藏hideMessage场景选择消息
        hideMessage(selectedIdRef.current)

        addMessage({
          id: generateUniqueId('msg'),
          text: 'Style this dress for casual',
          sender: 'user',
          timestamp: new Date(),
        });

        // 进度消息 1
        let progressMessage: Message = {
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
        addMessage(progressMessage);

        const imageUrl = await uploadImageWithFileSystem(selectedImageRef.current);

        if (imageUrl) {
          console.log("Image upload successful, saved to local storage", imageUrl);
        } else {
          Alert.alert('Image upload failed');
          return;
        }
        // 进度消息 2
        progressMessage.progress!.current = 3;
        dateleMessage(progressMessage.id)
        addMessage({
          id: generateUniqueId('msg_'),
          text: '',
          sender: 'user',
          timestamp: new Date(),
          images: [
            {
              id: generateUniqueId('img_'),
              url: imageUrl,
              alt: 'Garment Image',
            }
          ]
        });
        addMessage(progressMessage);

        // await AsyncStorage.setItem('garmentImage', imageUrl)
        const { jobId, message } = await aiRequest(imageUrl);
        if (jobId === 'error') {
          Alert.alert('AI request failed');
          return;
        }
        dateleMessage(progressMessage.id)

        // const id = (Date.now() + 2).toString()
        // 处理确认选择逻辑
        const confirmMessage: Message = {
          id: (Date.now() + 2).toString(),
          // text: `Your selection has been confirmed! Generating outfit suggestions...`,
          text: message,
          sender: 'ai',
          senderName: 'AI Assistant',
          timestamp: new Date(),
          showAvatars: true,
        };
        addMessage(confirmMessage);
        progressMessage.progress!.current = 6;
        addMessage(progressMessage);


        const resultKling = await aiRequestKling(jobId, 0);
        if (resultKling === 'error') {
          Alert.alert('AI request failed');
          return;
        }

        const klingMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: "",
          sender: 'ai',
          senderName: 'AI Assistant',
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
        // 删除进度条消息
        dateleMessage(progressMessage.id)
        addMessage(klingMessage);

        const twoklingMessage: Message = {
          id: (Date.now() + 3).toString(),
          text: "",
          sender: 'ai',
          senderName: 'AI Assistant',
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
          Alert.alert('AI request failed');
          return;
        }

        const suggestTwo: Message = {
          id: (Date.now() + 2).toString(),
          // text: `Your selection has been confirmed! Generating outfit suggestions...`,
          text: aiResponse.message,
          sender: 'ai',
          senderName: 'AI Assistant',
          timestamp: new Date(),
          showAvatars: true,

        };
        addMessage(suggestTwo);

        const resultKling2 = await aiRequestKling(jobId2, 1);
        if (resultKling2 === 'error') {
          Alert.alert('AI request failed');
          return;
        }
        const klingMessage2: Message = {
          id: (Date.now() + 3).toString(),
          text: "",
          sender: 'ai',
          senderName: 'AI Assistant',
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



        addMessage({
          id: generateUniqueId('msg_'),
          text: "Would you like to generate another look for this item? If you'd like me to tweak this outfit, just let me know.",
          sender: 'ai',
          timestamp: new Date(),
          buttons: [
            {
              id: 'button1',
              text: 'Yes, one more outfit',
              action: 'generate_another_look'
            },
            {
              id: 'button2',
              text: 'change accessories',
              action: 'change_accessories'
            }
          ],
        });

        break;

      case 'add_to_cart':
        console.log('Selected occasion:', button.text);
        setSelectedButtons(button.text);
        const message0 = getMessage(selectedIdRef.current) as Message;
        if (message0 && message0.card) {
          message0.card.selectedButton = button.text;
        }
        updateMessage(message0);
        break;
      case 'random':
        console.log('Random selection');
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
      console.log('Selected image:', imageUri, 'Message ID:', messageId);
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
          title={currentSession?.title || "Style an item"}
          // subtitle="检查您的搭配是否合适"
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


