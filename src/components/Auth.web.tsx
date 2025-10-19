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
      console.log('🍎 开始 Apple 登录...');
      
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:8081/auth/callback';
      
      console.log('🔗 重定向 URL:', redirectUrl);
      
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

      console.log('📤 OAuth 响应:', { data, error });

      if (error) {
        console.error('❌ Apple Sign In Error:', error);
        Alert.alert('登录失败', error.message || '无法连接到 Apple 服务器');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Apple OAuth 请求成功');
      // OAuth 会自动重定向，不需要手动处理
      // 成功后会跳转到 /auth/callback 页面
      
    } catch (error: any) {
      console.error('❌ Apple Sign In Exception:', error);
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

