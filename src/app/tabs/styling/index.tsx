import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chat, ChatHeader } from "@/components/Chat";
import { Message, MessageButton } from "@/components/types";
import { useRouter } from "expo-router";
import { ChatSessionService } from "@/services/ChatSessionService";
import { Image } from "expo-image";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import {
  BACKGROUNDS,
  IMAGE_PATHS,
  getTestImage,
} from "@/config/imagePaths";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function StylingScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Good morning, Jessie! It’s cloudy☁️ and 62° outside. Grey skies can’t dim your inner light. Carry your sunshine within.

How can I help to make your outfit shine today? `,
      sender: "system",
      senderName: "AI助手",
      showAvatars: false,
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: "2",
      text: "",
      sender: "system",
      senderName: "AI助手",
      timestamp: new Date(Date.now() - 60000),
      showAvatars: false,
      card: {
        id: "card1",
        title: "",
        subtitle: "",
        description: "",
        isShell: "none",
        buttons: [
          {
            id: "card_btn1",
            text: "Style an Item",
            type: "primary",
            action: "style_an_item",
          },
          {
            id: "card_btn2",
            text: "Outfit Check",
            type: "secondary",
            action: "outfit_check",
          },
          {
            id: "card_btn3",
            text: "Generate OOTD",
            type: "secondary",
            action: "generate_ootd",
          },
        ],
      },
    },
  ]);

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
        const newSession =
          await ChatSessionService.createOrCurrent("style_an_item");
        console.log("Style an Item");
        router.push({
          pathname: "/ChatScreen/style_an_item",
          params: { sessionId: newSession?.id },
        });
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
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 背景图片 */}
      <Image
        source={BACKGROUNDS("MAIN")}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <ChatHeader
        title="Styla"
        // subtitle="在线"
        isOnline={true}
        showAvatar={false}
      // onBack={() => console.log('返回')}
      // onMore={() => console.log('更多选项')}
      />
      <View className="flex-1 items-start justify-center px-6">
        <MaskedView
          style={{ height: 120, flexDirection: 'row' }}
          maskElement={
            <Text style={styles.gradientText}>
              Hi {AsyncStorage.getItem("name")} !{"\n"}Ready to shine today?
            </Text>
          }
        >
          <LinearGradient
            colors={['#ff9a9e', '#fecfef', '#fecfef', '#f8cd69', '#ff9a9e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </MaskedView>

        {/* 按钮区域 */}
        <View className="mt-8 px-2 w-full">
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl">
            <View className="flex-row  justify-between">
              <TouchableOpacity
                className="flex-1 bg-white rounded-xl py-3 px-4 mx-2"
                onPress={() => handleButtonPress({ id: "card_btn1", text: "Style an Item", type: "primary", action: "style_an_item" }, {} as Message)}
                activeOpacity={1}
              >
                <Text className="text-black text-center font-medium">Style an Item</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-white  backdrop-blur-sm rounded-xl py-3 px-4 mx-2"
                onPress={() => handleButtonPress({ id: "card_btn2", text: "Outfit Check", type: "secondary", action: "outfit_check" }, {} as Message)}
                activeOpacity={1}
                >
                <Text className="text-black text-center font-medium">Outfit Check</Text>
              </TouchableOpacity>
                {/* 
                
              <TouchableOpacity
                className="flex-1 bg-white backdrop-blur-sm rounded-xl py-3 px-4 mx-2"
                onPress={() => handleButtonPress({ id: "card_btn3", text: "Generate OOTD", type: "secondary", action: "generate_ootd" }, {} as Message)}
                activeOpacity={1}
              >
                <Text className="text-gray-700 text-center font-medium">Generate OOTD</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </View>
      <View className="bg-white rounded-t-3xl p-6 border border-gray-200" >
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-black">My Lookbook</Text>
          <TouchableOpacity
            onPress={() => router.replace("/tabs/lookbook")}
          >
            <Text className="text-gray-500 text-base">More</Text>
          </TouchableOpacity>
        </View>

        {/* 图片展示区域 */}
        <View className="flex-row space-x-3 mb-2">
          <TouchableOpacity className="flex-1 mx-2">
            <View className="bg-gray-200 rounded-2xl aspect-[3/4] overflow-hidden">
              <Image
                source={require("../../../../assets/onboarding/Final/1.jpg")}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                placeholder="Loading..."
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 mx-2">
            <View className="bg-gray-200 rounded-2xl aspect-[3/4] overflow-hidden">
              <Image
                source={require("../../../../assets/onboarding/Final/2.jpg")}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                placeholder="Loading..."
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gradientText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'left',
    lineHeight: 36,
    backgroundColor: 'transparent',
  },
});
