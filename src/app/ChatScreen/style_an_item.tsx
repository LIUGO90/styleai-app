import React, { useState, useEffect, useRef } from "react";
import { View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chat, ChatHeader } from "@/components/Chat";
import {
  Message,
  MessageButton,
  ImageUploadCallback,
  OnboardingData,
} from "@/components/types";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  aiRequest,
  aiRequestGemini,
  aiRequestKling,
  aisuggest,
} from "@/services/aiReuest";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { ChatSessionService, ChatSession } from "@/services/ChatSessionService";
import { getTestImage } from "@/config/imagePaths";
import { uploadImageWithFileSystem } from "@/services/FileUploadService";
import { getImageDimensions } from "@/utils/imageDimensions";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 生成唯一ID的辅助函数
const generateUniqueId = (prefix: string = "") => {
  return `${prefix}${Date.now()}_${(Math.random() * 10000).toString()}`;
};

export const buttons: MessageButton[] = [
  {
    id: "card_btn1",
    text: "Work",
    type: "secondary",
    action: "add_to_cart",
  },
  {
    id: "card_btn2",
    text: "Casual",
    type: "secondary",
    action: "add_to_cart",
  },
  {
    id: "card_btn3",
    text: "Date",
    type: "secondary",
    action: "add_to_cart",
  },
  {
    id: "card_btn4",
    text: "Cocktail",
    type: "secondary",
    action: "add_to_cart",
  },
  {
    id: "card_btn5",
    text: "Vacation",
    type: "secondary",
    action: "add_to_cart",
  },
  {
    id: "card_btn6",
    text: "🎲",
    type: "secondary",
    action: "random",
  },
];

const initMessages: Message[] = [
  {
    id: "1",
    text: `Style an Item`,
    sender: "user",
    senderName: "我",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "2",
    text: `Sure! Please upload the photo of your garment and tell me more the occasion`,
    sender: "system",
    senderName: "AI助手",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "3",
    text: "",
    sender: "system",
    senderName: "AI助手",
    timestamp: new Date(Date.now() - 60000),
    type: "card",
    card: {
      id: "card1",
      title: "",
      subtitle: "",
      description: "What occasion would you wear this for？",
      uploadImage: true, // 启用图片上传功能
      buttons: buttons,
      commitButton: {
        id: "commit_btn",
        text: "Generate My Outfit",
        action: "confirm_selection",
      },
    },
  },
];

