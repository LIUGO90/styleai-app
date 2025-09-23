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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { uploadImageWithFileSystem, getUploadStatus, isImageUploading } from "@/services/FileUploadService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";

export default function BaseFive() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 防抖相关状态
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const { isUpdate } = useLocalSearchParams();

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);


  useEffect(() => {
    // 记录接收到的路由参数
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        setSelectedImage(onboardingDataObj.fullBodyPhoto);
      }
    };
    if (isUpdate) {
      loadOnboardingData();
    }
  }, []);


  // 防抖函数
  const debounce = (func: Function, delay: number) => {
    return (...args: any[]) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => func(...args), delay);
    };
  };

  const handleSkip = async () => {
    router.push("/onboarding/YourRange");
  };

  const handleNext = async () => {
    // 防重复点击
    if (isProcessingRef.current || isUploading) {
      console.log("正在处理中，忽略重复点击");
      return;
    }

    // 检查全局上传状态
    const globalStatus = getUploadStatus();
    if (globalStatus.isUploading) {
      console.log("全局上传状态：已有上传任务进行中");
      return;
    }

    // 检查特定图片是否正在上传
    if (selectedImage && isImageUploading(selectedImage)) {
      console.log("该图片正在上传中，忽略重复请求");
      return;
    }

    console.log("handleNext - 开始处理", {
      selectedImage: selectedImage?.substring(0, 50) + '...',
      isUploading,
      globalStatus
    });

    if (selectedImage && !isUploading) {
      isProcessingRef.current = true;
      setIsUploading(true);
      const onboardingData = await AsyncStorage.getItem("onboardingData") || "{}";
      const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
      try {
        if (isUpdate === "true" && onboardingDataObj.fullBodyPhoto == selectedImage) {
          console.log("图片已存在，忽略上传");
          router.replace("/");
          return;
        }

        console.log("开始上传图片到服务器...");
        // 上传图片到服务器
        const imageUrl = await uploadImageWithFileSystem(selectedImage);

        if (imageUrl) {
          console.log("图片上传成功，保存到本地存储");
          setSelectedImage(imageUrl);


          onboardingDataObj.fullBodyPhoto = imageUrl;
          await AsyncStorage.setItem(
            "onboardingData",
            JSON.stringify(onboardingDataObj),
          );


          console.log("数据保存完成，准备跳转");
          if (isUpdate) {
            router.replace("/");
          } else {
            router.push("/onboarding/BaseSix");
          }
        } else {
          console.log("图片上传失败或返回空URL");
          setIsUploading(false);
        }
      } catch (error) {
        console.error("处理失败:", error);
        setIsUploading(false);
      } finally {
        isProcessingRef.current = false;
      }
    } else {
      console.log("没有选择图片或正在上传中");
    }
  };

  const handleImageUpload = () => {
    // 防重复点击
    if (isProcessingRef.current) {
      console.log("正在处理中，忽略重复点击");
      return;
    }

    // 移动端：显示选择对话框
    Alert.alert("选择图片来源", "请选择图片来源", [
      {
        text: "拍照",
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
    } finally {
      isProcessingRef.current = false;
    }
  };

  // 从相册选择功能
  const handleChooseFromLibrary = async () => {
    // 防重复点击
    if (isProcessingRef.current) {
      console.log("正在处理中，忽略重复点击");
      return;
    }

    isProcessingRef.current = true;
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
    } finally {
      isProcessingRef.current = false;
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
          <View
            className="flex-row justify-between my-5 px-5"
            style={{ 
              height: Dimensions.get('window').height * 0.5,
              minHeight: 280  // 设置最小高度为300px
            }}
          >
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 12,
                  backgroundColor: "#f0f0f0",
                }}
              />
            )}
          </View>
        </View>
        {/* 底部按钮 */}
        <View className="p-5 mb-8">
          <View className="flex-col ">

              (<Pressable
                onPress={handleImageUpload}
                className={` my-2 py-5 px-6 rounded-full bg-black `}
                disabled={false}
              >
                <Text className={`text-center font-medium text-white`}>
                  Take/Upload a Selfie
                </Text>
              </Pressable>)


            {selectedImage && (
              <Pressable
                onPress={handleNext}
                className={`my-2 py-5 px-6 rounded-full bg-black`}
                disabled={false}
              >
                <Text className={`text-center font-medium text-white`}>
                  Continue
                </Text>
              </Pressable>
            )}
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
