import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chat, ChatHeader } from "@/components/Chat";
import {
  Message,
  MessageButton,
  ImageUploadCallback,
} from "@/components/types";
import { useRouter } from "expo-router";
import {
  getTestImage,
  getTestImageHeight,
  getTestImageWidth,
} from "@/config/imagePaths";
import { Alert } from "react-native";

// 生成唯一ID的辅助函数
const generateUniqueId = (prefix: string = "") => {
  return `${prefix}${Date.now()}_${(Math.random() * 10000).toString()}`;
};

const initMessages: Message[] = [
  {
    id: "1",
    text: "Outfit Check",
    sender: "user",
    senderName: "AI助手",
    timestamp: new Date(Date.now() - 60000),
    showAvatars: true,
  },
  {
    id: "2",
    text: "Sure!  Send me photo of your outfit today.",
    sender: "system",
    timestamp: new Date(Date.now() - 60000),
    showAvatars: false,
  },
  {
    id: "3",
    text: "",
    sender: "ai",
    senderName: "AI助手",
    timestamp: new Date(Date.now() - 30000),
    showAvatars: false,
    card: {
      id: "card1",
      title: "",
      subtitle: "",
      description: "",
      uploadImage: true, // 启用图片上传功能
    },
  },
];
export default function OutfitCheckScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initMessages);

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
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: `收到您的消息："${text}"。我正在分析您的搭配...`,
        sender: "ai",
        senderName: "AI助手",
        timestamp: new Date(),
        showAvatars: true,
      };
      setMessages((prev) => [...prev, reply]);
    }, 1000);
  };

  const handleButtonPress = (button: MessageButton, message: Message) => {
    console.log("按钮点击:", button.action, button.data);

    switch (button.action) {
      case "analyze_outfit":
        console.log("分析搭配");
        Alert.alert("分析搭配", "正在分析您的穿搭...");
        break;
      case "view_history":
        console.log("查看历史");
        Alert.alert("查看历史", "显示历史搭配记录");
        break;
      case "generate_preview":
        console.log("提交分析");

        message.buttons = [];
        updateMessage(message);

        const progressMessage: Message = {
          id: generateUniqueId("progress_"),
          text: "",
          sender: "ai",
          timestamp: new Date(),
          type: "progress",
          progress: {
            current: 3,
            total: 10,
            status: "processing", // 'pending' | 'processing' | 'completed' | 'error'
            message: "Putting together outfit for you...",
          },
        };
        addMessage(progressMessage);

        // 模拟后台处理
        setTimeout(() => {
          dateleMessage(progressMessage.id);
          addMessage({
            id: generateUniqueId("msg_"),
            text: "",
            sender: "ai",
            timestamp: new Date(),
            images: [
              {
                id: generateUniqueId("img_"),
                url: getTestImage("TEST05"),
                alt: "Generated Outfit Image",
                width: getTestImageWidth("TEST05"),
                height: getTestImageHeight("TEST05"),
              },
            ],
          });
          addMessage({
            id: generateUniqueId("msg_"),
            text: "Look better? If you'd like me to tweak this outfit, just let me know.",
            sender: "ai",
            timestamp: new Date(),
          });
        }, 500);
        break;
    }
  };

  const updateMessage = (message: Message) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === message.id ? message : msg)),
    );
  };

  const dateleMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const hideMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isHidden: true } : msg,
      ),
    );
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleImageUpload: ImageUploadCallback = {
    onImageSelect: (imageUri: string, messageId?: string) => {
      console.log("选择的图片:", imageUri, "消息ID:", messageId);
      if (messageId) {
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
                isHidden: true,
              };
            }
            return msg;
          }),
        );
        addMessage({
          id: generateUniqueId("msg_"),
          text: "",
          sender: "user",
          timestamp: new Date(),
          images: [
            {
              id: generateUniqueId("img_"),
              url: getTestImage("TEST04"),
              alt: "Uploaded Outfit Image",
            },
          ],
        });

        setTimeout(() => {
          // 模拟后台AI回复

          addMessage({
            id: generateUniqueId("msg_"),
            text: "This basic outfit lands you solidly in smart business‑casual daily style. A few quick tweaks—tucking and pressing your shirt, adding a structured blazer in white, and finishing with a slim belt + subtle jewelry..",
            sender: "system",
            timestamp: new Date(),
          });
          const messageId = generateUniqueId("msg_");
          addMessage({
            id: messageId,
            text: "Would you like to generate a preview of the improved look?",
            sender: "system",
            timestamp: new Date(),
            buttons: [
              {
                id: generateUniqueId("btn_"),
                text: "Yes, generate preview",
                action: "generate_preview",
                data: {
                  id: messageId,
                },
              },
            ],
          });
        }, 3000);
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ChatHeader
        title="搭配检查"
        subtitle="AI智能搭配分析"
        isOnline={true}
        showAvatar={true}
        onBack={() => router.back()}
        onMore={() => console.log("更多选项")}
      />

      <Chat
        messages={messages}
        onSendMessage={handleSendMessage}
        onButtonPress={handleButtonPress}
        onImageUpload={handleImageUpload}
        placeholder="描述您的搭配需求..."
        showAvatars={false}
      />
    </SafeAreaView>
  );
}
