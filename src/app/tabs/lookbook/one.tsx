import { View, Text, ScrollView, Pressable, StyleSheet, TouchableOpacity, Modal, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useEffect, useState, useCallback } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import DottomPicker from "./DottomPicker";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { aiRequestGemini, aiRequestLookbook } from "@/services/aiReuest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";
import { LookbookService } from "@/services/LookbookService";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clearBadge } from "@/utils/badgeManager";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LookbookOne() {
  const [images, setImages] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();

  const loadCollections = useCallback(async () => {
    try {

      // 直接获取所有 items，而不是从 collections 中提取
      const allItems = await LookbookService.getAllItems();

      // 提取所有图片 URL
      const allImages: string[] = [];
      for (const item of allItems) {
        if (item.images && item.images.length > 0) {
          // 添加该 item 的所有图片
          allImages.push(...item.images);
        }
      }

      setImages(allImages);

    } catch (error) {
      console.error('❌ Failed to load lookbook items:', error);
      Alert.alert('Error', 'Failed to load your lookbook');
    }
  }, []);

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
      loadCollections();
      // 用户进入 lookbook 页面时清除徽章
      clearBadge('lookbook');
    }, [loadCollections])
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}

        contentContainerStyle={{ 
          paddingBottom: 220  // 足够大的固定间距，确保内容不被遮挡
        }}
      >
        <View className="flex-row flex-wrap justify-between">
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              className="bg-gray-200 w-[48%] rounded-2xl overflow-hidden relative mb-4"
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
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
});
