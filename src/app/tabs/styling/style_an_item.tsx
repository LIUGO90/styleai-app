import React, { useState } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chat, ChatHeader } from "@/components/Chat";
import {
  Message,
  MessageButton,
  ImageUploadCallback,
} from "@/components/types";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { aiRequest, aiRequestKling } from "@/services/aiReuest";

export default function StyleAnItemScreen() {
  const router = useRouter();
  const [selectedButtons, setSelectedButtons] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
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
        buttons: [
          {
            id: "card_btn1",
            text: "Work",
            type: "secondary",
            action: "view_product",
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
        ],
        commitButton: {
          id: "commit_btn",
          text: "Generate My Outfit",
          action: "confirm_selection",
        },
      },
    },
  ]);

  const updateMessage = (message: Message) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === message.id ? message : msg)),
    );
  };
  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
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
      case "confirm_selection":
        console.log("确认选择");
        if (selectedButtons === "") {
          Alert.alert("请选择一个场合");
          return;
        }
        if (selectedImage === "") {
          Alert.alert("请上传一张图片");
          return;
        }

        await AsyncStorage.removeItem("imageUrl");
        // await AsyncStorage.setItem('garmentImage', imageUrl)
        setSelectedImage("imageUrl");
        const { jobId, message } = await aiRequest(selectedImage);
        if (jobId === "error") {
          Alert.alert("AI请求失败");
          return;
        }
        const resultKling = await aiRequestKling(jobId, 0);
        if (resultKling === "error") {
          Alert.alert("AI请求失败");
          return;
        }
        // 处理确认选择逻辑
        const confirmMessage: Message = {
          id: (Date.now() + 2).toString(),
          // text: `Your selection has been confirmed! Generating outfit suggestions...`,
          text: ``,
          sender: "ai",
          senderName: "AI助手",
          timestamp: new Date(),
          showAvatars: true,
          images: [
            {
              id: "image1",
              url: resultKling,
              alt: "Kling Image",
            },
          ],
        };
        addMessage(confirmMessage);
        // 清除选中的按钮
        break;
      case "view_product":
      case "add_to_cart":
        console.log("选择场合:", button.text);
        setSelectedButtons(button.text);
        break;
    }
  };
  const handleImageUpload: ImageUploadCallback = {
    onImageSelect: (imageUri: string, messageId?: string) => {
      console.log("选择的图片:", imageUri, "消息ID:", messageId);
      if (messageId) {
        setSelectedImage(imageUri);
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
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ChatHeader
        title="Style an Item"
        // subtitle="在线"
        isOnline={true}
        showAvatar={false}
        onBack={() => router.push("/tabs/styling")}
        // onMore={() => console.log('更多选项')}
      />

      <Chat
        messages={messages}
        onSendMessage={handleSendMessage}
        onButtonPress={handleButtonPress}
        onImageUpload={handleImageUpload}
        placeholder="输入消息..."
        showAvatars={true}
      />
    </SafeAreaView>
  );
}
