import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Chat, ChatHeader } from "@/components/Chat";
import { Message, MessageButton } from "@/components/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChatSessionService } from "@/services/ChatSessionService";
import { Image } from "expo-image";
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, TextInput, Alert, Keyboard, TouchableWithoutFeedback, ScrollView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { BACKGROUNDS } from "@/config/imagePaths";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useImagePicker } from "@/hooks/useImagePicker";

const STYLE_OPTIONS = [
  {
    id: "Old Money",
    name: "Old Money",
    url: require("../../../assets/onboarding/Style/OldMoney.png"),
  },
  {
    id: "BurgundyFall",
    name: "BurgundyFall",
    url: require("../../../assets/onboarding/Style/Preppy.png"),
  },
  {
    id: "Y2K",
    name: "Y2K",
    url: require("../../../assets/onboarding/Style/Y2K.png"),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [imagesUrl, setImagesUrl] = useState<{ id: string, name: string, url: string }[]>([]);
  const navigation = useNavigation();
  const inputText = useRef<string>("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const loadOnboardingData = async () => {
      setImagesUrl(STYLE_OPTIONS);
    };
    loadOnboardingData();
  }, []);
  // 使用图片选择 hook
  const { showImagePickerOptions } = useImagePicker({
    onImageSelected: async (imageUri: string) => {
      if (imageUri) {
        const session = await ChatSessionService.createSession("free_chat");
        if (session) {
          router.push({
            pathname: "/free_chat",
            params: { sessionId: session.id, imageUri }
          });
        }
      } else {
        Alert.alert("Error", "Failed to select image");
      }
    },
  });

  const handleDrawerOpen = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // 处理输入变化
  const handleInputChange = (text: string) => {

    inputText.current = text;
  };

  // 处理发送消息
  const handleSendMessage = async () => {
    const trimmedText = inputText.current.trim();
    if (trimmedText) {

      // 先清空输入框
      inputText.current = "";
      inputRef.current?.clear();
      // 创建新会话
      const session = await ChatSessionService.createSession("free_chat");
      // 然后跳转
      if (session) {
        router.push({
          pathname: "/free_chat",
          params: { sessionId: session.id, message: trimmedText }
        });
      }
    } else {
      Alert.alert("Please", "Please enter a message");
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* 背景图片 */}
      <Image
        source={BACKGROUNDS("MAIN")}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header - 固定在顶部 */}
        <ChatHeader
          title="Styla"
          isOnline={true}
          showAvatar={false}
          onMore={handleDrawerOpen}
          showDrawerButton={true}
        />

        {/* 可滚动内容 */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ 
            paddingBottom: 220  // 足够大的固定间距，确保内容不被遮挡
          }}
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex items-start justify-center px-2">
          {/* <MaskedView
            style={{ height: 110, flexDirection: 'row' }}
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
          </MaskedView> */}

          <View className="flex-col justify-center items-center bg-gray-100 backdrop-blur-sm rounded-2xl w-full p-4">
            <KeyboardAvoidingView
              behavior="padding"
              className="w-full mb-4"
              pointerEvents="box-none"
              accessibilityRole="none"
            >
              {/* 第一行：输入框 */}
              <View className="rounded-xl border border-gray-200">
                <TextInput
                  ref={inputRef}
                  // value={inputText.current}
                  onChangeText={handleInputChange}
                  onSubmitEditing={handleSendMessage}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  placeholder="Anything about style..."
                  placeholderTextColor="#9CA3AF"
                  multiline={false}
                  maxLength={500}
                  editable={true}
                  className="bg-gray-100 rounded-xl p-3 text-lg min-h-[46px] max-h-[100px]"
                  style={{
                    textAlignVertical: "center",
                  }}
                  accessibilityRole="text"
                  accessibilityLabel="add styling message..."
                  accessibilityHint="Type your message and press send to submit"
                />
              </View>
            </KeyboardAvoidingView>

            {/* 第二行：按钮 */}
            <View className="flex-row justify-between w-full gap-3">

              <TouchableOpacity
                className="bg-gray-200 rounded-xl p-3 flex-row items-center justify-center"
                onPress={showImagePickerOptions}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="camera" size={24} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-xl p-2 flex-row items-center justify-center"
                onPress={async () => {
                  const session = await ChatSessionService.createSession("style_an_item");
                  if (session) {
                    router.push({
                      pathname: "/style_an_item",
                      params: { sessionId: session.id }
                    });
                  }
                  // router.push("/onboarding/BaseSix");
                }}
                activeOpacity={1}
              >
                <Text className="text-black text-center font-medium">👗Style Item</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-200 backdrop-blur-sm rounded-xl p-2 flex-row items-center justify-center"
                onPress={async () => {
                  const session = await ChatSessionService.createSession("outfit_check");
                  if (session) {
                    router.push({
                      pathname: "/outfit_check",
                      params: { sessionId: session.id }
                    });
                  }
                }}
                activeOpacity={1}
              >
                <Text className="text-black text-center font-medium">🪞Outfit Check</Text>
              </TouchableOpacity>
            </View>
          </View>

            {/* For You 部分 - 显示所有风格图片 */}
            <View className="bg-white rounded-t-3xl p-6 border border-gray-200 mt-4 mb-2">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-black">All Styles</Text>
                <Text className="text-gray-500 text-sm">{imagesUrl.length} styles</Text>
              </View>

              {/* 显示所有图片 */}
              <View className="flex-row flex-wrap justify-between">
                {imagesUrl.map((image, index) => (
                  <TouchableOpacity 
                    key={index} 
                    className="bg-gray-200 w-[48%] rounded-2xl overflow-hidden relative mb-4"
                    style={{ aspectRatio: 712 / 1247 }}
                    activeOpacity={0.8}
                    onPress={() => {
                      const imageData = {
                        id: image.id,
                        name: image.name,
                        url: image.url
                      };
                      router.push({
                        pathname: "/foryou",
                        params: { 
                          image: JSON.stringify(imageData)
                        }
                      });
                    }}
                  >
                    <Image
                      key={`style-image-${index}-${image.id}`}
                      source={image.url}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      placeholder="Loading..."
                      cachePolicy="memory-disk"
                      priority="high"
                      recyclingKey={`home-style-${index}`}
                    />
                    {/* 图片名称标签 */}
                    <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                      <Text className="text-white text-sm font-semibold text-center">
                        {image.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 额外的底部空间指示器 */}
              <View className="h-4" />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
      </SafeAreaView>
    </View>
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
