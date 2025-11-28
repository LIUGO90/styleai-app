import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/utils/supabase";
import { uploadImageWithFileSystem } from "@/services/FileUploadService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { shadowStyles } from "@/utils/shadow";
import { globalToast } from "@/utils/globalToast";

export default function ProfilePhoto() {
    const router = useRouter();
    const { user } = useAuth();
    const [portraitPhoto, setPortraitPhoto] = useState<string>("");
    const [fullBodyPhoto, setFullBodyPhoto] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPortrait, setIsUploadingPortrait] = useState(false);
    const [isUploadingFullBody, setIsUploadingFullBody] = useState(false);
    const isProcessingRef = useRef(false);

    // Load photos from database
    useEffect(() => {
        loadPhotos();
    }, [user?.id]);

    const loadPhotos = async () => {
        if (!user?.id) return;

        try {
            setIsLoading(true);

            // Load portrait from AsyncStorage first
            const savedAvatar = await AsyncStorage.getItem('userAvatar');
            if (savedAvatar) {
                setPortraitPhoto(savedAvatar);
            }

            // Load from database
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('avatar_url, fullbodyphoto')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('❌ Error loading photos:', error);
            } else {
                if (profileData?.avatar_url) {
                    setPortraitPhoto(profileData.avatar_url);
                    await AsyncStorage.setItem('userAvatar', profileData.avatar_url);
                }
                if (profileData?.fullbodyphoto) {
                    setFullBodyPhoto(profileData.fullbodyphoto);
                }
            }

            // Also check onboardingData for fullBodyPhoto
            const onboardingData = await AsyncStorage.getItem("onboardingData");
            if (onboardingData) {
                const onboardingDataObj = JSON.parse(onboardingData);
                if (onboardingDataObj.fullBodyPhoto && !profileData?.fullbodyphoto) {
                    setFullBodyPhoto(onboardingDataObj.fullBodyPhoto);
                }
            }
        } catch (error) {
            console.error('❌ Error loading photos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const pickImageFromGallery = async (type: 'portrait' | 'fullbody') => {
        try {
            const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

            if (status !== "granted") {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

                if (permissionResult.granted === false) {
                    Alert.alert("Permission Required", "Camera roll permission is required to select images");
                    isProcessingRef.current = false;
                    if (type === 'portrait') setIsUploadingPortrait(false);
                    else setIsUploadingFullBody(false);
                    return;
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
                if (type === 'portrait') {
                    await processAndUploadPortrait(imageUri);
                } else {
                    await processAndUploadFullBody(imageUri);
                }
            } else {
                isProcessingRef.current = false;
                if (type === 'portrait') setIsUploadingPortrait(false);
                else setIsUploadingFullBody(false);
            }
        } catch (error) {
            console.error("选择图片失败:", error);
            Alert.alert("Error", "Failed to select image");
            isProcessingRef.current = false;
            if (type === 'portrait') setIsUploadingPortrait(false);
            else setIsUploadingFullBody(false);
        }
    };

    const takePhoto = async (type: 'portrait' | 'fullbody') => {
        try {
            const { status } = await ImagePicker.getCameraPermissionsAsync();

            if (status !== "granted") {
                const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

                if (permissionResult.granted === false) {
                    Alert.alert("Permission Required", "Camera permission is required to take photos");
                    isProcessingRef.current = false;
                    if (type === 'portrait') setIsUploadingPortrait(false);
                    else setIsUploadingFullBody(false);
                    return;
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
                if (type === 'portrait') {
                    await processAndUploadPortrait(imageUri);
                } else {
                    await processAndUploadFullBody(imageUri);
                }
            } else {
                isProcessingRef.current = false;
                if (type === 'portrait') setIsUploadingPortrait(false);
                else setIsUploadingFullBody(false);
            }
        } catch (error) {
            console.error("拍照失败:", error);
            Alert.alert("Error", "Failed to take photo");
            isProcessingRef.current = false;
            if (type === 'portrait') setIsUploadingPortrait(false);
            else setIsUploadingFullBody(false);
        }
    };

    const handleSelectPortrait = async () => {
        if (isProcessingRef.current || isUploadingPortrait) return;

        try {
            isProcessingRef.current = true;
            setIsUploadingPortrait(true);

            if (Platform.OS === "web") {
                await pickImageFromGallery('portrait');
            } else {
                Alert.alert(
                    "Select Portrait Photo",
                    "Choose an option",
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                isProcessingRef.current = false;
                                setIsUploadingPortrait(false);
                            },
                        },
                        {
                            text: "Photo Library",
                            onPress: () => pickImageFromGallery('portrait'),
                        },
                        {
                            text: "Take Photo",
                            onPress: () => takePhoto('portrait'),
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('❌ Error selecting portrait:', error);
            Alert.alert("Error", "Failed to select portrait photo");
            isProcessingRef.current = false;
            setIsUploadingPortrait(false);
        }
    };

    const processAndUploadPortrait = async (imageUri: string) => {
        if (!user?.id) return;

        try {
            // Resize and compress image
            const manipResult = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 400, height: 400 } }],
                {
                    compress: 0.8,
                    format: ImageManipulator.SaveFormat.JPEG,
                    base64: false
                }
            );

            // Upload to server
            const imageUrl = await uploadImageWithFileSystem(user.id, manipResult.uri);

            if (imageUrl) {
                // Update database
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: imageUrl })
                    .eq('id', user.id);

                if (updateError) {
                    throw new Error(`Failed to update portrait: ${updateError.message}`);
                }

                // Update local storage
                await AsyncStorage.setItem('userAvatar', imageUrl);
                setPortraitPhoto(imageUrl);

                globalToast.success("Portrait photo updated");
            }
        } catch (error) {
            console.error('❌ Error processing portrait:', error);
            Alert.alert("Error", "Failed to upload portrait photo");
        } finally {
            isProcessingRef.current = false;
            setIsUploadingPortrait(false);
        }
    };

    const handleSelectFullBody = async () => {
        if (isProcessingRef.current || isUploadingFullBody) return;

        try {
            isProcessingRef.current = true;
            setIsUploadingFullBody(true);

            if (Platform.OS === "web") {
                await pickImageFromGallery('fullbody');
            } else {
                Alert.alert(
                    "Select Full-body Photo",
                    "Choose an option",
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                isProcessingRef.current = false;
                                setIsUploadingFullBody(false);
                            },
                        },
                        {
                            text: "Photo Library",
                            onPress: () => pickImageFromGallery('fullbody'),
                        },
                        {
                            text: "Take Photo",
                            onPress: () => takePhoto('fullbody'),
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('❌ Error selecting full-body:', error);
            Alert.alert("Error", "Failed to select full-body photo");
            isProcessingRef.current = false;
            setIsUploadingFullBody(false);
        }
    };

    const processAndUploadFullBody = async (imageUri: string) => {
        if (!user?.id) return;

        try {
            // Resize and compress image
            const manipResult = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 800, height: 1200 } }],
                {
                    compress: 0.8,
                    format: ImageManipulator.SaveFormat.JPEG,
                    base64: false
                }
            );

            // Upload to server
            const imageUrl = await uploadImageWithFileSystem(user.id, manipResult.uri);

            if (imageUrl) {
                // Update database
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ fullbodyphoto: imageUrl })
                    .eq('id', user.id);

                if (updateError) {
                    throw new Error(`Failed to update full-body photo: ${updateError.message}`);
                }

                // Update onboardingData
                const onboardingData = await AsyncStorage.getItem("onboardingData") || "{}";
                const onboardingDataObj = JSON.parse(onboardingData);
                onboardingDataObj.fullBodyPhoto = imageUrl;
                await AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingDataObj));

                setFullBodyPhoto(imageUrl);

                globalToast.success("Full-body photo updated");
            }
        } catch (error) {
            console.error('❌ Error processing full-body:', error);
            Alert.alert("Error", "Failed to upload full-body photo");
        } finally {
            isProcessingRef.current = false;
            setIsUploadingFullBody(false);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;

        try {
            setIsSaving(true);

            // Both photos are already saved when selected, so we just need to confirm
            globalToast.success("Profile photos saved successfully");

            // Navigate back after a short delay
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (error) {
            console.error('❌ Error saving:', error);
            Alert.alert("Error", "Failed to save photos");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView edges={["top"]} className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={["top"]} className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-200 relative">
                <Pressable
                    onPress={() => {
                        router.replace("/tabs/my");
                    }}
                    className="absolute left-4"
                    style={{
                        zIndex: 10,
                        minWidth: 44,
                        minHeight: 44,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <MaterialCommunityIcons name="chevron-left" size={32} color="#000" />
                </Pressable>
                <Text className="text-xl font-bold text-gray-800 flex-1 text-center">Profile Photo</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
                {/* Photo Cards Container */}
                <View className="flex-row justify-between mb-6" style={{ gap: 16 }}>
                    {/* Portrait Card */}
                    {/* <View className="flex-1">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleSelectPortrait}
                            disabled={isUploadingPortrait}
                            className="bg-gray-100 rounded-2xl overflow-hidden"
                            style={{ aspectRatio: 712/1245, ...shadowStyles.medium }}
                        >
                            {portraitPhoto ? (
                                <View className="relative w-full h-full">
                                    <Image
                                        source={{ uri: portraitPhoto }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                    />
                                    {isUploadingPortrait && (
                                        <View className="absolute inset-0 bg-black/50 items-center justify-center">
                                            <ActivityIndicator size="large" color="#fff" />
                                        </View>
                                    )}
                                    <Pressable
                                        onPress={handleSelectPortrait}
                                        className="absolute top-2 right-2 bg-white/90 rounded-full p-2"
                                        style={shadowStyles.small}
                                    >
                                        <MaterialCommunityIcons name="pencil" size={18} color="#000" />
                                    </Pressable>
                                </View>
                            ) : (
                                <View className="flex-1 items-center justify-center">
                                    <MaterialCommunityIcons name="image-outline" size={48} color="#9ca3af" />
                                    <Text className="text-gray-500 mt-2 text-sm">Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text className="text-center mt-3 text-sm font-medium text-gray-700">Portrait</Text>
                    </View> */}

                    {/* Full-body Card */}
                    <View className="w-[48%] rounded-2xl">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleSelectFullBody}
                            disabled={isUploadingFullBody}
                            className="bg-gray-100 rounded-2xl border-2 border-gray-200 overflow-hidden"
                            style={{ aspectRatio: 712 / 1245, width: "100%", ...shadowStyles.medium }}
                        >
                            {fullBodyPhoto ? (
                                <View className="relative w-full h-full">
                                    <Image
                                        source={{ uri: fullBodyPhoto }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"

                                    />
                                    {isUploadingFullBody && (
                                        <View className="absolute inset-0 bg-black/50 items-center justify-center">
                                            <ActivityIndicator size="large" color="#fff" />
                                        </View>
                                    )}
                                    <Pressable
                                        onPress={handleSelectFullBody}
                                        className="absolute top-2 right-2 bg-white/90 rounded-full p-2"
                                        style={shadowStyles.small}
                                    >
                                        <MaterialCommunityIcons name="pencil" size={18} color="#000" />
                                    </Pressable>
                                </View>
                            ) : (
                                <View className="flex-1 items-center justify-center">
                                    <MaterialCommunityIcons name="image-outline" size={48} color="#9ca3af" />
                                    <Text className="text-gray-500 mt-2 text-sm">Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text className="text-center mt-3 text-sm font-medium text-gray-700">Full-body</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Save Button */}
            {/* <View className="px-6 pb-6 pt-4 border-t border-gray-200">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    className="bg-gray-800 rounded-full py-4 items-center justify-center"
                    style={{ opacity: isSaving ? 0.6 : 1 }}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text className="text-white text-base font-semibold">Save</Text>
                    )}
                </TouchableOpacity>
            </View> */}
        </SafeAreaView>
    );
}
