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
      console.log(`📡 尝试获取用户配置 (${attempt}/${maxRetries})...`);

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
        console.warn(`⚠️ 第 ${attempt} 次查询返回错误:`, result.error);
        if (attempt < maxRetries) {
          // 等待后重试（递增延迟）
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        return result;
      }

      console.log(`✅ 成功获取用户配置 (尝试 ${attempt} 次)`);
      return result;

    } catch (error) {
      console.warn(`⚠️ 第 ${attempt} 次查询失败:`, error);

      if (attempt < maxRetries) {
        // 等待后重试（递增延迟：1s, 2s, 3s）
        const delay = 1000 * attempt;
        console.log(`⏳ 等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // 所有重试都失败
        console.error(`❌ 查询失败，已重试 ${maxRetries} 次`);
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

    // 在登录前检查网络权限
    const hasNetworkPermission = await requestNetworkPermissionForLogin();

    if (!hasNetworkPermission) {
      // 用户拒绝或网络不可用，阻止登录

      return;
    }

    setIsLoading(true);
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

        console.log("🆔 User ID:", userId);

        if (error) {
          console.error("Apple sign in error:", error);

          // 检查是否是网络错误
          if (error.message?.includes('Network') || error.message?.includes('fetch')) {
            Alert.alert(
              "网络错误",
              "登录失败，请检查网络连接后重试。",
              [
                { text: "取消", style: "cancel" },
                { text: "重试", onPress: handleAppleSignIn },
              ]
            );
          } else {
            Alert.alert(
              "Sign In Error",
              error.message || "Failed to sign in with Apple",
            );
          }
        } else {
          console.log("🧐 用户登录成功 ", userId)

          const onboardingDataStr = await AsyncStorage.getItem("onboardingData");

          if (!onboardingDataStr) {
            // 新用户：需要创建数据并查询远程配置
            console.log("🆕 新用户登录");
            setLoadingMessage("正在加载您的配置...");

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
              // 查询失败后的处理
              console.error("❌ 无法获取用户配置:", error);

              Alert.alert(
                "网络连接问题",
                "无法加载您的配置信息，请检查网络连接。\n\n您可以：\n1. 重试连接\n2. 继续使用（需要重新设置）",
                [
                  {
                    text: "重试",
                    onPress: () => handleAppleSignIn(),
                  },
                  {
                    text: "继续",
                    onPress: () => {
                      // 允许用户继续，但需要重新引导
                      console.log("⚠️ 用户选择继续，跳转到引导页");
                      router.replace("/onboarding");
                    },
                  },
                ]
              );
              return;
            }

            // 成功获取配置，处理数据
            if (userProfile?.fullbodyphoto && userProfile.fullbodyphoto.length > 0) {
              console.log("✅ 用户已完成引导，有全身照");
              onboardingData.fullBodyPhoto = userProfile.fullbodyphoto;
              await AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingData));

              if (userProfile?.images && userProfile.images.length > 0) {
                console.log("✅ 用户有lookbook图片");
                await AsyncStorage.setItem("newlook",userProfile.images);
                router.replace("/");
              } else {
                router.replace("/onboarding");
              }
            } else {
              console.log("🎯 用户需要完成引导流程");
              router.replace("/onboarding");
            }
          } else {
            // 老用户：已有本地数据
            console.log("👤 老用户登录");

            try {
              const onboardingData = JSON.parse(onboardingDataStr);

              // 检查本地数据完整性
              if (!onboardingData.userId || !onboardingData.fullBodyPhoto) {
                console.warn("⚠️ 本地数据不完整，需要重新同步");
                throw new Error("Incomplete local data");
              }

              // 老用户直接进入主页（优先体验）
              console.log("✅ 老用户直接进入主页");
              router.replace("/");

              // 后台同步远程数据（不阻塞登录）
              setLoadingMessage("");
              fetchUserProfileWithRetry(userId || "", 2, 5000)
                .then(({ data }) => {
                  if (data?.images && data.images.length > 0) {
                    console.log("🔄 后台同步lookbook成功");
                    AsyncStorage.setItem("newlook", data.images);
                  }
                  if (data?.fullbodyphoto) {
                    onboardingData.fullBodyPhoto = data.fullbodyphoto;
                    AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingData));
                  }
                })
                .catch(err => {
                  console.warn("⚠️ 后台同步失败（不影响使用）:", err);
                });

            } catch (parseError) {
              // 本地数据损坏，重新查询
              console.error("❌ 本地数据损坏，重新查询:", parseError);
              setLoadingMessage("数据异常，正在修复...");

              const { data: userProfile, error } = await fetchUserProfileWithRetry(userId || "", 3, 8000);

              if (error || !userProfile) {
                Alert.alert(
                  "数据异常",
                  "本地数据损坏且无法连接服务器，是否重新引导？",
                  [
                    { text: "取消", style: "cancel" },
                    {
                      text: "重新引导",
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
