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
import { supabase } from "@/utils/supabase";

export default function BaseFive() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<number>(0.8);
  const { user } = useAuth();
  // 防抖相关状态
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const [isRemoveLoading, setIsRemoveLoading] = useState<boolean>(false);

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
      console.log("🧐 加载 BaseFive - isUpdate:", isUpdate, "user?.id:", user?.id)
      
      if (!user?.id) {
        console.log("⚠️ User ID not available yet");
        return;
      }

      const onboardingData = await AsyncStorage.getItem("onboardingData");

      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        // 读取本地缓存
        if (onboardingDataObj.fullBodyPhoto.length > 0) {
          console.log("✅ 从本地缓存加载图片");
          setSelectedImage(onboardingDataObj.fullBodyPhoto);
          setIsRemoveLoading(true);
        } else {
          // 读取远程
          console.log("📡 从远程加载图片");
          const profilePromise = supabase
            .from('profiles')
            .select('name, fullbodyphoto')
            .eq('id', user?.id)
            .single();

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile query timeout')), 5000 * 10)
          );
          const { data: userProfile, error } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any;

          if (userProfile?.fullbodyphoto && userProfile?.fullbodyphoto.length > 0) {
            console.log("✅ 从远程加载图片成功");
            setSelectedImage(userProfile.fullbodyphoto);
            setIsRemoveLoading(true);
            onboardingDataObj.fullBodyPhoto = userProfile.fullbodyphoto
            AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingDataObj));
          } else {
            console.log("⚠️ 远程没有找到图片");
          }
        }
      } else {
        console.log("⚠️ 没有找到 onboardingData");
      }
    };

      loadOnboardingData();
  }, [isUpdate, user?.id]);

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

      return;
    }

    // 检查全局上传状态
    const globalStatus = getUploadStatus();
    if (globalStatus.isUploading) {

      return;
    }

    // 检查特定图片是否正在上传
    if (selectedImage && isImageUploading(selectedImage)) {

      return;
    }


    if (selectedImage && !isUploading) {
      isProcessingRef.current = true;
      setIsUploading(true);
      const onboardingData = await AsyncStorage.getItem("onboardingData") || "{}";
      const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;

      try {
        
        if (isUpdate === "true" && onboardingDataObj.fullBodyPhoto == selectedImage) {
          router.replace("/");
          return;
        }
        // 如果已经上传过图片，直接跳转到五步
        if (isRemoveLoading) {
          setIsRemoveLoading(false);
          router.push("/onboarding/five");
          return;
        }

        // Upload image to server
        const imageUrl = await uploadImageWithFileSystem(user?.id || '', selectedImage);

        if (imageUrl) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ fullbodyphoto: imageUrl })  // 正确的对象语法
            .eq('id', user?.id);
          if(updateError){
            console.log("error ",updateError)
          }
          setSelectedImage(imageUrl);

          onboardingDataObj.fullBodyPhoto = imageUrl;
          await AsyncStorage.setItem(
            "onboardingData",
            JSON.stringify(onboardingDataObj),
          );

          if (isUpdate) {
            router.replace("/");
          } else {
            router.push("/onboarding/five");
          }

        } else {

          setIsUploading(false);
        }
      } catch (error) {
        console.error("Processing failed:", error);
      } finally {
        setIsUploading(false);
        isProcessingRef.current = false;
      }
    } else {

    }
  };

  const handleImageUpload = () => {
    // 防重复点击
    if (isProcessingRef.current) {

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
            {selectedImage ? (
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
            ) :
              <Image
                source={require("../../../assets/upload.png")}
                style={{
                  width: Dimensions.get('window').height * 0.5 * imageDimensions,
                  height: Dimensions.get('window').height * 0.5,
                  borderRadius: 16,
                }}
                resizeMode="contain"

              />
            }

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
