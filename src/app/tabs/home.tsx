import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chat, ChatHeader } from "@/components/Chat";
import { Message, MessageButton } from "@/components/types";
import { useRouter } from "expo-router";
import { ChatSessionService } from "@/services/ChatSessionService";
import { Image } from "expo-image";
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, TextInput, Alert, Keyboard, TouchableWithoutFeedback } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { BACKGROUNDS } from "@/config/imagePaths";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useImagePicker } from "@/hooks/useImagePicker";



export default function HomeScreen() {
  const router = useRouter();
  const [imagesUrl, setImagesUrl] = useState<string[]>([]);
  const navigation = useNavigation();

  const inputText = useRef<string>("");
  const inputRef = useRef<TextInput>(null);

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

  useEffect(() => {
    const loadOnboardingData = async () => {
      const imagesUrl = await AsyncStorage.getItem("newlook");
      console.log("imagesUrl", imagesUrl);
      if (imagesUrl) {
        console.log("imagesUrl", JSON.parse(imagesUrl) as string[]);
        setImagesUrl(JSON.parse(imagesUrl) as string[]);
      }
    };
    loadOnboardingData();
  }, []);

  const handleDrawerOpen = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // 处理输入变化
  const handleInputChange = (text: string) => {
    // console.log('handleInputChange', text);
    inputText.current = text;
  };

  // 处理发送消息
  const handleSendMessage = async () => {
    const trimmedText = inputText.current.trim();
    if (trimmedText) {
      console.log('Sending message:', trimmedText);
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-white" >
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
        onMore={handleDrawerOpen}
        showDrawerButton={true}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 items-start justify-center px-6">
          <MaskedView
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
          </MaskedView>

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

        </View>
      </TouchableWithoutFeedback>
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
        <View className="flex-row space-x-3 mb-2 justify-center">
          <TouchableOpacity className=" mx-2">
            <View className="bg-gray-200 max-w-[200px] w-48 rounded-2xl aspect-[3/4] overflow-hidden">
              <Image
                source={imagesUrl[0]}
                style={{ width: '100%', height: "120%" }}
                contentFit="cover"
                placeholder="Loading..."
                cachePolicy="memory-disk"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className=" mx-2">
            <View className="bg-gray-200 max-w-[200px] w-48 rounded-2xl aspect-[3/4] overflow-hidden">
              <Image
                source={imagesUrl[1]}
                style={{ width: '100%', height: "120%" }}
                contentFit="cover"
                placeholder="Loading..."
                cachePolicy="memory-disk"
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
