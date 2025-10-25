import { View, Text, ScrollView, Pressable, StyleSheet, TouchableOpacity, Modal, Dimensions, Share, Platform, FlatList, ViewToken, TextInput, KeyboardAvoidingView, Keyboard, Animated } from "react-native";
import { Image } from "expo-image";
import { useEffect, useState, useCallback, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { aiRequestGemini, aiRequestLookbook } from "@/services/aiReuest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clearBadge } from "@/utils/badgeManager";
import { UserImageService } from "@/services/UserImageService";
import { pageActivityManager } from "@/utils/pageActivityManager";
import { imageUpdateManager } from "@/utils/imageUpdateManager";
import { useGlobalToast } from "@/utils/globalToast";
import { ChatSessionService } from "@/services/ChatSessionService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LookbookOne() {
  const [images, setImages] = useState<string[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [availableStyles, setAvailableStyles] = useState<string[]>(['All']);
  const [showStyleFilter, setShowStyleFilter] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false); // 批量选择模式
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set()); // 已选择的图片
  const [inputText, setInputText] = useState(''); // 输入框文本
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // 键盘状态
  const inputBottomPosition = useRef(new Animated.Value(48)).current; // 输入框底部位置动画
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);  // 全屏模式的 FlatList ref
  // 使用全局 Toast
  const { showToast } = useGlobalToast();

  // 键盘事件监听
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      console.log('Keyboard shown, height:', event.endCoordinates.height);
      setIsKeyboardVisible(true);
      Animated.timing(inputBottomPosition, {
        toValue: event.endCoordinates.height + 20, // 键盘高度 + 20px 间距
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('Keyboard hidden');
      setIsKeyboardVisible(false);
      Animated.timing(inputBottomPosition, {
        toValue: 48,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [inputBottomPosition]);

  const loadCollections = useCallback(async () => {

    try {
      // 获取所有 items
      const items = await UserImageService.getUserImages(user?.id || '');
      setAllItems(items);

      // 提取所有独特的风格
      const styles = ['All', ...new Set(items.map(item => item.style || 'Unknown').filter(Boolean))];
      setAvailableStyles(styles);

      // 提取所有图片 URL
      const allImages: string[] = items
        .filter(item => item.image_url && item.image_url.length > 0)
        .map(item => item.image_url);

      console.log(`✅ 成功获取 ${allImages.length} 张图片，${styles.length - 1} 个风格`);
      setImages(allImages);

    } catch (error) {
      console.error('❌ Failed to load lookbook items:', error);
      Alert.alert('Error', 'Failed to load your lookbook');
    }
  }, []);

  // 根据选择的风格过滤图片
  const filterImagesByStyle = useCallback((style: string) => {
    setSelectedStyle(style);

    if (style === 'All') {
      const allImages = allItems
        .filter(item => item.image_url && item.image_url.length > 0)
        .map(item => item.image_url);
      setImages(allImages);
    } else {
      const filteredImages = allItems
        .filter(item => item.style === style && item.image_url && item.image_url.length > 0)
        .map(item => item.image_url);
      setImages(filteredImages);
    }
    console.log(`🎨 筛选风格: ${style}, 图片数量: ${images.length}`);
  }, [allItems]);

  const handleImagePress = (index: number) => {
    if (images.length === 0) return;

    // 如果在选择模式，切换选择状态
    if (selectionMode) {
      toggleImageSelection(images[index]);
      return;
    }

    setCurrentIndex(index);
    setModalVisible(true);

    // 延迟滚动到选中的图片，确保 Modal 已打开
    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({
          index,
          animated: false,
        });
      } catch (error) {
        console.warn('滚动到索引失败:', error);
      }
    }, 100);
  };

  // 切换选择模式
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedImages(new Set()); // 清空选择
  };

  // 切换单张图片的选择状态
  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageUrl)) {
        newSet.delete(imageUrl);
      } else {
        newSet.add(imageUrl);
      }
      return newSet;
    });
  };

  // 全选
  const selectAll = () => {
    setSelectedImages(new Set(images));
  };

  // 取消全选
  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) {
      Alert.alert('No Selection', 'Please select at least one image to delete');
      return;
    }

    Alert.alert(
      'Delete Images',
      `Are you sure you want to delete ${selectedImages.size} image(s)? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // 找到要删除的所有 items
              const itemsToDelete = allItems.filter(item =>
                selectedImages.has(item.image_url)
              );

              if (itemsToDelete.length === 0) {
                Alert.alert('Error', 'No images found to delete');
                return;
              }

              // 提取所有 ID
              const imageIds = itemsToDelete.map(item => item.id);

              // 批量删除
              const deletedCount = await UserImageService.batchDeleteImages(imageIds);

              console.log(`✅ 成功删除 ${imageIds.length} 张图片`);

              // 退出选择模式
              setSelectionMode(false);
              setSelectedImages(new Set());

              // 重新加载数据
              await loadCollections();

              // 通知其他页面更新
              imageUpdateManager.notifyImageUpdate('lookbook');

              showToast({
                message: `Successfully deleted ${imageIds.length} image(s)`,
                type: 'success',
              });
            } catch (error) {
              console.error('❌ 批量删除失败:', error);
              Alert.alert('Error', 'Failed to delete images. Please try again.');
            }
          },
        },
      ]
    );
  };

  // 监听全屏模式下的滑动变化
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // 删除当前图片
  const handleDeleteImage = async () => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentImageUrl = images[currentIndex];

              // 从 allItems 中找到对应的 item
              const itemToDelete = allItems.find(item => item.image_url === currentImageUrl);

              if (itemToDelete) {
                // 保存删除前的索引
                const deletedIndex = currentIndex;
                const totalImages = images.length;

                // 调用删除服务（软删除）
                await UserImageService.softDeleteImage(itemToDelete.id);

                console.log(`✅ 成功删除图片: ${itemToDelete.id}`);

                // 重新加载数据
                await loadCollections();

                // 通知其他页面更新
                imageUpdateManager.notifyImageUpdate('lookbook');

                // 如果删除后没有图片了，关闭 modal
                if (totalImages <= 1) {
                  setModalVisible(false);
                  showToast({
                    message: 'Image deleted successfully',
                    type: 'success',
                  });
                } else {
                  // 还有图片，调整索引
                  const newIndex = deletedIndex >= totalImages - 1
                    ? deletedIndex - 1  // 删除的是最后一张，显示前一张
                    : deletedIndex;      // 否则显示当前位置的下一张

                  setCurrentIndex(Math.max(0, newIndex));

                  // 延迟滚动到新位置
                  setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                      index: Math.max(0, newIndex),
                      animated: true,
                    });
                  }, 300);

                  showToast({
                    message: 'Image deleted successfully',
                    type: 'success',
                  });
                }
              } else {
                Alert.alert('Error', 'Image not found');
              }
            } catch (error) {
              console.error('❌ 删除图片失败:', error);
              Alert.alert('Error', 'Failed to delete image. Please try again.');
            }
          },
        },
      ]
    );
  };

  // 分享当前图片
  const handleShareImage = async () => {
    try {
      const currentImageUrl = images[currentIndex];

      // 使用 React Native 的 Share API
      const result = await Share.share({
        message: 'Check out my look from Magic Lookbook!',
        url: currentImageUrl,
        title: 'My Lookbook',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`✅ 分享成功: ${result.activityType}`);
        } else {
          console.log('✅ 分享成功');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('📤 分享已取消');
      }
    } catch (error) {
      console.error('❌ 分享失败:', error);
      Alert.alert('Error', 'Failed to share image. Please try again.');
    }
  };

  // 使用 useFocusEffect 确保每次页面获得焦点时都重新加载
  useFocusEffect(
    useCallback(() => {
      // 标记用户进入 lookbook 页面
      pageActivityManager.setActivePage('lookbook');

      // 滚动到顶部
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      loadCollections();
      // 用户进入 lookbook 页面时清除徽章
      clearBadge('lookbook');

      // 监听图片更新事件，实时刷新页面
      const unsubscribe = imageUpdateManager.addListener((type) => {
        console.log(`🔄 收到图片更新通知: ${type}，刷新 Lookbook 页面`);
        // 当有新图片时，自动重新加载
        if (type === 'lookbook' || type === 'all') {
          loadCollections();
        }
      });

      // 返回清理函数，用户离开页面时清除活动状态和监听器
      return () => {
        pageActivityManager.clearActivePage();
        unsubscribe(); // 移除监听器
      };
    }, [loadCollections])
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 顶部标题栏 */}
      <View className="flex-row justify-between items-center px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        {selectionMode ? (
          <>
            <TouchableOpacity
              onPress={toggleSelectionMode}
              className="flex-row items-center"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={24} color="#000" />
              <Text className="text-lg font-semibold ml-2">
                {selectedImages.size} Selected
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={selectedImages.size === images.length ? deselectAll : selectAll}
                className="bg-gray-100 px-4 py-2 rounded-full"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-medium text-gray-700">
                  {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text className="text-2xl font-bold text-black">MAGIC LOOKBOOK</Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={toggleSelectionMode}
                className="bg-gray-100 p-2 rounded-full"
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="checkbox-multiple-marked" size={20} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowStyleFilter(!showStyleFilter)}
                className="bg-black px-4 py-2 rounded-full flex-row items-center"
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={showStyleFilter ? "close" : "filter-variant"}
                  size={18}
                  color="#fff"
                />
                <Text className="text-white text-sm font-medium ml-1">
                  {selectedStyle === 'All' ? 'Filter' : selectedStyle}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* 风格筛选水平滚动栏（选择模式下隐藏）*/}
      {showStyleFilter && !selectionMode && (
        <View className="bg-gray-50 border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            {availableStyles.map((style, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  filterImagesByStyle(style);
                  setShowStyleFilter(false);
                }}
                className={`mr-3 px-4 py-2 rounded-full ${selectedStyle === style
                  ? 'bg-black'
                  : 'bg-white border border-gray-300'
                  }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-medium ${selectedStyle === style ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {style}
                  {style !== 'All' && ` (${allItems.filter(item => item.style === style).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 220  // 足够大的固定间距，确保内容不被遮挡
        }}
      >
        {/* 当前显示的图片数量提示 */}
        {selectedStyle !== 'All' && (
          <View className="mb-3">
            <Text className="text-sm text-gray-500">
              Showing {images.length} {images.length === 1 ? 'image' : 'images'} in {selectedStyle}
            </Text>
          </View>
        )}

        {images.length > 0 ? (
          <View className="flex-row flex-wrap justify-between">
            {images.map((image, index) => {
              const isSelected = selectedImages.has(image);

              return (
                <TouchableOpacity
                  key={index}
                  className="bg-gray-200 w-[48%] rounded-3xl overflow-hidden relative mb-4"
                  style={{ aspectRatio: 712 / 1247 }}
                  activeOpacity={0.8}
                  onPress={() => handleImagePress(index)}
                >
                  <Image
                    source={image}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    placeholder="Loading..."
                    cachePolicy="memory-disk"
                    priority="high"
                    recyclingKey={`lookbook-${index}`}
                  />

                  {/* 选择模式下的复选框 */}
                  {selectionMode && (
                    <View className="absolute top-2 right-2">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${isSelected ? 'bg-blue-500' : 'bg-white/80 border-2 border-white'
                          }`}
                      >
                        {isSelected && (
                          <MaterialCommunityIcons name="check" size={20} color="#fff" />
                        )}
                      </View>
                    </View>
                  )}

                  {/* 选中状态的遮罩 */}
                  {selectionMode && isSelected && (
                    <View className="absolute inset-0 bg-blue-500/20" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <MaterialCommunityIcons name="image-off-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 text-lg mt-4">No images in this category</Text>
          </View>
        )}
      </ScrollView>

      {/* 批量操作工具栏 */}
      {selectionMode && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={toggleSelectionMode}
              className="flex-1 bg-gray-100 py-3 rounded-xl"
              activeOpacity={0.7}
            >
              <Text className="text-center text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBatchDelete}
              disabled={selectedImages.size === 0}
              className={`flex-1 py-3 rounded-xl ${selectedImages.size === 0 ? 'bg-gray-200' : 'bg-red-500'
                }`}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-semibold ${selectedImages.size === 0 ? 'text-gray-400' : 'text-white'
                }`}>
                Delete {selectedImages.size > 0 ? `(${selectedImages.size})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 全屏查看 Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-200">
          {/* Header */}
          <View className="flex-row justify-between items-center absolute top-16 left-0 right-0 z-10 px-4 py-2 ">
            {/* Top row: Close and Counter */}
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                Keyboard.dismiss();
                setInputText('');
              }}
              className="p-2"
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close" size={28} color="black" />
            </TouchableOpacity>

            {/* Action buttons row */}
            <View className="flex-row justify-center items-center gap-4">
              <TouchableOpacity
                onPress={handleShareImage}
                className="bg-white/20 p-3 rounded-full"
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="share-variant" size={24} color="#black" />
              </TouchableOpacity>


              <TouchableOpacity
                onPress={handleDeleteImage}
                className="bg-red-500/80 p-3 rounded-full"
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="delete" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="absolute z-20  top-20 left-1/2 transform -translate-x-1/2 text-center text-black text-lg font-semibold">
            {currentIndex + 1} / {images.length}
          </Text>

          {/* Main Image - 水平滚动 FlatList */}
          <FlatList
            className="flex-1"
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(item: string, index: number) => `fullscreen-${index}`}
            getItemLayout={(data: ArrayLike<string> | null | undefined, index: number) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              console.warn('滚动失败:', info);
              // 等待后重试
              setTimeout(() => {
                try {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                  });
                } catch (error) {
                  console.error('重试滚动失败:', error);
                }
              }, 100);
            }}
            renderItem={({ item, index }: { item: string; index: number }) => (
              <View
                style={{
                  width: SCREEN_WIDTH,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={item}
                  style={styles.fullscreenImage}
                  contentFit="cover"
                  placeholder="Loading..."
                  cachePolicy="memory-disk"
                  recyclingKey={`fullscreen-${index}`}
                />
              </View>
            )}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="center"
          />

          {/* Thumbnail Strip
          <View className="absolute bottom-0 left-0 right-0 bg-black/50 pb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12 }}
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setCurrentIndex(index);
                    try {
                      flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                      });
                    } catch (error) {
                      console.warn('滚动到索引失败:', error);
                    }
                  }}
                  className={`mr-3 rounded-lg overflow-hidden ${index === currentIndex ? 'border-2 border-white' : 'opacity-60'
                    }`}
                  activeOpacity={0.8}
                >
                  <Image
                    source={image}
                    style={{ width: 60, height: 80 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View> */}


          {/* Input Field */}
          <Animated.View
            className="absolute left-4 right-4 z-20"
            style={{
              bottom: inputBottomPosition
            }}
          >
            <View className="flex-row items-end bg-white/90 rounded-lg border border-gray-300">
              <TextInput
                className="flex-1 px-4 py-3 text-black text-base"
                placeholder="Chat with AI..."
                placeholderTextColor="#666"
                multiline
                maxLength={200}
                value={inputText}
                onChangeText={setInputText}
                onFocus={() => {
                  console.log('TextInput focused');
                  setIsKeyboardVisible(true);
                  // 手动触发动画，以防键盘事件没有触发
                  Animated.timing(inputBottomPosition, {
                    toValue: 340, // 假设键盘高度约为 300px
                    duration: 300,
                    useNativeDriver: false,
                  }).start();
                }}
                onBlur={() => {
                  console.log('TextInput blurred');
                  setIsKeyboardVisible(false);
                  Animated.timing(inputBottomPosition, {
                    toValue: 48,
                    duration: 300,
                    useNativeDriver: false,
                  }).start();
                }}
                style={{ maxHeight: 100 }}
              />
              <TouchableOpacity
                className="p-3"
                onPress={async () => {
                  if (inputText.trim()) {
                    // 保存输入文本，然后清空
                    const messageToSend = inputText.trim();
                    console.log('Sending:', messageToSend);


                    const session = await ChatSessionService.createSession("free_chat");
                    if (session) {
                      console.log('Navigating to free_chat with params:', {
                        sessionId: session.id,
                        imageUri: images[currentIndex],
                        message: messageToSend
                      });
                      router.push({
                        pathname: "/free_chat",
                        params: {
                          sessionId: session.id,
                          imageUri: images[currentIndex],
                          message: messageToSend
                        }
                      });
                    }
                    setInputText('');
                    Keyboard.dismiss();
                    setModalVisible(false)
                  }
                }}
                disabled={!inputText.trim()}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={24}
                  color={inputText.trim() ? "#007AFF" : "#ccc"}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>


        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullscreenImage: {
    height: SCREEN_HEIGHT * 0.75,
    aspectRatio: 712 / 1247,  // 使用实际图片的宽高比
    maxHeight: SCREEN_HEIGHT * 0.75,  // 最大高度限制
    borderRadius: 16,
    overflow: 'hidden',

  }
});
