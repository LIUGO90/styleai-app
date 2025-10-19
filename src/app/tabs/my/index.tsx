import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
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


export default function MyProfile() {
  const router = useRouter();
  const { user, signOut, session, clearAllUserData } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [userAvatar, setUserAvatar] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");

  // Load saved avatar, name, and email
  const loadUserData = async () => {
    try {
      // console.log("🎈user", user);
      const storedName = await AsyncStorage.getItem("userName");
      const storedEmail = await AsyncStorage.getItem("userEmail");
      // console.log("🎈storedName", storedName);
      // console.log("🎈storedEmail", storedEmail);
      setName(storedName || "");
      setEmail(storedEmail || "");

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
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

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

      // 2. Read file as base64

      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: 'base64',
      });

      // 3. Save to local AsyncStorage

      const avatarData = `data:image/jpeg;base64,${base64}`;
      await AsyncStorage.setItem('userAvatar', avatarData);

      // 4. Update local state

      setUserAvatar(avatarData);


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
          pathname: '/tabs/my/BaseFive',
          params: { isUpdate: "true" }
        });
      },
    },
    {
      id: "Style Preference",
      title: "Style Preference",
      icon: "heart" as const,
      color: "#ef4444",
      onPress: () => router.replace("/onboarding/BaseTwo"),
    },
    {
      id: "Subscription",
      title: "Subscription",
      icon: "crown" as const,
      color: "#f59e0b",
      onPress: () => router.push("/tabs/my/subscription"),
    },
    {
      id: "Credits",
      title: "Credits Store",
      icon: "star" as const,
      color: "#fbbf24",
      onPress: () => router.push("/tabs/my/credit"),
    },{
      id: "test",
      title: "测试订阅页面",
      icon: "star" as const,
      color: "#fbbf24",
      onPress: () => router.replace("/tabs/my/BaseSix"),
    },
    {
      id: 'credits',
      icon: 'star',
      title: '我的积分',
      subtitle: '查看积分余额和用途',
      onPress: showCreditModal,
      color: '#f97316',
    },


  ];

  const refreshUserInfo = async () => {
    setRefreshing(true);
    try {

      // Reload avatar from local storage
      const savedAvatar = await AsyncStorage.getItem('userAvatar');
      if (savedAvatar) {

        setUserAvatar(savedAvatar);
      }


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
      <View className="bg-white mt-6 px-6">
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
      <View className=" flex-1 bg-white rounded-2xl p-4 m-2"
      >
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
    </SafeAreaView>
  );
}
