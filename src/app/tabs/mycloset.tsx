import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TouchableOpacity, Dimensions, Alert, Platform } from "react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { uploadImageWithFileSystem, deleteRemoteImage } from "@/services/FileUploadService";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatSessionService } from "@/services/ChatSessionService";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/services/AnalyticsService";
import { useCallback } from "react";

export default function MyCloset() {
  const [selectedStyles, setSelectedStyles] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [myClosetImages, setMyClosetImages] = useState<string[]>([]);
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [imageErrorStates, setImageErrorStates] = useState<{ [key: number]: boolean }>({});
  const { user } = useAuth();

  // 默认服装数据（本地资源）
  const DEFAULT_CLOTHES = [
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_01_white_shirt.webp",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_02_stripped_tank_top.jpg",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_03_polo_shirt.jpg",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_04_stripped_button_up_shirt_2.jpg",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_05_stripped_knit_top.jpg",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_06_printed_shirt.jpg",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_07_green_blouse.jpg",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_08_stripped_button_up_shirt.png",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_09_white_blouse.jpg",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_10_yellow_sleeveless_top.jpg",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_11_floral_shirt.jpg",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_12_ivory_vest.webp",
    "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/app_13_black_camisole.jpg",
  ];

  // 页面浏览追踪
  useFocusEffect(
    useCallback(() => {
      analytics.page('mycloset', {
        category: 'main',
        tab: 'mycloset',
      });
    }, [])
  );

  useEffect(() => {
    const loadMyCloset = async () => {
      try {
        const mycloset = await AsyncStorage.getItem("mycloset");
        if (mycloset) {
          // 合并默认服装和用户上传的URL
          const uploadedUrls = JSON.parse(mycloset);
          const allImages = [...uploadedUrls];
          setMyClosetImages(allImages);
        } else {
          // 首次使用，只显示默认服装
          setMyClosetImages(DEFAULT_CLOTHES);
          await AsyncStorage.setItem("mycloset", JSON.stringify(DEFAULT_CLOTHES));
        }
      } catch (error) {
        console.error("加载衣柜数据失败:", error);
        setMyClosetImages(DEFAULT_CLOTHES);
      }
    };
    loadMyCloset();
  }, []);


  const handleStyleToggle = (imageIndex: string) => {
    const index = parseInt(imageIndex);
    const selectedImage = myClosetImages[index];

    if (selectedImage) {
      const itemData = {
        index,
        source: selectedImage,
        isUploaded: !isLocalResource(selectedImage)
      };

      setSelectedItem(itemData);
      setModalVisible(true);
    } else {
      console.error('选中的图片不存在，索引:', index, '数组长度:', myClosetImages.length);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleNext = async () => { };

  // 保存用户上传的URL到 AsyncStorage
  const saveUploadedUrls = async (urls: string[]) => {
    try {
      await AsyncStorage.setItem("mycloset", JSON.stringify(urls));
    } catch (error) {
      console.error("保存上传URL失败:", error);
    }
  };

  // 判断是否为本地资源
  const isLocalResource = (source: any) => {
    return typeof source === 'number' || (source && source.uri && source.uri.startsWith('asset://'));
  };

  // 测试图片URL是否可访问
  const testImageUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('URL test failed for:', url, error);
      return false;
    }
  };

  // 获取用户上传的URL列表
  const getUploadedUrls = () => {
    return myClosetImages.filter(image => !isLocalResource(image));
  };

  // 删除图片
  const deleteImage = async (imageIndex: number) => {
    const imageToDelete = myClosetImages[imageIndex];
    const isUploadedImage = !isLocalResource(imageToDelete);

    // 如果是用户上传的图片，先删除远程图片
    if (isUploadedImage) {

      const remoteDeleteSuccess = await deleteRemoteImage(user?.id || '', imageToDelete);
      if (!remoteDeleteSuccess) {
        Alert.alert("Warning", "远程图片删除失败，但本地记录将被移除");
      }
    }

    // 从本地数组中移除图片
    const newImages = myClosetImages.filter((_, index) => index !== imageIndex);
    setMyClosetImages(newImages);

    // 更新 AsyncStorage 中的用户上传URL
    const uploadedUrls = newImages.filter(image => !isLocalResource(image));
    await saveUploadedUrls(uploadedUrls);


  };

  // 从相册选择图片
  const pickImageFromGallery = async () => {
    try {
      // 检查权限
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert("Permission Required", "Camera roll permission is required to select images");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        base64: false,
      });


      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error("选择图片失败:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  // 拍照功能
  const takePhoto = async () => {
    try {
      // 检查相机权限
      const { status } = await ImagePicker.getCameraPermissionsAsync();

      if (status !== "granted") {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert("Permission Required", "Camera permission is required to take photos");
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        base64: false,

      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error("拍照失败:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // 显示选择图片的选项
  const showImagePicker = () => {
    Alert.alert("Select Image", "Choose image source", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "From Gallery",
        onPress: pickImageFromGallery,
      },
      {
        text: "Take Photo",
        onPress: takePhoto,
      },
    ]);
  };

  // 上传图片
  const uploadImage = async (imageUri: string) => {
    if (uploading) return;

    setUploading(true);

    try {

      const imageUrl = await uploadImageWithFileSystem(user?.id || '', imageUri);

      if (imageUrl) {

        const newImages = [imageUrl || '', ...myClosetImages];
        setMyClosetImages(newImages);

        // 保存用户上传的URL到 AsyncStorage
        const uploadedUrls = newImages.filter(image => !isLocalResource(image));
        await saveUploadedUrls(uploadedUrls);

        Alert.alert("Success", "Image uploaded successfully!");
      } else {
        Alert.alert("Error", "Upload failed, please try again");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Error", "Upload failed, please try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-5">
      {/* <View className="flex-1 p-5 ">
        <Text className="text-base font-bold text-start  text-black">
          My Closet
        </Text>
      </View> */}
      <Pressable
        onPress={showImagePicker}
        disabled={uploading}
        className={`rounded-full w-full h-12 items-center justify-center shadow-lg my-5 ${uploading ? "bg-gray-300" : "bg-gray-200"
          }`}
      >
        <Text className={`font-medium ${uploading ? "text-gray-500" : "text-gray-700"}`}>
          {uploading ? "Uploading..." : "+ Add to Closet"}
        </Text>
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="p-5"
      >
        {/* 服装选择网格 */}
        <View className="flex-row flex-wrap justify-between ">
          {myClosetImages.map((imageSource, index) => {
            const isSelected = selectedStyles === index.toString();
            const isUploaded = !isLocalResource(imageSource);
            return (
              <Pressable
                key={index}
                onPress={() => handleStyleToggle(index.toString())}
                className={`w-[48%] max-w-[200px] mb-4 rounded-xl border-2 overflow-hidden ${isSelected ? "border-red-500" : "border-gray-200"
                  }`}
              >
                {/* 图片容器 */}
                <View className="relative bg-gray-100 items-center justify-center ">
                  <Image
                    source={isLocalResource(imageSource) ? imageSource : { uri: imageSource }}
                    style={{
                      width: "100%",
                      height: 280,
                      flex: 1,
                    }}
                    contentFit="cover"
                    placeholder="Loading..."
                    cachePolicy="memory-disk"
                    onLoadStart={() => {
                      setImageLoadingStates(prev => ({ ...prev, [index]: true }));
                    }}
                    onLoadEnd={() => {
                      setImageLoadingStates(prev => ({ ...prev, [index]: false }));
                    }}
                    onError={(error) => {
                      console.error('Image load error for index', index, ':', error);
                      setImageLoadingStates(prev => ({ ...prev, [index]: false }));
                      setImageErrorStates(prev => ({ ...prev, [index]: true }));
                    }}
                  />

                  {/* 加载状态覆盖层 */}
                  {imageLoadingStates[index] && (
                    <View className="absolute inset-0 bg-gray-100 items-center justify-center">
                      <Text className="text-sm text-gray-500">Loading...</Text>
                    </View>
                  )}

                  {/* 错误状态覆盖层 */}
                  {imageErrorStates[index] && (
                    <View className="absolute inset-0 bg-gray-200 items-center justify-center">
                      <MaterialCommunityIcons
                        name="image-off"
                        size={32}
                        color="#9CA3AF"
                      />
                      <Text className="text-xs text-gray-500 mt-2 text-center">
                        Failed to load
                      </Text>
                    </View>
                  )}

                  {/* 选中状态覆盖层 */}
                  {isSelected && (
                    <View className="absolute top-2 right-2">
                      <View className="bg-red-500 rounded-full w-8 h-8 items-center justify-center shadow-lg">
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color="white"
                        />
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* 底部弹窗 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={closeModal}
        >
          <View
            className="bg-white border-t-2 border-gray-200 rounded-t-3xl max-h-[80%] min-h-[300]"
          >
            {/* 下拉指示器 */}
            <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />

            {/* 弹窗内容 */}
            <View className="mt-5 items-center">
              {selectedItem && (
                <Image
                  source={isLocalResource(selectedItem.source) ? selectedItem.source : { uri: selectedItem.source }}
                  style={{
                    width: 200,
                    height: 280,
                    borderRadius: 10,
                    marginBottom: 15,
                  }}
                  contentFit="cover"
                  placeholder="Loading..."
                  cachePolicy="memory-disk"
                  onError={(error) => {
                    console.error('Modal image load error:', error);
                  }}
                />
              )}
            </View>

            {/* 弹窗底部按钮 */}
            <View className="flex-col gap-2 justify-center items-center mb-10 ">
              <Pressable
                onPress={async () => {

                  const session = await ChatSessionService.createSession(user?.id || '', "style_an_item");
                  if (session) {
                    router.push({
                      pathname: "/style_an_item",
                      params: { sessionId: session.id, imageUrl: selectedItem?.source }
                    });
                  }
                  closeModal();
                }}
                className="bg-black py-3 my-1 w-[50%] rounded-xl items-center justify-center"
              >
                <Text className="font-semibold text-lg text-white">
                  Style this item
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (selectedItem) {

                    deleteImage(selectedItem.index);
                    closeModal();
                  }
                }}
                className="bg-red-50 border border-red-200 py-3 my-1 w-[50%] rounded-xl items-center justify-center"
              >
                <Text className="font-semibold text-lg" style={{ color: '#dc2626' }}>
                  Delete this item
                </Text>
              </Pressable>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
