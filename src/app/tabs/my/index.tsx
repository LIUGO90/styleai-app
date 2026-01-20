import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useImagePicker } from "@/hooks/useImagePicker";
import { supabase } from "@/utils/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCredit } from "@/contexts/CreditContext";
import { uploadImageWithFileSystem } from "@/services/FileUploadService";
import { useSubscription } from "@/hooks/useRevenueCat";
import { analytics } from "@/services/AnalyticsService";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { shadowStyles } from "@/utils/shadow";
import { globalToast } from "@/utils/globalToast";


export default function MyProfile() {
  const router = useRouter();
  const { user, signOut, session, clearAllUserData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [avatarKey, setAvatarKey] = useState<string>(""); // 用于强制刷新图片
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingName, setEditingName] = useState<string>("");
  const [editingEmail, setEditingEmail] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // 获取订阅状态
  const { subscriptionStatus, isActive, loading: subscriptionLoading } = useSubscription();
  // Load saved avatar, name, and email
  const loadUserData = async (forceRefresh = false) => {
    try {
      // console.log("🎈user", user);
      const storedName = await AsyncStorage.getItem("userName");
      const storedEmail = await AsyncStorage.getItem("userEmail");
      // console.log("🎈storedName", storedName);
      // console.log("🎈storedEmail", storedEmail);

      setName(storedName || "user");
      if (storedEmail?.endsWith("@privaterelay.appleid.com")) {
        setEmail("user@example.com");
      } else {
        setEmail(storedEmail || "");
      }
      // Load avatar
      const savedAvatar = await AsyncStorage.getItem('userAvatar');
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
      } else {
        let avatar = userAvatar || user?.user_metadata?.picture || user?.user_metadata?.avatar_url || "";
        if (avatar.length === 0 || avatar === null || avatar === undefined) {
          createAvatar();
        }
      }

      // Force refresh avatar from server if needed
      if (forceRefresh && user?.id) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();

          if (profileData?.avatar_url) {
            setUserAvatar(profileData.avatar_url);
            await AsyncStorage.setItem('userAvatar', profileData.avatar_url);
          }
        } catch (error) {
          console.log('Could not refresh avatar from server:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  // 页面浏览追踪
  useFocusEffect(
    useCallback(() => {
      analytics.page('my_profile', {
        category: 'main',
        tab: 'my',
      });
    }, [])
  );

  useEffect(() => {
    loadUserData();
  }, [user]);

  const createAvatar = async () => {
    const avatar = `https://api.dicebear.com/7.x/lorelei/svg?seed=${user?.id || email || 'default'}1&backgroundColor=ffd5dc,ffd6e7,d4e4ff,ffe4e6,e0f2fe`;
    setUserAvatar(avatar);
  };
  // Avatar processing and local saving
  const processAndUploadAvatar = async (imageUri: string) => {
    try {

      setUploading(true);

      // 1. Crop and resize image to 200x200, convert to JPEG

      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 80, height: 80 } }, // Fixed size 200x200
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );

      // 2. Read file as base6
      // 3. Save to local AsyncStorage
      const imageUrl = await uploadImageWithFileSystem(user?.id || "", manipResult.uri);

      // 更新数据库
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: imageUrl }).eq('id', user?.id || "");
      if (updateError) {
        console.log("error ", updateError)
        throw new Error(`Failed to update avatar: ${updateError.message}`);
      }

      // 等待数据库更新完成
      await new Promise(resolve => setTimeout(resolve, 300));

      // 4. 更新本地存储和状态
      await AsyncStorage.setItem('userAvatar', imageUrl || "");

      // 直接更新状态和 key，强制图片重新加载
      setUserAvatar(imageUrl || "");
      setAvatarKey(Date.now().toString()); // 更新 key 来强制重新渲染图片

      Alert.alert("✅ Success", "Avatar updated successfully!");

    } catch (error: any) {
      console.error('❌ Error saving avatar:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      Alert.alert("Error", `Failed to save avatar:\n${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // Use image picker hook
  const { showImagePickerOptions } = useImagePicker({
    onImageSelected: processAndUploadAvatar,
  });




  const clearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will completely remove all user data and reset the app. You will need to log in again. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All Data",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear avatar
              await AsyncStorage.removeItem('userAvatar');
              setUserAvatar("");

              await clearAllUserData();
              Alert.alert(
                "Success",
                "All data has been cleared. The app will restart.",
                [
                  {
                    text: "OK",
                    onPress: () => {

                    },
                  },
                ],
              );
            } catch (error) {
              console.error("Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ],
    );
  };

  const { showCreditModal } = useCredit();

  const menuItems = [
    {
      id: "Profile Photo",
      title: "Profile Photo",
      icon: "account-edit" as const,
      color: "#3b82f6",
      onPress: () => {
        router.replace({
          pathname: '/tabs/my/profilePhoto',
          params: { isUpdate: "true" }
        });
      },
    },
    {
      id: "Physical Profile",
      title: "Physical Profile",
      icon: "heart" as const,
      color: "#ef4444",
      onPress: () => router.replace("/tabs/my/PhysicalProfile"),
    },
    {
      id: "Style Preference",
      title: "Style Preference",
      icon: "palette" as const,
      color: "green",
      onPress: () => router.replace("/tabs/my/stylePreference"),
    },
    {
      id: "Subscription",
      title: "Credits Store",
      icon: "crown" as const,
      color: "#f59e0b",
      onPress: () => router.push("/tabs/my/subscription"),
    },
    // {
    //   id: "DebugToast",
    //   title: "Message Debug",
    //   icon: "bug" as const,
    //   color: "#8b5cf6",
    //   onPress: () => {
    //     // 测试不同类型的 Toast 消息
    //     const toastTypes = ['success', 'error', 'info', 'warning'] as const;
    //     const randomType = toastTypes[Math.floor(Math.random() * toastTypes.length)];

    //       globalToast.info("Generating Try-on", {
    //         label: "Check the progress in My Looks",
    //         onPress: () => {
    //           router.push("/tabs/lookbook");
    //         }
    //       },10000*10);

    //   },
    // },
    // {
    //   id: "Credits",
    //   title: "Test Credits Store",
    //   icon: "star" as const,
    //   color: "#fbbf24",
    //   onPress: () => router.push("/tabs/my/credit"),
    // }, {
    //   id: "test",
    //   title: "测试订阅页面",
    //   icon: "star" as const,
    //   color: "#fbbf24",
    //   onPress: () => router.replace("/onboarding/BaseSix"),
    // },
    // {
    //   id: 'credits',
    //   icon: 'star',
    //   title: 'Test My Credits',
    //   subtitle: 'View credit balance and usage',
    //   onPress: () => showCreditModal(user?.id || '', "test_my_credits"),
    //   color: '#f97316',
    // },


  ];

  const refreshUserInfo = async () => {
    setRefreshing(true);
    try {
      // Force refresh user data including avatar from server
      await loadUserData(true);

      Alert.alert("✅ Success", "Profile refreshed successfully!");

    } catch (error) {
      console.error("Error refreshing user info:", error);
      Alert.alert("Error", "Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  const logout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear avatar
            await AsyncStorage.removeItem('userAvatar');
            await AsyncStorage.removeItem('newlook');
            await AsyncStorage.removeItem("onboardingData");
            setUserAvatar("");

            await signOut();
            // Clear onboarding data
            Alert.alert(
              "Success",
              "Signed out successfully. The app will restart.",
            );
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const revokeAppleAuthorization = async () => {
    // Check if user signed in with Apple
    const isAppleUser = session?.access_token === "apple_dev_token" ||
      user?.user_metadata?.provider === "apple" ||
      user?.app_metadata?.provider === "apple";

    if (!isAppleUser) {
      Alert.alert("Notice", "This feature is only available for users who signed in with Apple");
      return;
    }

    Alert.alert(
      "⚠️ Revoke Apple Authorization",
      // "This will disconnect your Apple Sign-In and clear local data.\n\nTo completely revoke authorization, you also need to:\n1. Open iPhone Settings\n2. Tap your Apple ID\n3. Select Password & Security\n4. Tap Apps Using Apple ID\n5. Select this app and stop using Apple ID\n\nContinue?",
      "This will disconnect your Apple Sign-In and clear local data.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Revoke Authorization",
          style: "destructive",
          onPress: async () => {
            // Show alert first, then clear data after user confirms
            Alert.alert(
              "✅ Authorization Disconnected",
              "Apple Sign-In has been disconnected.\n\nPlease remember to revoke authorization in iPhone Settings so Apple will provide your information again on next sign-in.",
              [
                {
                  text: "Got it",
                  onPress: async () => {
                    try {
                      // 1. Clear all local data
                      await AsyncStorage.removeItem('userAvatar');
                      await AsyncStorage.removeItem("onboardingData");
                      await AsyncStorage.removeItem("name");
                      await AsyncStorage.removeItem("userEmail");
                      setUserAvatar("");

                      // 2. Clear all user data and sign out
                      // Use setTimeout to ensure UI updates complete before navigation
                      setTimeout(async () => {
                        await clearAllUserData();
                      }, 100);
                    } catch (error) {
                      console.error("❌ Error revoking authorization:", error);
                      Alert.alert("Error", "Failed to revoke authorization. Please try again.");
                    }
                  },
                },
              ]
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* User Info Card */}
        <View className="bg-white mt-6 px-6">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={showImagePickerOptions}
              disabled={uploading}
              className="relative mr-4 rounded-full"
            >
              <Image
                source={{ uri: userAvatar && avatarKey ? `${userAvatar}?t=${avatarKey}` : userAvatar }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                }}
                cachePolicy="memory-disk"
                contentFit="cover"
                key={avatarKey || userAvatar} // 使用 avatarKey 来强制重新渲染
              />
              {uploading ? (
                <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                  <ActivityIndicator color="white" />
                </View>
              ) : (
                <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5">
                  <MaterialCommunityIcons name="camera" size={10} color="white" />
                </View>
              )}
            </TouchableOpacity>
            <View className="flex-1 ">

              <View className="flex-row items-center">
                <Text className="text-black text-xl font-bold mb-1">
                  {name}
                </Text>
                {/* 只在用户有活跃订阅时显示 Premium 标签 */}
                {/* {(isActive || isPremium) && ( */}
                <View className={`mx-2 px-3 items-center rounded-full ${isActive ? "bg-orange-500" : "bg-gray-200"}`}>
                  <Text className="text-black text-sm mb-1 font-bold italic">
                    Premium
                  </Text>
                </View>
                {/* )} */}
              </View>

              <Text className="text-black text-sm mb-1">
                {email}
              </Text>
              {/* <Text className="text-black text-xs">
                  Member since {userData.memberSince}
                </Text>
                <Text className="text-black-100 text-xs">
                  Signed in with {userData.provider}
                </Text> */}
              {/* {userData.isVerified && (
                    <View className="flex-row items-center mt-1">
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={12}
                        color="#10b981"
                      />
                      <Text className="text-green-300 text-xs ml-1">
                        Verified
                      </Text>
                    </View>
                  )} */}
            </View>
            <Pressable
              className="p-2"
              onPress={() => {
                setEditingName(name);
                setEditingEmail(email);
                setIsEditModalVisible(true);
              }}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#000000" />
            </Pressable>
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-white rounded-2xl p-4 m-4" style={shadowStyles.medium}>
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Settings & Preferences
          </Text>
          <View className="space-y-2">
            {menuItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={item.onPress}
                className="flex-row items-center px-4 py-3 my-2 rounded-xl bg-gray-50"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={20}
                    color={item.color}
                  />
                </View>
                <Text className="flex-1 text-gray-700 font-medium">
                  {item.title}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#9ca3af"
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <Pressable
            onPress={logout}
            style={{
              backgroundColor: "#fef2f2",
              borderWidth: 1,
              borderColor: "#fecaca",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
            <Text className="text-red-600 font-medium ml-2">Log Out</Text>
          </Pressable>
        </View>

        {/* Revoke Apple Authorization Button - Only for Apple Users */}
        {(session?.access_token === "apple_dev_token" ||
          user?.user_metadata?.provider === "apple" ||
          user?.app_metadata?.provider === "apple") && (
            <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
              <Pressable
                onPress={revokeAppleAuthorization}
                style={{
                  backgroundColor: "#1e1b4b",
                  borderWidth: 1,
                  borderColor: "#4338ca",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name="shield-lock-open" size={20} color="#a5b4fc" />
                <Text style={{ color: "#a5b4fc", fontWeight: "600", marginLeft: 8 }}>
                  Revoke Apple Authorization
                </Text>
              </Pressable>
            </View>
          )}
      </ScrollView>

      {/* 编辑用户名和邮箱的 Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <Pressable
              className="flex-1"
              onPress={() => setIsEditModalVisible(false)}
            />
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-800">Edit Profile</Text>
                <Pressable onPress={() => setIsEditModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#000000" />
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-4">Name</Text>
                  <TextInput
                    value={editingName}
                    onChangeText={setEditingName}
                    placeholder="Enter your name"
                    className="bg-gray-100 rounded-xl px-4 text-base"
                    style={{
                      paddingVertical: 16,
                      minHeight: 52,
                      fontSize: 16,
                      lineHeight: 20,
                      includeFontPadding: false,
                    }}
                    autoCapitalize="words"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                  <TextInput
                    value={editingEmail}
                    onChangeText={setEditingEmail}
                    placeholder="Enter your email"
                    className="bg-gray-100 rounded-xl px-4 text-base"
                    style={{
                      paddingVertical: 16,
                      minHeight: 52,
                      fontSize: 16,
                      lineHeight: 20,
                      includeFontPadding: false,
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={async () => {
                  if (!editingName.trim() || !editingEmail.trim()) {
                    Alert.alert("Error", "Name and email cannot be empty");
                    return;
                  }

                  // 验证邮箱格式
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(editingEmail.trim())) {
                    Alert.alert("Error", "Please enter a valid email address");
                    return;
                  }

                  setIsSaving(true);
                  try {
                    const trimmedName = editingName.trim();
                    const trimmedEmail = editingEmail.trim();

                    // 1. 先检查 profiles 表是否存在记录
                    const { data: existingProfile, error: checkError } = await supabase
                      .from('profiles')
                      .select('id')
                      .eq('id', user?.id || "")
                      .maybeSingle();

                    let updateError;
                    if (existingProfile && !checkError) {
                      // 如果记录存在，执行更新
                      const { error } = await supabase
                        .from('profiles')
                        .update({
                          name: trimmedName,
                          email: trimmedEmail,
                          updated_at: new Date().toISOString(),
                        })
                        .eq('id', user?.id || "");
                      updateError = error;
                    } else {
                      // 如果记录不存在，执行插入（使用 upsert 更安全）
                      const { error } = await supabase
                        .from('profiles')
                        .upsert({
                          id: user?.id || "",
                          name: trimmedName,
                          email: trimmedEmail,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        }, {
                          onConflict: 'id'
                        });
                      updateError = error;
                    }

                    if (updateError) {
                      console.error('❌ Database update error:', updateError);
                      throw new Error(updateError.message);
                    }

                    // 2. 更新本地存储
                    await AsyncStorage.setItem('userName', trimmedName);
                    await AsyncStorage.setItem('userEmail', trimmedEmail);

                    // 3. 实时更新显示
                    setName(trimmedName);
                    setEmail(trimmedEmail);

                    setIsEditModalVisible(false);
                    globalToast.success("Profile updated successfully!");

                    // 4. 触发数据刷新以确保同步
                    setTimeout(() => {
                      loadUserData(true);
                    }, 500);
                  } catch (error: any) {
                    console.error('❌ Error updating profile:', error);
                    Alert.alert("Error", `Failed to update profile: ${error?.message || 'Unknown error'}`);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className={`bg-black rounded-xl py-4 items-center ${isSaving ? 'opacity-50' : ''}`}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
