import React, { useRef, useState, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatHeader } from "@/components/Chat";
import { useRouter, useFocusEffect } from "expo-router";
import { ChatSessionService } from "@/services/ChatSessionService";
import { Image } from "expo-image";
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, TextInput, Alert, Keyboard, TouchableWithoutFeedback, ScrollView, Platform, RefreshControl, FlatList, Animated } from "react-native";
import { BACKGROUNDS } from "@/config/imagePaths";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useImagePicker } from "@/hooks/useImagePicker";
import { ForYouService } from "@/services/ForYouService";
import { ForYou } from "@/types/styleTemplate.types";
import { useCredits } from "@/hooks/usePayment";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/services/AnalyticsService";
import { shadowStyles } from "@/utils/shadow";




export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [foryou, setForyou] = useState<ForYou[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 刷新计数器，用于强制重新渲染图片
  const navigation = useNavigation();
  const inputText = useRef<string>("");
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<Animated.FlatList<any>>(null);
  const [starNumber, setStarNumber] = useState(0);
  const { credits, refresh: refreshCredits } = useCredits();
  const scrollY = useRef(new Animated.Value(0)).current;


  // 加载数据函数
  const loadForYouData = useCallback(async () => {
    const data = await ForYouService.getAllActiveForYou();
    setForyou(data);
  }, []);

  // 页面获得焦点时滚动到顶部并刷新数据
  useFocusEffect(
    useCallback(() => {
      // 追踪页面浏览
      analytics.page('home', {
        category: 'main',
        tab: 'home',
      });

      refreshCredits();
      scrollViewRef.current?.scrollToOffset({ offset: 0, animated: false });

      // setStarNumber(credits?.available_credits || 0);
      // 清空现有数据，避免显示旧内容
      // setForyou([]);

      // 重新加载数据
      loadForYouData();
    }, [loadForYouData])
  );


  useEffect(() => {
    console.log("🎈credits", credits);
    setStarNumber(credits?.available_credits || 0);
  }, [credits]);

  // 下拉刷新处理
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCredits();
    try {
      // 清除图片缓存
      console.log('🧹 开始清除图片缓存...');
      // await Promise.all([
      //   Image.clearMemoryCache(),  // 清除内存缓存
      //   Image.clearDiskCache(),    // 清除磁盘缓存
      // ]);
      // console.log('✅ 图片缓存清除完成');

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
        const session = await ChatSessionService.createSession(user?.id || '', "free_chat");
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
      // 追踪从首页发送消息
      analytics.chat('send', {
        has_text: trimmedText.length > 0,
        has_image: false,
        text_length: trimmedText.length,
        source: 'home_screen',
      });

      // 先清空输入框
      inputText.current = "";
      inputRef.current?.clear();
      // 创建新会话
      const session = await ChatSessionService.createSession(user?.id || '', "free_chat");
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
        <Animated.View
          style={{
            opacity: scrollY.interpolate({
              inputRange: [0, 50, 100],
              outputRange: [1, 0.5, 0],
              extrapolate: 'clamp',
            }),
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, -100],
                extrapolate: 'clamp',
              }),
            }],
          }}
        >
          <ChatHeader
            title="Styla"
            isOnline={true}
            showAvatar={false}
            onMore={handleDrawerOpen}
            showDrawerButton={true}
            onStar={() => {

            }}
            startNumber={starNumber}
          />
        </Animated.View>

        <Animated.View
          className="flex-col justify-center items-center bg-white backdrop-blur-sm rounded-2xl p-2"
          style={[
            shadowStyles.medium,
            {
              marginHorizontal: 16, // 左右边距 16pt
              marginTop: 24, // 板块之间的行间距 24pt
              marginBottom: 24, // 板块之间的行间距 24pt
              opacity: scrollY.interpolate({
                inputRange: [0, 50, 100],
                outputRange: [1, 0.5, 0],
                extrapolate: 'clamp',
              }),
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -150],
                  extrapolate: 'clamp',
                }),
              }],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior="padding"
            className="w-full"
            pointerEvents="box-none"
            accessibilityRole="none"
          >
            {/* 第一行：输入框 */}
            <View className="rounded-xl border border-gray-200" style={{ marginBottom: 16 }}> {/* 内容之间的行间距 16pt */}
              <View className="flex-row items-center bg-gray-100 rounded-xl px-3">
                <MaterialCommunityIcons name="image-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  ref={inputRef}
                  onChangeText={handleInputChange}
                  onSubmitEditing={handleSendMessage}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  placeholder="Chat anything about styling..."
                  placeholderTextColor="#9CA3AF"
                  multiline={false}
                  maxLength={500}
                  editable={true}
                  className="flex-1 text-lg min-h-[46px] max-h-[100px]"
                  style={{
                    textAlignVertical: "center",
                  }}
                  accessibilityRole="text"
                  accessibilityLabel="add styling message..."
                  accessibilityHint="Type your message and press send to submit"
                />
              </View>
            </View>
          </KeyboardAvoidingView>

          {/* 第二行：按钮 */}
          <View className="flex-row w-full" style={{ gap: 8 }}>
            <TouchableOpacity
              className="bg-gray-200 rounded-xl p-2 flex-row items-center justify-center"
              onPress={showImagePickerOptions}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="camera" size={24} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-200 rounded-full px-4 py-2 flex-row items-center justify-center"
              onPress={async () => {
                const session = await ChatSessionService.createSession(user?.id || '', "style_an_item");
                if (session) {
                  router.push({
                    pathname: "/style_an_item",
                    params: { sessionId: session.id }
                  });
                }
              }}
              activeOpacity={0.7}
            >

              <Text className="text-black text-center font-medium">👗Style Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-200 rounded-full px-4 py-2 items-center justify-center"
              onPress={async () => {
                const session = await ChatSessionService.createSession(user?.id || '', "outfit_check");
                if (session) {
                  router.push({
                    pathname: "/outfit_check",
                    params: { sessionId: session.id }
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <Text className="text-black text-center font-medium">🪞outfit check</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            flex: 1,
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, -190], // 向上移动，占据 Header 和输入卡片的空间
                extrapolate: 'clamp',
              }),
            }],
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} className="flex-1">
            {/* For You 部分 - 显示所有风格图片 */}
            <Animated.View
              className="bg-white rounded-t-3xl border border-gray-200 w-full pb-20"
              style={{
                flex: 1,
                minHeight: '110%', // 确保最小高度为100%
                paddingHorizontal: 16, // 左右边距 16pt
                paddingTop: 24, // 板块之间的行间距 24pt
              }}
            >
              <View className="flex-row justify-between items-center mb-6" style={{ marginBottom: 24 }}> {/* 板块之间的行间距 24pt */}
                <Text className="text-2xl font-bold text-black">For You</Text>
              </View>

              {/* 可滚动内容 */}
              <View className="flex-1">
                <Animated.FlatList
                  ref={scrollViewRef}
                  data={foryou}
                  numColumns={2}
                  keyExtractor={(item, index) => `${refreshKey}-${index}-${item.id}`}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{
                    flexGrow: 1, // 确保内容可以扩展填满空间
                  }}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                  )}
                  scrollEventThrottle={16}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={['#000000']} // Android 颜色
                      tintColor="#000000" // iOS 颜色
                    />
                  }
                  columnWrapperStyle={{
                    justifyContent: 'space-between',
                    marginBottom: 16, // 内容之间的行间距 16pt
                  }}
                  renderItem={({ item: image, index }) => {
                    const isEven = index % 2 === 0;
                    return (
                      <View
                        className="items-start"
                        style={{
                          width: '48%',
                          marginBottom: 16, // 内容之间的行间距 16pt
                          marginRight: isEven ? 12 : 0, // 列间距 12pt（只在左侧列添加）
                        }}
                      >
                        <TouchableOpacity
                          className="bg-gray-200 w-full overflow-hidden relative"
                          style={{
                            aspectRatio: 3 / 4, // 缩略图比例 3:4
                            borderRadius: 10, // 圆角 10
                          }}
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
                            style={{ width: '100%', height: '120%' }}
                            contentFit="cover"
                            placeholder="Loading..."
                            cachePolicy="memory-disk"
                            priority="high"
                            recyclingKey={`home-style-${refreshKey}-${index}`}
                          />
                        </TouchableOpacity>
                        {/* 图片名称标签 */}
                        <View className="flex-col justify-left items-left mt-1" style={{ marginTop: 4 }}> {/* 细节之间的行间距 4pt */}
                          <Text className="text-black font-weight-500 style-medium font-size-14">
                            {image.name}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                />
              </View>

            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
