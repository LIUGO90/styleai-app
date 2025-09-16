import React from "react";
import { View, Text, ScrollView, Pressable, Image, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

export default function MyProfile() {
  const router = useRouter();
  const { user, signOut, session, clearAllUserData } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // 调试：打印用户信息
  React.useEffect(() => {
    console.log("User Profile - Current user data:", {
      user: user,
      userMetadata: user?.user_metadata,
      email: user?.email,
      id: user?.id,
      created_at: user?.created_at,
    });
  }, [user]);

  const email = user?.user_metadata?.email || user?.email || "No email";
  // 从认证用户数据获取信息
  const userData = {
    name:
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      email?.split("@")[0] ||
      "User",
    email: user?.user_metadata?.email || user?.email || "No email",
    avatar:
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture ||
      "https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U",
    memberSince: user?.created_at
      ? new Date(user.created_at).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "Recently",
    provider:
      user?.user_metadata?.provider || user?.app_metadata?.provider || "Email",
    userId: user?.id || "Unknown",
    isVerified: user?.email_confirmed_at ? true : false,
    stylePreferences: ["Casual", "Classy", "Boho"],
    outfitsCreated: 24,
    itemsInWardrobe: 156,
    favoriteColors: ["Navy Blue", "Emerald Green", "Coral"],
  };

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
      id: "profile",
      title: "Edit Profile",
      icon: "account-edit" as const,
      color: "#3b82f6",
      onPress: () => console.log("Edit Profile"),
    },
    {
      id: "wardrobe",
      title: "My Wardrobe",
      icon: "hanger" as const,
      color: "#10b981",
      onPress: () => console.log("My Wardrobe"),
    },
    {
      id: "outfits",
      title: "Saved Outfits",
      icon: "heart" as const,
      color: "#ef4444",
      onPress: () => console.log("Saved Outfits"),
    },
    {
      id: "preferences",
      title: "Style Preferences",
      icon: "palette" as const,
      color: "#8b5cf6",
      onPress: () => router.replace("/onboarding/BaseOne"),
    },
    {
      id: "settings",
      title: "Settings",
      icon: "cog" as const,
      color: "#6b7280",
      onPress: () => console.log("Settings"),
    },
    {
      id: "help",
      title: "Help & Support",
      icon: "help-circle" as const,
      color: "#f59e0b",
      onPress: () => console.log("Help & Support"),
    },
    {
      id: "clearData",
      title: "Clear All Data",
      icon: "delete-sweep" as const,
      color: "#dc2626",
      onPress: clearAllData,
    },
  ];

  const refreshUserInfo = async () => {
    setRefreshing(true);
    try {
      // 这里可以添加刷新用户信息的逻辑
      console.log("Refreshing user information...");
      // 模拟刷新延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error refreshing user info:", error);
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
          <View className="flex-row items-center justify-between mb-6">
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
                  color={refreshing ? "#9ca3af" : "#6b7280"}
                />
              </Pressable>
              <Pressable className="p-2">
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={24}
                  color="#6b7280"
                />
              </Pressable>
            </View>
          </View>

          {/* User Info Card */}
          <View
            style={{
              backgroundColor: "#3b82f6",
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <View className="flex-row items-center">
              <Image
                source={{ uri: userData.avatar }}
                className="w-16 h-16 rounded-full mr-4"
              />
              <View className="flex-1">
                <Text className="text-white text-xl font-bold mb-1">
                  {userData.name}
                </Text>
                <Text className="text-blue-100 text-sm mb-1">
                  {userData.email}
                </Text>
                <Text className="text-blue-100 text-xs">
                  Member since {userData.memberSince}
                </Text>
                <Text className="text-blue-100 text-xs">
                  Signed in with {userData.provider}
                </Text>
                {userData.isVerified && (
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
                )}
              </View>
              <Pressable className="p-2">
                <MaterialCommunityIcons name="pencil" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row space-x-4">
            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#f3f4f6",
              }}
            >
              <View className="flex-row items-center mb-2">
                <MaterialCommunityIcons
                  name="tshirt-crew"
                  size={20}
                  color="#3b82f6"
                />
                <Text className="text-gray-600 text-sm ml-2">Outfits</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800">
                {userData.outfitsCreated}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#f3f4f6",
              }}
            >
              <View className="flex-row items-center mb-2">
                <MaterialCommunityIcons
                  name="hanger"
                  size={20}
                  color="#10b981"
                />
                <Text className="text-gray-600 text-sm ml-2">Items</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800">
                {userData.itemsInWardrobe}
              </Text>
            </View>
          </View>
        </View>

        {/* Debug Info - Only in development */}
        {__DEV__ && user && (
          <View
            style={{
              backgroundColor: "#f3f4f6",
              marginHorizontal: 20,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Debug Info (Development Only)
            </Text>
            <View className="space-y-2">
              <Text className="text-sm text-gray-600">
                <Text className="font-medium">User ID:</Text> {userData.userId}
              </Text>
              <Text className="text-sm text-gray-600">
                <Text className="font-medium">Provider:</Text>{" "}
                {userData.provider}
              </Text>
              <Text className="text-sm text-gray-600">
                <Text className="font-medium">Email Verified:</Text>{" "}
                {userData.isVerified ? "Yes" : "No"}
              </Text>
              <Text className="text-sm text-gray-600">
                <Text className="font-medium">Created At:</Text>{" "}
                {user?.created_at || "Unknown"}
              </Text>
              {user?.user_metadata && (
                <Text className="text-sm text-gray-600">
                  <Text className="font-medium">Metadata:</Text>{" "}
                  {JSON.stringify(user.user_metadata, null, 2)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Style Preferences */}
        <View
          style={{
            backgroundColor: "white",
            marginHorizontal: 20,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Style Preferences
          </Text>
          <View className="flex-row flex-wrap">
            {userData.stylePreferences.map((style, index) => (
              <View
                key={index}
                className="bg-blue-100 rounded-full px-4 py-2 mr-2 mb-2"
              >
                <Text className="text-blue-600 text-sm font-medium">
                  {style}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Favorite Colors */}
        <View
          style={{
            backgroundColor: "white",
            marginHorizontal: 20,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Favorite Colors
          </Text>
          <View className="flex-row space-x-3">
            {userData.favoriteColors.map((color, index) => (
              <View key={index} className="flex-1 items-center">
                <View
                  className="w-12 h-12 rounded-full mb-2"
                  style={{
                    backgroundColor:
                      color === "Navy Blue"
                        ? "#1e3a8a"
                        : color === "Emerald Green"
                          ? "#059669"
                          : "#f97316",
                  }}
                />
                <Text className="text-xs text-gray-600 text-center">
                  {color}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View
          style={{
            backgroundColor: "white",
            marginHorizontal: 20,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Settings & Preferences
          </Text>
          <View className="space-y-2">
            {menuItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={item.onPress}
                className="flex-row items-center p-4 rounded-xl bg-gray-50"
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
