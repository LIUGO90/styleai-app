import { View, Pressable, Text, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';

/**
 * Web 平台的 Apple 登录组件
 * 使用 Supabase OAuth 流程
 */
export function AppleAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:8081/auth/callback';

      // Web 平台使用 Supabase OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          scopes: 'name email',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        Alert.alert('登录失败', error.message || '无法连接到 Apple 服务器');
        setIsLoading(false);
        return;
      }

      // OAuth 会自动重定向
    } catch (error: any) {
      Alert.alert('登录错误', error.message || '发生未知错误');
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleAppleSignIn}
      disabled={isLoading}
      style={{
        width: 290,
        height: 55,
        backgroundColor: '#000',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? (
        <>
          <ActivityIndicator color="white" size="small" />
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            正在跳转...
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 22 }}>🍎</Text>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            Sign in with Apple
          </Text>
        </>
      )}
    </Pressable>
  );
}

