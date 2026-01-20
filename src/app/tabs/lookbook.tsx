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
import { analytics } from "@/services/AnalyticsService";
import { useImage, type ImageItem } from "@/contexts/ImageContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 呼吸动画遮罩组件
 * 
 * 用于显示图片正在生成中的状态
 * 动画效果：缩放 + 透明度变化，模拟"呼吸"效果
 */
function BreathingAnimationOverlay() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    /**
     * 创建呼吸动画
     * 
     * 使用 Animated.loop 创建无限循环动画
     * 同时进行缩放和透明度变化，模拟呼吸效果
     */
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,  // 轻微放大（8%）
          duration: 2000, // 2秒放大
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.0,   // 恢复原大小
          duration: 2000, // 2秒缩小
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 } // 无限循环
    );

    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,   // 更淡
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.5,   // 更明显
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );

    // 同时启动两个动画
    Animated.parallel([scaleAnimation, opacityAnimation]).start();

    // 清理函数：组件卸载时停止动画
    return () => {
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      scaleAnim.setValue(1);
      opacityAnim.setValue(0.3);
    };
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      className="absolute inset-0 rounded-3xl"
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
        backgroundColor: 'gray', // 使用主题色
      }}
    >
      {/* 中心加载指示器和文字 */}
      <View className="absolute inset-0 justify-center items-center">
        <View className="bg-white rounded-full p-3 items-center justify-center shadow-lg">
          <MaterialCommunityIcons name="image-edit-outline" size={24} color="black" />
        </View>
        <Text className="text-white text-xs font-semibold mt-2 drop-shadow-lg">
          Generating...
        </Text>
      </View>
      
      {/* 可选的脉冲效果背景 */}
      <Animated.View
        className="absolute inset-0 rounded-3xl"
        style={{
          backgroundColor: 'rgba(91, 91, 88, 0.1)',
          transform: [{ scale: scaleAnim }],
        }}
      />
    </Animated.View>
  );
}