export default function StyleAnItemScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [selectedButtons, setSelectedButtons] = useState<string>("");
  const selectedImageRef = useRef<string>("");
  const selectedIdRef = useRef<string>("");
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null,
  );
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
      selectedImageRef.current = "";
      selectedIdRef.current = "3";
      setSelectedButtons("");

      let session: ChatSession | null = null;
      if (sessionId) {
        // 如果路由参数中有sessionId，加载指定会话
        session = await ChatSessionService.getSession(sessionId);
        if (session) {
          await ChatSessionService.setCurrentSession(session.id);
        }
        // console.log('session', session);
      }

      if (!session) {
        // 如果没有指定会话或会话不存在，获取当前会话
        session = await ChatSessionService.getCurrentSession();

        // 如果仍然没有会话，创建一个新的
        session = await ChatSessionService.createSession("style_an_item");
      }

      setCurrentSession(session);

      // 如果会话中有消息，加载会话消息
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages);
        // 检查是否有上传的图片
        const messageWithImage = session.messages.find(
          (msg) => msg.card && msg.card.image && msg.card.image !== "",
        );
        if (
          messageWithImage &&
          messageWithImage.card &&
          messageWithImage.card.image
        ) {
          selectedImageRef.current = messageWithImage.card.image;
          selectedIdRef.current = messageWithImage.id;
          setSelectedButtons(messageWithImage.card.selectedButton || "");
        }
      } else {
        // 如果是新会话，设置初始消息
        setMessages(initMessages);
      }
    } catch (error) {
      console.error("加载会话失败:", error);
    }
  };

  const saveMessagesToSession = async () => {
    if (currentSession) {
      try {
        await ChatSessionService.updateSessionMessages(
          currentSession.id,
          messages,
        );
      } catch (error) {
        console.error("保存消息到会话失败:", error);
      }
    }
  };

  const getMessage = (messageId: string) => {
    return messages.find((msg) => msg.id === messageId);
  };

  const hideMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isHidden: true } : msg,
      ),
    );
  };

  const updateMessage = (message: Message) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === message.id ? message : msg)),
    );
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const dateleMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      senderName: "用户",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);

    // 模拟AI回复
    setTimeout(
      () => {
        const replies = [
          "我明白了！默认头像功能确实很实用",
          "是的，不同类型的头像有不同的颜色和样式",
          "用户头像是蓝色的，AI头像是绿色的",
          "系统头像则是橙色的，很容易区分",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const reply: Message = {
          id: (Date.now() + 1).toString(),
          text: randomReply,
          sender: "ai",
          senderName: "AI助手",
          timestamp: new Date(),
          showAvatars: true,
        };
        setMessages((prev) => [...prev, reply]);
      },
      1000 + Math.random() * 2000,
    );
  };

  const handleButtonPress = async (button: MessageButton, message: Message) => {
    console.log("按钮点击:", button.action, button.data);

    // 根据按钮动作处理不同的逻辑
    switch (button.action) {
      case "style_an_item":
        console.log("Style an Item");
        router.push("/tabs/styling/style_an_item");
        break;
      case "outfit_check":
        console.log("Outfit Check");
        // 可以添加其他页面的跳转
        router.push("/tabs/styling/outfit_check");
        break;
      case "generate_ootd":
        console.log("Generate OOTD");
        // 可以添加其他页面的跳转
        router.push("/tabs/styling/generate_ootd");
        break;
      case "change_accessories":
        // 生成新的配置
        const message2 = initMessages[2];
        message2.id = generateUniqueId("msg_");
        addMessage(message2);
        selectedIdRef.current = message2.id;

        // 清空卡片状态信息
        setSelectedButtons("");
        selectedImageRef.current = "";
        selectedIdRef.current = "";
        break;
      case "generate_another_look":
        console.log("Generate Another Look");
        break;
      case "confirm_selection":
        if (selectedImageRef.current === "") {
          Alert.alert("请上传一张图片" + selectedImageRef.current);
          return;
        }
        if (selectedButtons === "") {
          Alert.alert("请选择一个场合");
          return;
        }

        const message = getMessage(selectedIdRef.current) as Message;
        if (message && message.card) {
          message.card.image = selectedImageRef.current;
        }
        updateMessage(message);
        // 隐藏hideMessage场景选择消息
        hideMessage(selectedIdRef.current);

        addMessage({
          id: generateUniqueId("msg"),
          text: "Style this dress for casual",
          sender: "user",
          timestamp: new Date(),
        });

        let progressMessage: Message = {
          id: generateUniqueId("progress_"),
          text: "",
          sender: "ai",
          timestamp: new Date(),
          type: "progress",
          progress: {
            current: 1,
            total: 10,
            status: "processing", // 'pending' | 'processing' | 'completed' | 'error'
            message: "Putting together outfit for you...",
          },
        };
        addMessage(progressMessage);
        const imageDimensions = await getImageDimensions(selectedImageRef.current);
        console.log("imageDimensions", imageDimensions);
        const imageUrl = await uploadImageWithFileSystem(
          selectedImageRef.current,
        );

        progressMessage.progress!.current = 3;
        dateleMessage(progressMessage.id);
        addMessage({
          id: generateUniqueId("msg_"),
          text: "",
          sender: "user",
          timestamp: new Date(),
          images: [
            {
              id: generateUniqueId("img_"),
              url: imageUrl,
              alt: "Garment Image",
              width: imageDimensions.width,
              height: imageDimensions.height,
            },
          ],
        });
        addMessage(progressMessage);

        // const { jobId, message: aimessage } = await aiRequest(imageUrl);
        // if (jobId === "error") {
        //   Alert.alert("AI请求失败");
        //   return;
        // }

        // dateleMessage(progressMessage.id);
        // const confirmMessage: Message = {
        //   id: (Date.now() + 2).toString(),
        //   // text: `Your selection has been confirmed! Generating outfit suggestions...`,
        //   text: aimessage,
        //   sender: "ai",
        //   senderName: "AI助手",
        //   timestamp: new Date(),
        //   showAvatars: true,
        // };
        // addMessage(confirmMessage);

        // progressMessage.progress!.current = 6;
        // addMessage(progressMessage);
        const onboardingData = await AsyncStorage.getItem("onboardingData");

        if (!onboardingData) {
          throw new Error("Onboarding data not found");
        }
    
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        if (!onboardingDataObj.fullBodyPhoto) {
          throw new Error("Full body photo not found");
        }
        console.log("onboardingDataObj.fullBodyPhoto", onboardingDataObj.fullBodyPhoto);
        const resultGemini = await aiRequestGemini(onboardingDataObj.fullBodyPhoto,imageUrl||"");
        if (resultGemini.length === 0) {
          Alert.alert("AI请求失败");
          return;
        }
        // 删除进度条消息
        dateleMessage(progressMessage.id);

        const geminiMessage: Message = {
          id: (Date.now() + 3).toString(),
          text: "",
          sender: "ai",
          senderName: "AI助手",
          timestamp: new Date(),
          images: resultGemini.map((image) => ({
            id: generateUniqueId("img_"),
            url: image,
            alt: "Gemini Image",
          })),
        };
        addMessage(geminiMessage);

        addMessage({
          id: generateUniqueId("msg_"),
          text: "Would you like to generate another look for this item? If you'd like me to tweak this outfit, just let me know.",
          sender: "ai",
          timestamp: new Date(),
          buttons: [
            {
              id: "button1",
              text: "Yes, one more outfit",
              action: "generate_another_look",
            },
            {
              id: "button2",
              text: "change accessories",
              action: "change_accessories",
            },
          ],
        });

      case "add_to_cart":
        console.log("选择场合:", button.text);
        setSelectedButtons(button.text);

        const message0 = getMessage(selectedIdRef.current) as Message;
        if (message0 && message0.card) {
          message0.card.selectedButton = button.text;
        }
        updateMessage(message0);
        break;
      case "random":
        console.log("随机选择");
        // 生成随机数字
        const randomNumber = Math.floor(Math.random() * 5);
        // 根据数字设置按钮文本
        const buttonText = buttons[randomNumber].text;
        setSelectedButtons(buttonText);

        const message1 = getMessage(selectedIdRef.current) as Message;
        if (message1 && message1.card) {
          message1.card.selectedButton = button.text;
        }
        updateMessage(message1);

        break;
    }
  };

  const handleImageUpload: ImageUploadCallback = {
    onImageSelect: (imageUri: string, messageId?: string) => {
      console.log("选择的图片:", imageUri, "消息ID:", messageId);
      if (messageId) {
        selectedImageRef.current = imageUri;
        // 直接更新指定消息的卡片图片
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.card) {
              return {
                ...msg,
                card: {
                  ...msg.card,
                  image: imageUri || undefined, // 如果 imageUri 为空字符串，则删除图片
                },
              };
            }
            return msg;
          }),
        );
      }
    },
    onImageUpload: async (imageUri: string) => {
      // 模拟图片上传到服务器
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve("https://example.com/uploaded/" + Date.now() + ".jpg");
        }, 2000);
      });
    },
    onImageError: (error: string) => {
      Alert.alert("上传失败", error);
    },
  };

  const handleDrawerOpen = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
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

