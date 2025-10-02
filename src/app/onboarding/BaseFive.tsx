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
import { useAuth } from "@/contexts/AuthContext";

export default function BaseFive() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<number>(0.8);
  const { user } = useAuth();
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
      console.log("loadOnboardingData", onboardingData);
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
      console.log("Global upload status: upload task already in progress");
      return;
    }

    // 检查特定图片是否正在上传
    if (selectedImage && isImageUploading(selectedImage)) {
      console.log("This image is being uploaded, ignoring duplicate request");
      return;
    }

    console.log("handleNext - Starting processing", {
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

        console.log("Starting to upload image to server...");
        // Upload image to server
        const imageUrl = await uploadImageWithFileSystem(user?.id || '', selectedImage);

        if (imageUrl) {
          console.log("Image upload successful, saving to local storage", imageUrl);
          setSelectedImage(imageUrl);


          onboardingDataObj.fullBodyPhoto = imageUrl;
          await AsyncStorage.setItem(
            "onboardingData",
            JSON.stringify(onboardingDataObj),
          );
          console.log("Data saved successfully, preparing to navigate");

          if (isUpdate) {
            router.replace("/");
          } else {
            router.push("/onboarding/five");
          }

        } else {
          console.log("Image upload failed or returned empty URL");
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Processing failed:", error);
        setIsUploading(false);
      } finally {
        isProcessingRef.current = false;
      }
    } else {
      console.log("No image selected or upload in progress");
    }
  };

  const handleImageUpload = () => {
    // 防重复点击
    if (isProcessingRef.current) {
      console.log("Processing in progress, ignoring duplicate clicks");
      return;
    }

    // Mobile: show selection dialog
    Alert.alert("Select Image Source", "Please select image source", [
      {
        text: "Take Photo",
        onPress: () => handleTakePhoto(),
      },
      {
        text: "Photo Library",
        onPress: () => handleChooseFromLibrary(),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  // Take photo function
  const handleTakePhoto = async () => {
    try {
      // 先检查权限状态
      const { status } = await ImagePicker.getCameraPermissionsAsync();

      if (status !== "granted") {
        // 请求权限
        const permissionResult =
          await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert("Permission Error", "Camera permission required to take photos");
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
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Photo capture failed:", error);
      Alert.alert("Photo Capture Failed", "An error occurred while taking photo, please try again");
    } finally {
      isProcessingRef.current = false;
    }
  };

  // 从相册选择功能
  const handleChooseFromLibrary = async () => {
    // 防重复点击
    if (isProcessingRef.current) {
      console.log("Processing in progress, ignoring duplicate clicks");
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
          Alert.alert("Permission Error", "Photo library permission required to select photos");
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
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Photo selection failed:", error);
      Alert.alert("Selection Failed", "An error occurred while selecting photo, please try again");
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
        <View className={`mt-14 ${isUpdate ? "p-8" : ""}`}>
          {!isUpdate && (
            <DotsContainer activeIndex={5} indexNumber={6} />
          )}
        </View>
        <View className="flex-1 px-5 ">
          <Text className="text-2xl font-bold text-start mb-2 text-black">
            Take a Selfie
          </Text>
          <Text className="text-sm font-bold text-start mb-2 text-gray-500">
            Snap a selfie and Styla will suggest customized looks for you.
          </Text>
          <View
            className="flex-row justify-center items-center px-5"  >
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={{
                  width: Dimensions.get('window').height * 0.5 * imageDimensions,
                  height: Dimensions.get('window').height * 0.5,
                  borderRadius: 16,
                }}
                resizeMode="contain"
                cachePolicy="memory-disk"
              />
            )}
          </View>
        </View>
        {/* 底部按钮 */}
        <View className="p-5 my-8">
          <View className="flex-col">

            {!isUploading && (<Pressable
              onPress={handleImageUpload}
              className={` my-2 py-5 px-6 rounded-full bg-black `}
              disabled={false}
            >
              <Text className={`text-center font-medium text-white`}>
                Take/Upload a Selfie
              </Text>
            </Pressable>)}


            {selectedImage && !isUploading && (
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

            {isUploading && (
              <View className="my-2 py-5 px-6 rounded-full bg-gray-400 flex-row items-center justify-center">
                <MaterialCommunityIcons
                  name="loading"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-center font-medium text-white">
                  Uploading...
                </Text>
              </View>
            )}
            {/* <Pressable
              onPress={handleSkip}
              className={`my-2 px-6 rounded-full`}
              disabled={false}
            >
              <Text className={`text-center font-medium text-gray-600`}>
                Skip for now
              </Text>
            </Pressable> */}
          </View>
        </View>
      </View>
    </View>
  );
}