export default function LookbookOne() {
  // 从 ImageContext 获取全局图片状态（自动更新）
  const { 
    images: globalImages, 
    allItems: globalAllItems, 
    availableStyles: globalAvailableStyles,
    loading: imagesLoading,
    refreshImages 
  } = useImage();
  
  // 本地状态（用于过滤等操作）
  const [images, setImages] = useState<ImageItem[]>([]);
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
  const fullscreenScrollRef = useRef<ScrollView>(null);  // 全屏模式的 ScrollView ref
  // 使用全局 Toast
  const { showToast } = useGlobalToast();

  // 键盘事件监听
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setIsKeyboardVisible(true);
      Animated.timing(inputBottomPosition, {
        toValue: event.endCoordinates.height + 20,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
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

  // 滚动到指定位置的函数
  const scrollToIndex = useCallback((index: number) => {
    const targetX = index * SCREEN_WIDTH;

    if (fullscreenScrollRef.current) {
      fullscreenScrollRef.current.scrollTo({
        x: targetX,
        y: 0,
        animated: false,
      });
    }
  }, []);

  // 同步全局状态到本地状态
  useEffect(() => {
    setAllItems(globalAllItems);
    setAvailableStyles(globalAvailableStyles);

    // 根据当前选择的风格过滤图片
    if (selectedStyle === 'All') {
      setImages(globalImages);
    } else {
      const filteredImages: ImageItem[] = globalAllItems
        .filter(item => item.style === selectedStyle && item.image_url && item.image_url.length > 0)
        .map(item => ({
          id: item.id,
          image_url: item.image_url,
          style: item.style || 'Unknown',
          metadata: item.metadata || {},
        }));
      setImages(filteredImages);
    }
  }, [globalImages, globalAllItems, globalAvailableStyles, selectedStyle]);

  // 加载图片（现在只需要刷新全局状态）
  const loadCollections = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      await refreshImages();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh your lookbook');
    }
  }, [user?.id, refreshImages]);

  // 根据选择的风格过滤图片
  const filterImagesByStyle = useCallback((style: string) => {
    setSelectedStyle(style);

    if (style === 'All') {
      const allImages: ImageItem[] = allItems
        .filter(item => item.image_url && item.image_url.length > 0)
        .map(item => ({
          id: item.id,
          image_url: item.image_url,
          style: item.style || 'Unknown',
          metadata: item.metadata || {},
        }));
      setImages(allImages);
    } else {
      const filteredImages: ImageItem[] = allItems
        .filter(item => item.style === style && item.image_url && item.image_url.length > 0)
        .map(item => ({
          id: item.id,
          image_url: item.image_url,
          style: item.style || 'Unknown',
          metadata: item.metadata || {},
        }));
      setImages(filteredImages);
    }
  }, [allItems]);

  const handleImagePress = (index: number) => {
    if (images.length === 0) return;

    // 如果在选择模式，切换选择状态
    if (selectionMode) {
      toggleImageSelection(images[index].image_url);
      return;
    }

    setCurrentIndex(index);
    setModalVisible(true);
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
    setSelectedImages(new Set(images.map(item => item.image_url)));
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

              // 退出选择模式
              setSelectionMode(false);
              setSelectedImages(new Set());

              // 刷新全局图片状态（ImageContext 会自动更新所有使用该状态的组件）
              await refreshImages();

              // 通知其他页面更新（ImageContext 已经监听，但这里也通知一下以确保同步）
              imageUpdateManager.notifyImageUpdate('lookbook');

              showToast({
                message: `Successfully deleted ${imageIds.length} image(s)`,
                type: 'success',
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete images. Please try again.');
            }
          },
        },
      ]
    );
  };

  // 监听 ScrollView 滚动，更新当前索引
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index >= 0 && index < images.length && index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

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
              const currentImage = images[currentIndex];
              if (!currentImage) {
                Alert.alert('Error', 'Image not found');
                return;
              }

              // 从 allItems 中找到对应的 item
              const itemToDelete = allItems.find(item => item.id === currentImage.id);

              if (itemToDelete) {
                // 保存删除前的索引
                const deletedIndex = currentIndex;
                const totalImages = images.length;

                // 调用删除服务（软删除）
                await UserImageService.softDeleteImage(itemToDelete.id);

                // 刷新全局图片状态
                await refreshImages();

                // 通知其他页面更新（ImageContext 已经监听，但这里也通知一下以确保同步）
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
                    fullscreenScrollRef.current?.scrollTo({
                      x: Math.max(0, newIndex) * SCREEN_WIDTH,
                      y: 0,
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
      const currentImage = images[currentIndex];
      if (!currentImage) {
        Alert.alert('Error', 'Image not found');
        return;
      }

      // 使用 React Native 的 Share API
      const result = await Share.share({
        message: 'Check out my look from Magic Lookbook!',
        url: currentImage.image_url,
        title: 'My Lookbook',
      });

      // Share completed
    } catch (error) {
      Alert.alert('Error', 'Failed to share image. Please try again.');
    }
  };

  // 使用 useFocusEffect 确保每次页面获得焦点时都重新加载
  useFocusEffect(
    useCallback(() => {
      // 追踪页面浏览
      analytics.page('lookbook', {
        category: 'main',
        tab: 'lookbook',
      });

      // 标记用户进入 lookbook 页面
      pageActivityManager.setActivePage('lookbook');

      // 滚动到顶部
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      // 刷新全局图片状态（ImageContext 会自动处理更新通知）
      // 注意：ImageContext 已经监听了 imageUpdateManager，所以这里只需要刷新一次
      refreshImages();
      
      // 用户进入 lookbook 页面时清除徽章
      clearBadge('lookbook');

      // 返回清理函数，用户离开页面时清除活动状态
      return () => {
        pageActivityManager.clearActivePage();
      };
    }, [refreshImages])
  );

  return (
    <SafeAreaView  edges={["top"]} className="flex-1 bg-white">
      {/* 顶部标题栏 */}
      <View className="flex-row justify-between items-center bg-white" style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
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
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-2"
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color="#000" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-black">My Looks</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={toggleSelectionMode}
                className="bg-gray-100 p-2 rounded-full"
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="checkbox-multiple-marked" size={20} color="#000" />
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
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16, // 左右边距 16pt
          paddingTop: 16, // 内容之间的行间距 16pt
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
              const isSelected = selectedImages.has(image.image_url);
              const isEven = index % 2 === 0;
              
              return (
                <TouchableOpacity
                  key={`${image.id}-${image.image_url}`}
                  className="bg-gray-200 overflow-hidden relative"
                  style={{ 
                    width: '48%',
                    aspectRatio: 3 / 4, // 缩略图比例 3:4
                    borderRadius: 10, // 圆角 10
                    marginBottom: 16, // 内容之间的行间距 16pt
                    marginRight: isEven ? 12 : 0, // 列间距 12pt
                  }}
                  activeOpacity={0.8}
                  onPress={() => handleImagePress(index)}
                >
                  <Image
                    key={`${image.id}-${image.image_url}`}
                    source={{ uri: image.image_url }}
                    style={{ width: '100%', height: '120%' }}
                    contentFit="cover"
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                    cachePolicy="memory-disk"
                    priority="high"
                    recyclingKey={`${image.id}-${image.image_url}`}
                  />

                  {/* 生成中的呼吸动画遮罩 */}
                  {!(image.metadata?.state == 'success'|| image.metadata?.generated_at !== undefined) && (
                    <BreathingAnimationOverlay />
                  )}

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
              {/* <TouchableOpacity
                onPress={handleShareImage}
                className="bg-white/20 p-3 rounded-full"
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="share-variant" size={24} color="#black" />
              </TouchableOpacity> */}


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

          {/* Main Image - 水平滚动 ScrollView */}
          <ScrollView
            key={`scrollview-${currentIndex}`}
            ref={fullscreenScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: currentIndex * SCREEN_WIDTH, y: 0 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="center"
            contentContainerStyle={{ flexDirection: 'row' }}
            collapsable={false}
          >
            {images.map((item, index) => (
              <View
                key={`fullscreen-${item.id}-${item.image_url}`}
                style={{
                  width: SCREEN_WIDTH,
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  // backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#e8e8e8', // 交替背景色，便于调试
                }}
                // className="py-2"
              >
                <Image
                  key={`fullscreen-image-${item.id}-${item.image_url}`}
                  source={{ uri: item.image_url }}
                  style={styles.fullscreenImage}
                  contentFit="cover"
                  placeholder="Loading..."
                  cachePolicy="memory-disk"
                  recyclingKey={`${item.id}-${item.image_url}`}
                />
              </View>
            ))}
          </ScrollView>



          {/* Input Field */}
          <Animated.View
            className="absolute left-4 right-4 z-20"
            style={{
              bottom: inputBottomPosition
            }}
          >
            <View className="flex-row items-end bg-white/90 rounded-lg border border-gray-300 top-2 ">
              <TextInput
                className="flex-1 px-4 py-3 text-black text-base"
                placeholder="Chat with AI..."
                placeholderTextColor="#666"
                multiline
                maxLength={200}
                value={inputText}
                onChangeText={setInputText}
                onFocus={() => {
                  setIsKeyboardVisible(true);
                  Animated.timing(inputBottomPosition, {
                    toValue: 340,
                    duration: 300,
                    useNativeDriver: false,
                  }).start();
                }}
                onBlur={() => {
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
                    const messageToSend = inputText.trim();

                    const session = await ChatSessionService.createSession(user?.id || '', "free_chat");
                    if (session) {
                      router.push({
                        pathname: "/free_chat",
                        params: {
                          sessionId: session.id,
                          imageUri: images[currentIndex].image_url,
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