// if (selectedButtons === '100') {
//   // 模拟后台处理
//   setTimeout(() => {
//     dateleMessage(progressMessage.id)
//     addMessage({
//       id: generateUniqueId('msg_'),
//       text: 'This outfit features an elegant professional style, combining a navy blue silk shirt with a white pleated midi skirt.',
//       sender: 'ai',
//       timestamp: new Date(),
//     });

//     addMessage({
//       id: generateUniqueId('msg_'),
//       text: '',
//       sender: 'ai',
//       timestamp: new Date(),
//       images: [
//         {
//           id: generateUniqueId('img_'),
//           url: getTestImage('TEST02'),
//           alt: 'Garment Image',
//         },
//         {
//           id: generateUniqueId('img_'),
//           url: getTestImage('TEST03'),
//           alt: 'Garment Image',
//         }
//       ]
//     });

//     addMessage({
//       id: generateUniqueId('msg_'),
//       text: "Would you like to generate another look for this item? If you'd like me to tweak this outfit, just let me know.",
//       sender: 'ai',
//       timestamp: new Date(),
//       buttons: [
//         {
//           id: 'button1',
//           text: 'Yes, one more outfit',
//           action: 'generate_another_look'
//         },
//         {
//           id: 'button2',
//           text: 'change accessories',
//           action: 'change_accessories'
//         }
//       ],
//     });
//   }, 1000 * 5);
// }
