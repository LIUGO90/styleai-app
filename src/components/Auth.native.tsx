import { Platform, Alert } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { router } from "expo-router";

export function AppleAuth() {
  const { signInWithApple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleSignIn = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Error", "Apple Sign In is only available on iOS");
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

      console.log("Apple credential:", credential);

      if (credential.identityToken) {
        // 传递完整的credential信息，包括email和fullName
        const { error } = await signInWithApple(credential);

        if (error) {
          console.error("Apple sign in error:", error);
          Alert.alert(
            "Sign In Error",
            error.message || "Failed to sign in with Apple",
          );
        } else {
          console.log("Successfully signed in with Apple");

          router.replace("/onboarding");
        }
      } else {
        throw new Error("No identityToken received from Apple");
      }
    } catch (e: any) {
      console.error("Apple authentication error:", e);

      if (e.code === "ERR_REQUEST_CANCELED") {
        // User canceled the sign-in flow
        console.log("User canceled Apple sign in");
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
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={30}
        style={{ width: 290, height: 55 }}
        onPress={handleAppleSignIn}
      />
    );
  }

  return <>{/* Implement Android Auth options. */}</>;
}
