import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Alert, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../utils/cn';
import { shadowStyles } from '../utils/shadow';
import * as ImagePicker from 'expo-image-picker';

export interface ImageUploadProps {
  onImageSelect?: (imageUri: string, messageId?: string) => void;
  onImageUpload?: (imageUri: string) => Promise<string>;
  onImageError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  showPreview?: boolean;
  selectedImage?: string;
}

export function ImageUpload({
  onImageSelect,
  onImageUpload,
  onImageError,
  className,
  disabled = false,
  placeholder = "点击上传图片",
  showPreview = false,
  selectedImage,
}: ImageUploadProps) {
  const [deleteButtonPressed, setDeleteButtonPressed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 处理Web端文件选择
  const handleWebFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect?.(result);
    };
    reader.readAsDataURL(file);
  };

  // 从相册选择图片
  const handlePickFromGallery = async () => {
    try {
      // 先检查权限状态
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        // 请求权限
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert('权限错误', '需要相册权限才能选择图片');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        // aspect: [4, 3],
        // quality: 0.8,
        allowsMultipleSelection: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelect?.(result.assets[0].uri);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      onImageError?.('选择图片失败');
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

      // 配置相机选项，避免白屏问题
      const result = await ImagePicker.launchCameraAsync({
        // allowsEditing: true,
        // aspect: [4, 3],
        // quality: 0.8,
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelect?.(result.assets[0].uri);
      }
    } catch (error) {
      console.error('拍照失败:', error);
      onImageError?.('拍照失败');
    }
  };

  const handleImageUpload = () => {
    if (disabled) return;

    if (Platform.OS === 'web') {
      // Web端直接触发文件选择
      fileInputRef.current?.click();
    } else {
      // 移动端显示选择对话框
      Alert.alert(
        '选择图片',
        '请选择图片来源',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '从相册选择',
            onPress: handlePickFromGallery,
          },
          {
            text: '拍照',
            onPress: handleTakePhoto,
          },
        ]
      );
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      '删除图片',
      '确定要删除这张图片吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            onImageSelect?.('');
          },
        },
      ]
    );
  };

  if (showPreview && selectedImage) {
    return (
      <View className={cn("mt-3", className)}>
        {/* Web端隐藏的文件输入 */}
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleWebFileSelect}
            style={{ display: 'none' }}
          />
        )}
        <View className="relative items-center justify-center bg-gray-50 rounded-xl">
          <Image
            source={{ uri: selectedImage }}
            style={{
              width: '100%',
              height: 200,
            }}
            resizeMode="contain"
          />
          {!disabled && (
            <Pressable
              onPress={handleRemoveImage}
              onPressIn={() => setDeleteButtonPressed(true)}
              onPressOut={() => setDeleteButtonPressed(false)}
              className={cn(
                "absolute top-3 right-3 backdrop-blur-sm rounded-full w-8 h-8 items-center justify-center border border-white/20 transition-all duration-150",
                deleteButtonPressed
                  ? "bg-red-500/90 scale-95"
                  : "bg-black/70 hover:bg-black/80"
              )}
              accessibilityRole="button"
              accessibilityLabel="删除图片"
              accessibilityHint="点击删除已上传的图片"
              style={shadowStyles.medium}
            >
              <Ionicons
                name="trash-outline"
                size={14}
                color="white"
              />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className={cn("mt-3", className)}>
      {/* Web端隐藏的文件输入 */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleWebFileSelect}
          style={{ display: 'none' }}
        />
      )}
      <View className={cn(
        "p-4 border-2 border-dashed rounded-xl",
        disabled
          ? "border-gray-200 bg-gray-100"
          : "border-gray-300 bg-gray-50"
      )}>
        <Pressable
          onPress={handleImageUpload}
          disabled={disabled}
          className="items-center justify-center py-4"
          accessibilityRole="button"
          accessibilityLabel="上传图片"
          accessibilityHint="点击选择图片上传"
          accessibilityState={{ disabled }}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={32}
            color={disabled ? "#9CA3AF" : "#6B7280"}
          />
          <Text className={cn(
            "text-sm mt-2 font-medium",
            disabled ? "text-gray-400" : "text-gray-600"
          )}>
            {placeholder}
          </Text>
          <Text className={cn(
            "text-xs mt-1",
            disabled ? "text-gray-300" : "text-gray-400"
          )}>
            支持 JPG、PNG 格式
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
