import React, { useRef, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatHeader } from "@/components/Chat";
import { useRouter, useFocusEffect } from "expo-router";
import { ChatSessionService } from "@/services/ChatSessionService";
import { Image } from "expo-image";
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, TextInput, Alert, Keyboard, TouchableWithoutFeedback, ScrollView, Platform, RefreshControl } from "react-native";
import { BACKGROUNDS } from "@/config/imagePaths";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useImagePicker } from "@/hooks/useImagePicker";
import { ForYouService } from "@/services/ForYouService";
import { ForYou } from "@/types/styleTemplate.types";




export default function HomeScreen() {
  const router = useRouter();
  const [foryou, setForyou] = useState<ForYou[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 刷新计数器，用于强制重新渲染图片
  const navigation = useNavigation();
  const inputText = useRef<string>("");
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // 加载数据函数
  const loadForYouData = useCallback(async () => {
    const data = await ForYouService.getAllActiveForYou();
    setForyou(data);
  }, []);

  // 页面获得焦点时滚动到顶部并刷新数据
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      
      // 清空现有数据，避免显示旧内容
      // setForyou([]);
      
      // 重新加载数据
      loadForYouData();
    }, [loadForYouData])
  );

  // 下拉刷新处理
  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      // 清除图片缓存
      console.log('🧹 开始清除图片缓存...');
      await Promise.all([
        Image.clearMemoryCache(),  // 清除内存缓存
        Image.clearDiskCache(),    // 清除磁盘缓存
      ]);
      console.log('✅ 图片缓存清除完成');
      
      // 清空现有数据，强制重新渲染
      // setForyou([]);
      
      // 增加刷新计数器，强制重新渲染图片
      setRefreshKey(prev => prev + 1);
      
      // 短暂延迟，确保清空操作完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 重新加载数据
      await loadForYouData();
    } catch (error) {
      console.error('❌ 清除缓存失败:', error);
      // 即使清除缓存失败，也要加载数据
      await loadForYouData();
    } finally {
      setRefreshing(false);
    }
  };
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


        <View className="flex-col justify-center items-center bg-gray-100 backdrop-blur-sm rounded-2xl w-full p-2">
          <KeyboardAvoidingView
            behavior="padding"
            className="w-full mb-2"
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
                className="bg-gray-100 rounded-xl px-2 text-lg min-h-[46px] max-h-[100px]"
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
              className="bg-gray-200 rounded-xl p-2 flex-row items-center justify-center"
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

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {/* For You 部分 - 显示所有风格图片 */}
          <View className="flex-1 bg-white rounded-t-3xl px-6 border border-gray-200 w-full">
            <View className="flex-row justify-between items-center">
              <Text className="text-2xl font-bold text-black">For You</Text>
              <Text className="text-gray-500 text-sm">{foryou.length} styles</Text>
            </View>

            {/* 可滚动内容 */}
            <View className="flex-1 items-start justify-center ">
              <ScrollView
                ref={scrollViewRef}
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingBottom: 220  // 足够大的固定间距，确保内容不被遮挡
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#000000']} // Android 颜色
                    tintColor="#000000" // iOS 颜色
                  />
                }
              >
                {/* 显示所有图片 */}
                <View className="flex-row flex-wrap justify-between items-center w-full">
                  {foryou.map((image, index) => (
                    <TouchableOpacity
                      key={`${refreshKey}-${index}`}
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
                        key={`style-image-${refreshKey}-${index}-${image.id}`}
                        source={image.url}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        placeholder="Loading..."
                        cachePolicy="memory-disk"
                        priority="high"
                        recyclingKey={`home-style-${refreshKey}-${index}`}
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
              </ScrollView>
            </View>

          </View>
        </TouchableWithoutFeedback>
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
