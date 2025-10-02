import React from "react";
import { View, Text, ScrollView, Pressable, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useImagePicker } from "@/hooks/useImagePicker";


export default function MyProfile() {
  const router = useRouter();
  const { user, signOut, session, clearAllUserData } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [userAvatar, setUserAvatar] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");



  // // 调试：打印用户信息
  // React.useEffect(() => {


  //   console.log("User Profile - Current user data:", {
  //     user: user,
  //     userMetadata: user?.user_metadata,
  //     email: user?.email,
  //     id: user?.id,
  //     created_at: user?.created_at,
  //   });
  // }, [user]);

  // 加载本地保存的头像
  React.useEffect(() => {
    const loadLocalAvatar = async () => {
      const name = await AsyncStorage.getItem("name") || "";
      console.log("name", name);
      const email = user?.user_metadata?.email || user?.email || "";
      setName(name);
      setEmail(email);
      try {
        const savedAvatar = await AsyncStorage.getItem('userAvatar');
        if (savedAvatar) {
          console.log('Loaded avatar from local storage');
          setUserAvatar(savedAvatar);
        } else {
          let avatar = userAvatar || user?.user_metadata?.picture || user?.user_metadata?.avatar_url || "";
          if (avatar.length === 0 || avatar === null || avatar === undefined) {
            createAvatar();
        }
      }
      } catch (error) {
        console.error('Error loading local avatar:', error);
      }
    };
    loadLocalAvatar();
  }, []);

  const createAvatar = async () => {
    const avatar = `https://api.dicebear.com/7.x/lorelei/svg?seed=${user?.id || email || 'default'}1&backgroundColor=ffd5dc,ffd6e7,d4e4ff,ffe4e6,e0f2fe`;
    setUserAvatar(avatar);
  };
  // 头像处理和保存到本地
  const processAndUploadAvatar = async (imageUri: string) => {
    try {
      console.log('1. Starting avatar processing, imageUri:', imageUri);
      setUploading(true);

      // 1. 裁剪和调整图片大小为 200x200，转换为 JPEG
      console.log('2. Resizing to 200x200 and converting image...');
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 80, height: 80 } }, // 固定尺寸 200x200
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );
      console.log('3. Image processed to 200x200:', manipResult.uri);

      // 2. 读取文件为 base64
      console.log('4. Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: 'base64',
      });
      console.log('5. File read successfully, size:', (base64.length / 1024).toFixed(2), 'KB');

      // 3. 保存到本地 AsyncStorage
      console.log('6. Saving to local storage...');
      const avatarData = `data:image/jpeg;base64,${base64}`;
      await AsyncStorage.setItem('userAvatar', avatarData);
      console.log('7. Saved to local storage');

      // 4. 更新本地状态
      console.log('8. Updating local state...');
      setUserAvatar(avatarData);

      console.log('9. Success! Avatar saved locally');
      Alert.alert("✅ Success", "Avatar updated successfully!");

    } catch (error: any) {
      console.error('❌ Error saving avatar:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      Alert.alert("Error", `Failed to save avatar:\n${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // 使用图片选择 hook
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
              // 清除头像
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
                      console.log("App should restart now");
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

  const menuItems = [
    {
      id: "Profile Photo",
      title: "Profile Photo",
      icon: "account-edit" as const,
      color: "#3b82f6",
      onPress: () => {
        router.replace({
          pathname: '/onboarding/BaseFive',
          params: { isUpdate: "true" }
        });
      },
    },
    // {
    //   id: "Physical Profile",
    //   title: "Physical Profile",
    //   icon: "hanger" as const,
    //   color: "#10b981",
    //   onPress: () => console.log("My Wardrobe"),
    // },
    {
      id: "Style Preference",
      title: "Style Preference",
      icon: "heart" as const,
      color: "#ef4444",
      onPress: () => router.replace("/onboarding/YourRangeOne"),
    },

  ];

  const refreshUserInfo = async () => {
    setRefreshing(true);
    try {
      console.log("Refreshing user information...");

      // 从本地存储重新加载头像
      const savedAvatar = await AsyncStorage.getItem('userAvatar');
      if (savedAvatar) {
        console.log('Reloaded avatar from local storage');
        setUserAvatar(savedAvatar);
      }

      console.log("User info refreshed successfully");
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
            // 清除头像
            await AsyncStorage.removeItem('userAvatar');
            setUserAvatar("");

            await signOut();
            // 清除引导数据
            Alert.alert(
              "Success",
              "Signed out successfully. The app will restart.",
            );
            await AsyncStorage.removeItem("onboardingData");
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View className="bg-white pt-12 pb-6 px-5">
          {/* <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-800">My Profile</Text>
            <View className="flex-row items-center space-x-2">
              <Pressable
                onPress={refreshUserInfo}
                className="p-2"
                disabled={refreshing}
              >
                <MaterialCommunityIcons
                  name={refreshing ? "loading" : "refresh"}
                  size={24}
                  color={refreshing ? "#9ca3af" : "#007AFF"}
                />
              </Pressable>
            </View>
          </View> */}

          {/* User Info Card */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={showImagePickerOptions}
              disabled={uploading}
              className="relative mr-4 rounded-full"
            >
              <Image
                source={{ uri: userAvatar }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                }}
                cachePolicy="memory-disk"
                contentFit="cover"
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
            <View className="flex-1">
              <Text className="text-black text-xl font-bold mb-1">
                {name}
              </Text>
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
            <Pressable className="p-2">
              <MaterialCommunityIcons name="pencil" size={20} color="white" />
            </Pressable>
          </View>
        </View>



        {/* Menu Items */}
        <View
          className="bg-white rounded-2xl p-4 m-6"
        >
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Settings & Preferences
          </Text>
          <View className="space-y-2">
            {menuItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={item.onPress}
                className="flex-row items-center p-4 my-2 rounded-xl bg-gray-50"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
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
        <View style={{ marginHorizontal: 20, marginBottom: 32 }}>
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
      </ScrollView>
    </View>
  );
}
