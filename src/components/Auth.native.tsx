import { Platform, Alert, ActivityIndicator, View, Text } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { router } from "expo-router";
import { requestNetworkPermissionForLogin } from "@/utils/networkPermission";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "./types";
import { supabase } from "@/utils/supabase";

/**
 * 可靠的数据库查询函数 - 带重试机制
 * @param userId 用户ID
 * @param maxRetries 最大重试次数
 * @param timeout 单次查询超时时间(ms)
 */
async function fetchUserProfileWithRetry(
  userId: string,
  maxRetries: number = 3,
  timeout: number = 8000
): Promise<{ data: any; error: any }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('name, fullbodyphoto, images')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      const result = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (result.error) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        return result;
      }

      return result;

    } catch (error) {
      if (attempt < maxRetries) {
        const delay = 1000 * attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return { data: null, error };
      }
    }
  }

  return { data: null, error: new Error('Max retries exceeded') };
}

export function AppleAuth() {
  const { signInWithApple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleAppleSignIn = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Error", "Apple Sign In is only available on iOS");
      return;
    }

    // // 在登录前检查网络权限
    // const hasNetworkPermission = await requestNetworkPermissionForLogin();

    // if (!hasNetworkPermission) {
    //   // 用户拒绝或网络不可用，阻止登录

    //   return;
    // }

    setIsLoading(true);
    setLoadingMessage("Authenticating with Apple...");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });


      if (credential.identityToken) {

        // 传递完整的credential信息，包括email和fullName
        const { userId, error } = await signInWithApple(credential);

        if (error) {

          // 检查是否是网络错误
          if (error.message?.includes('Network') && error.message?.includes('fetch')) {
            Alert.alert(
              "Network Error",
              "Login failed, please check your network connection and try again.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Retry", onPress: handleAppleSignIn },
              ]
            );
          } else {
            Alert.alert(
              "Sign In Error",
              error.message || "Failed to sign in with Apple",
            );
          }
        } else {
          const onboardingDataStr = await AsyncStorage.getItem("onboardingData");

          if (!onboardingDataStr) {
            // 新用户：需要创建数据并查询远程配置
            setLoadingMessage("Loading data...");

            const onboardingData: OnboardingData = {
              userId: userId || "",
              stylePreferences: [],
              fullBodyPhoto: "",
              skinTone: "fair",
              bodyType: "Hourglass",
              bodyStructure: "Petite",
              faceShape: "oval",
              selectedStyles: [],
              gender: ""
            };
            await AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingData));

            // 使用重试机制查询远程配置（最多重试3次，每次8秒超时）
            const { data: userProfile, error } = await fetchUserProfileWithRetry(userId || "", 3, 8000);

            if (error) {
              Alert.alert(
                "Network Connection Problem",
                "Cannot load your configuration information, please check your network connection.\n\nYou can:\n1. Retry connection\n2. Continue using (need to re-set)",
                [
                  {
                    text: "Retry",
                    onPress: () => handleAppleSignIn(),
                  },
                  {
                    text: "Continue",
                    onPress: () => {
                      router.replace("/onboarding");
                    },
                  },
                ]
              );
              return;
            }

            // 成功获取配置，处理数据
            if (userProfile?.fullbodyphoto && userProfile.fullbodyphoto.length > 0) {
              onboardingData.fullBodyPhoto = userProfile.fullbodyphoto;
              await AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingData));

              if (userProfile?.images && userProfile.images.length > 0) {
                await AsyncStorage.setItem("newlook",userProfile.images);
                router.replace("/");
              } else {
                router.replace("/onboarding");
              }
            } else {
              router.replace("/onboarding");
            }
          } else {
            // 老用户：已有本地数据
            try {
              const onboardingData = JSON.parse(onboardingDataStr);

              // 检查本地数据完整性
              if (!onboardingData.userId || !onboardingData.fullBodyPhoto) {
                throw new Error("Incomplete local data");
              }

              // 老用户直接进入主页
              router.replace("/");

              // 后台同步远程数据（不阻塞登录）
              setLoadingMessage("Loading data...");
              fetchUserProfileWithRetry(userId || "", 2, 5000)
                .then(({ data }) => {
                  if (data?.images && data.images.length > 0) {
                    AsyncStorage.setItem("newlook", data.images);
                  }
                  if (data?.fullbodyphoto) {
                    onboardingData.fullBodyPhoto = data.fullbodyphoto;
                    AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingData));
                  }
                })
                .catch(() => {
                  // 后台同步失败，不影响使用
                });

            } catch (parseError) {
              // 本地数据损坏，重新查询
              setLoadingMessage("Loading data...");

              const { data: userProfile, error } = await fetchUserProfileWithRetry(userId || "", 3, 8000);

              if (error || !userProfile) {
                Alert.alert(
                  "Data Error",
                  "Local data is corrupted and cannot connect to the server, do you want to re-guide?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Re-guide",
                      onPress: () => {
                        // 清除损坏的数据
                        AsyncStorage.removeItem("onboardingData");
                        router.replace("/onboarding");
                      }
                    },
                  ]
                );
              } else {
                // 修复数据后进入
                const newData: OnboardingData = {
                  userId: userId || "",
                  stylePreferences: [],
                  fullBodyPhoto: userProfile.fullbodyphoto || "",
                  skinTone: "fair",
                  bodyType: "Hourglass",
                  bodyStructure: "Petite",
                  faceShape: "oval",
                  selectedStyles: [],
                  gender: ""
                };
                await AsyncStorage.setItem("onboardingData", JSON.stringify(newData));
                if (userProfile.images) {
                  await AsyncStorage.setItem("newlook", userProfile.images);
                }
                router.replace("/");
              }
            }
          }
        }
      } else {
        throw new Error("No identityToken received from Apple");
      }
    } catch (e: any) {
      console.error("Apple authentication error:", e);

      if (e.code === "ERR_REQUEST_CANCELED") {
        // User canceled the sign-in flow

      } else {
        Alert.alert(
          "Authentication Error",
          e.message || "An error occurred during authentication",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (Platform.OS === "ios") {
    return (
      <>
        {isLoading && loadingMessage ? (
          <View style={{
            width: 290,
            height: 55,
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            gap: 10
          }}>
            <ActivityIndicator color="white" />
            <Text style={{ color: 'white', fontSize: 14 }}>{loadingMessage}</Text>
          </View>
        ) : (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={30}
            style={{ width: 290, height: 55 }}
            onPress={handleAppleSignIn}
          />
        )}
      </>
    );
  }

  return <>{/* Implement Android Auth options. */}</>;
}
