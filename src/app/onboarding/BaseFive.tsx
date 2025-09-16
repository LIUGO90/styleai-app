import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import DotsContainer from "@/components/dotsContainer";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { uploadImageWithFileSystem } from "@/services/FileUploadService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";

export default function BaseFive() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleSkip = async () => {
    router.push("/onboarding/YourRange");
  };

  const handleNext = async () => {
    console.log("handleNext", selectedImage, isUploading);
    if (selectedImage && !isUploading) {
      // 上传图片到服务器
      const imageUrl = await uploadImageWithFileSystem(selectedImage);
      if (imageUrl) {
        setSelectedImage(imageUrl);
      }

      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        onboardingDataObj.fullBodyPhoto = imageUrl;
        await AsyncStorage.setItem(
          "onboardingData",
          JSON.stringify(onboardingDataObj),
        );
        setIsUploading(true);
      }
      router.replace("/");
    }
  };

  const handleImageUpload = () => {
    // 移动端：显示选择对话框
    Alert.alert("选择图片来源", "请选择图片来源", [
      {
        text: "相机",
        onPress: () => handleTakePhoto(),
      },
      {
        text: "相册",
        onPress: () => handleChooseFromLibrary(),
      },
      {
        text: "取消",
        style: "cancel",
      },
    ]);
  };

  // 拍照功能
  const handleTakePhoto = async () => {
    try {
      // 先检查权限状态
      const { status } = await ImagePicker.getCameraPermissionsAsync();

      if (status !== "granted") {
        // 请求权限
        const permissionResult =
          await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert("权限错误", "需要相机权限才能拍照");
          return;
        }
      }

      // 配置相机选项
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setIsUploading(false);
      }
    } catch (error) {
      console.error("拍照失败:", error);
      Alert.alert("拍照失败", "拍照时出现错误，请重试");
    }
  };

  // 从相册选择功能
  const handleChooseFromLibrary = async () => {
    try {
      // 先检查权限状态
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        // 请求权限
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert("权限错误", "需要相册权限才能选择照片");
          return;
        }
      }

      // 配置相册选项
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setIsUploading(false);
      }
    } catch (error) {
      console.error("选择照片失败:", error);
      Alert.alert("选择失败", "选择照片时出现错误，请重试");
    }
  };

  return (
    <View className="flex-1">
      {/* 背景图片 */}
      <Image
        source={require("../../../assets/background.png")}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* 内容层 */}
      <View className="flex-1 ">
        {/* 顶部部分 */}
        <View className="mt-14">
          <DotsContainer activeIndex={5} indexNumber={6} />
        </View>
        <View className="flex-1 px-5 ">
          <Text className="text-2xl font-bold text-start mb-2 text-black">
            Take a Selfie
          </Text>
          <Text className="text-sm font-bold text-start mb-2 text-gray-500">
            Snap a selfie and Styla will suggest customized looks for you.
          </Text>
        </View>

        {/* 底部按钮 */}
        <View className="p-5 mb-8">
          <View className="flex-col ">
            <Pressable
              onPress={handleImageUpload}
              className={` my-2 py-5 px-6 rounded-full bg-black `}
              disabled={false}
            >
              <Text className={`text-center font-medium text-white`}>
                Take/Upload a Selfie
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSkip}
              className={`my-2 py-5 px-6 rounded-full`}
              disabled={false}
            >
              <Text className={`text-center font-medium text-gray-600`}>
                Skip for now
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
