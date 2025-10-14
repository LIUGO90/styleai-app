import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

export interface UseImagePickerOptions {
  onImageSelected?: (imageUri: string) => void;
  showAlert?: boolean;
}

export const useImagePicker = (options?: UseImagePickerOptions) => {
  const router = useRouter();
  const {
    onImageSelected,
    showAlert = true,
  } = options || {};

  // 从相册选择图片
  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          if (showAlert) {
            Alert.alert("Permission Required", "Camera roll permission is required to select images");
          }
          return null;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        // 触发回调
        if (onImageSelected) {
          onImageSelected(imageUri);
        }
        // return imageUri;
      }

      return null;
    } catch (error) {
      console.error("选择图片失败:", error);
      if (showAlert) {
        Alert.alert("Error", "Failed to select image");
      }
      return null;
    }
  };

  // 拍照功能
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();

      if (status !== "granted") {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
          if (showAlert) {
            Alert.alert("Permission Required", "Camera permission is required to take photos");
          }
          return null;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        // 触发回调
        if (onImageSelected) {
          onImageSelected(imageUri);
        }
      }

      return null;
    } catch (error) {
      console.error("拍照失败:", error);
      if (showAlert) {
        Alert.alert("Error", "Failed to take photo");
      }
      return null;
    }
  };

  // 显示图片选择选项
  const showImagePickerOptions = () => {
    if (Platform.OS === "web") {
      // Web端直接打开文件选择
      pickImageFromGallery();
    } else {
      // 移动端显示选择对话框
      Alert.alert(
        "Select Image",
        "Choose an option",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Photo Library",
            onPress: pickImageFromGallery,
          },
          {
            text: "Take Photo",
            onPress: takePhoto,
          },
        ],
        { cancelable: true }
      );
    }
  };

  return {
    pickImageFromGallery,
    takePhoto,
    showImagePickerOptions,
  };
};

