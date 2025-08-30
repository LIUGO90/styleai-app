import React, { useState, useRef, useEffect } from 'react';
import DotsContainer from '@/components/dotsContainer';
import { View, Text, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingData } from '@/components/types';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageWithFileSystem } from '@/services/FileUploadService';
import { ImagePerformanceMonitor } from '@/components/ImagePerformanceMonitor';
import { Image } from 'expo-image';

export default function Three() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem('onboardingData');
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        if (onboardingDataObj.skinTone.length !== 0) {
          setSelectedImage(onboardingDataObj.fullBodyPhoto);
          setIsUploading(true);
        }
      }
    };
    loadOnboardingData();
  }, []);


  const handleNext = async () => {
    console.log('handleNext', selectedImage, isUploading);
    if (selectedImage && !isUploading) {
      // 上传图片到服务器
      const imageUrl = await uploadImageWithFileSystem(selectedImage);
      if (imageUrl) {
        setSelectedImage(imageUrl);
      }

      const onboardingData = await AsyncStorage.getItem('onboardingData');
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        onboardingDataObj.fullBodyPhoto = imageUrl;
        await AsyncStorage.setItem('onboardingData', JSON.stringify(onboardingDataObj));
        setIsUploading(true);
      }
      router.push('/onboarding/four');
    } else if(selectedImage && isUploading){
      router.push('/onboarding/four');
    } else {
      Alert.alert('提示', '请先上传照片');
    }
  };

  
  const handleImageUpload = () => {
    if (Platform.OS === 'web') {
      // Web 端：触发文件选择
      fileInputRef.current?.click();
    } else {
      // 移动端：显示选择对话框
      Alert.alert(
        '选择图片来源',
        '请选择图片来源',
        [
          {
            text: '相机',
            onPress: () => handleTakePhoto()
          },
          {
            text: '相册',
            onPress: () => handleChooseFromLibrary()
          },
          {
            text: '取消',
            style: 'cancel'
          }
        ]
      );
    }
  };

  // 拍照功能
  const handleTakePhoto = async () => {
    try {
      // 先检查权限状态
      const { status } = await ImagePicker.getCameraPermissionsAsync();

      if (status !== 'granted') {
        // 请求权限
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert('权限错误', '需要相机权限才能拍照');
          return;
        }
      }

      // 配置相机选项
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setIsUploading(false);
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('拍照失败', '拍照时出现错误，请重试');
    }
  };

  // 从相册选择功能
  const handleChooseFromLibrary = async () => {
    try {
      // 先检查权限状态
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        // 请求权限
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert('权限错误', '需要相册权限才能选择照片');
          return;
        }
      }

      // 配置相册选项
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setIsUploading(false);
      }
    } catch (error) {
      console.error('选择照片失败:', error);
      Alert.alert('选择失败', '选择照片时出现错误，请重试');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleSkip = () => {
    router.push('/onboarding/four');
  };

  return (
    <View className="flex-1 bg-white">
      <ImagePerformanceMonitor visible={__DEV__} />
      {/* Web 端隐藏的文件输入 */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      )}

      <View className="mt-11">
        <DotsContainer activeIndex={3} indexNumber={6} />
      </View>
      <ScrollView>
        <View className="flex-1 justify-center px-5">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-4">
            Upload a photo of you
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            to build personalized style profile
          </Text>

          {/* 图片上传区域 */}
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-800 text-center mb-4">
              Full Body Photo
            </Text>


            
            {selectedImage ? (
              // 显示已上传的图片
              <View className="relative overflow-hidden bg-gray-50 rounded-2xl">
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: 200,
                    height: 250,
                    borderRadius: 16,
                  }}
                  resizeMode="contain"
                />
                <Pressable
                  onPress={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 bg-red-500 rounded-full w-8 h-8 items-center justify-center"
                >
                  <MaterialCommunityIcons name="close" size={20} color="white" />
                </Pressable>
              </View>
            ) : (
              // 上传按钮
              <Pressable
                onPress={handleImageUpload}
                className="w-48 h-60 border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center bg-gray-50"
              >
                <MaterialCommunityIcons
                  name="camera-plus"
                  size={48}
                  color="#9ca3af"
                />
                <Text className="text-gray-500 mt-2 text-center">
                  Tap to upload photo
                </Text>
              </Pressable>
            )}


            
          </View>
        </View>

        {/* 底部按钮 */}
        <View className="p-5">
          <View className="flex-row space-x-4">
            <Pressable
              onPress={handleNext}
              className={`flex-1 py-3 px-6 rounded-full ${selectedImage ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              disabled={!selectedImage}
            >
              <Text className={`text-center font-medium ${selectedImage ? 'text-white' : 'text-gray-500'
                }`}>
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}