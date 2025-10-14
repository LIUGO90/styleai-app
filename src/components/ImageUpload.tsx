import React, { useRef, useState } from "react";
import { View, Text, Pressable, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "../utils/cn";
import { shadowStyles } from "../utils/shadow";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useImagePicker } from "@/hooks/useImagePicker";
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
  placeholder = "Upload Picture",
  showPreview = false,
  selectedImage,
}: ImageUploadProps) {
  const [deleteButtonPressed, setDeleteButtonPressed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用图片选择 hook
  const { showImagePickerOptions } = useImagePicker({
    onImageSelected: (imageUri: string) => {
      onImageSelect?.(imageUri);
    },
  });

  const handleRemoveImage = () => {
    Alert.alert("删除图片", "确定要删除这张图片吗？", [
      {
        text: "取消",
        style: "cancel",
      },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          onImageSelect?.("");
        },
      },
    ]);
  };

  if (showPreview && selectedImage) {
    return (
      <View className={cn("mt-3", className)}>

        <View className="relative items-center justify-center bg-gray-50 rounded-xl">
          <Image
            source={{ uri: selectedImage }}
            style={{
              width: "100%",
              height: 200,
            }}
            resizeMode="contain"
            cachePolicy="memory-disk"
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
                  : "bg-black/70 hover:bg-black/80",
              )}
              accessibilityRole="button"
              accessibilityLabel="Delete Image"
              accessibilityHint="Click to delete the uploaded image"
              style={shadowStyles.medium}
            >
              <Ionicons name="trash-outline" size={14} color="white" />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className={cn("mt-3", className)}>
      <View
        className={cn(
          "p-4 border-2 border-dashed rounded-xl",
          disabled
            ? "border-gray-200 bg-gray-100"
            : "border-gray-300 bg-gray-50",
        )}
      >
        <Pressable
          onPress={showImagePickerOptions}
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
          <Text
            className={cn(
              "text-sm mt-2 font-medium",
              disabled ? "text-gray-400" : "text-gray-600",
            )}
          >
            {placeholder}
          </Text>
          <Text
            className={cn(
              "text-xs mt-1",
              disabled ? "text-gray-300" : "text-gray-400",
            )}
          >
            Supports JPG, PNG formats
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
