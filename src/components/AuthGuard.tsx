import React, { ReactNode } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children?: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  redirectTo = "/Login",
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      fallback || (
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-4 text-gray-600">Loading...</Text>
        </View>
      )
    );
  }

  if (!user) {
    return <Redirect href={redirectTo} />;
  }

  return <>{children}</>;
};

interface GuestGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const GuestGuard: React.FC<GuestGuardProps> = ({
  children,
  fallback,
  redirectTo = "/",
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      fallback || (
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-4 text-gray-600">Loading...</Text>
        </View>
      )
    );
  }

  // if (user) {

  //   return <Redirect href={redirectTo} />;
  // }

  return <>{children}</>;
};
