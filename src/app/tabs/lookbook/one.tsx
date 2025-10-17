import { View, Text, ScrollView, Pressable, StyleSheet, TouchableOpacity, Modal, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useEffect, useState, useCallback, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import DottomPicker from "./DottomPicker";
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LookbookOne() {
  const [images, setImages] = useState<string[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [availableStyles, setAvailableStyles] = useState<string[]>(['All']);
  const [showStyleFilter, setShowStyleFilter] = useState(false);
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

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
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
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
        <Text className="text-2xl font-bold text-black">MAGIC LOOKBOOK</Text>
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

      {/* 风格筛选水平滚动栏 */}
      {showStyleFilter && (
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
                className={`mr-3 px-4 py-2 rounded-full ${
                  selectedStyle === style
                    ? 'bg-black'
                    : 'bg-white border border-gray-300'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedStyle === style ? 'text-white' : 'text-gray-700'
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
            {images.map((image, index) => (
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
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <MaterialCommunityIcons name="image-off-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 text-lg mt-4">No images in this category</Text>
          </View>
        )}
      </ScrollView>

      {/* 全屏查看 Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          {/* Header */}
          <View className="absolute top-10 left-0 right-0 z-10 flex-row justify-between items-center px-4 py-3 bg-black/50">
            <TouchableOpacity 
              onPress={() => {

                setModalVisible(false);}} 
              className="p-2"
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              {currentIndex + 1} / {images.length}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Main Image */}
          <View className="flex-1 justify-center items-center">
            <Image
              source={images[currentIndex]}
              style={styles.fullscreenImage}
              contentFit="contain"
              placeholder="Loading..."
              cachePolicy="memory-disk"
            />
          </View>

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <TouchableOpacity 
              onPress={handlePrevious}
              className="absolute left-4 top-1/2 -mt-8 bg-black/50 p-4 rounded-full"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
            </TouchableOpacity>
          )}

          {currentIndex < images.length - 1 && (
            <TouchableOpacity 
              onPress={handleNext}
              className="absolute right-4 top-1/2 -mt-8 bg-black/50 p-4 rounded-full"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-right" size={32} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Thumbnail Strip */}
          <View className="absolute bottom-0 left-0 right-0 bg-black/50 pb-4">
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12 }}
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentIndex(index)}
                  className={`mr-3 rounded-lg overflow-hidden ${
                    index === currentIndex ? 'border-2 border-white' : 'opacity-60'
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
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
});
