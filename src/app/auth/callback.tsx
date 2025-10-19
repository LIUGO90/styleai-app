import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingData } from '@/components/types';

/**
 * OAuth 回调处理页面
 * 处理 Apple Sign In 的重定向
 */
export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('正在验证登录信息...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // 获取当前会话
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ 获取会话失败:', error);
        setStatus('登录失败，即将返回...');
        setTimeout(() => router.replace('/Login'), 2000);
        return;
      }

      if (!session) {
        console.log('⚠️ 未找到会话');
        setStatus('未找到登录信息，即将返回...');
        setTimeout(() => router.replace('/Login'), 2000);
        return;
      }

      console.log('✅ 登录成功:', session.user.id);
      setStatus('登录成功，正在加载配置...');

      // 检查是否已有本地数据
      const onboardingDataStr = await AsyncStorage.getItem('onboardingData');
      
      if (!onboardingDataStr) {
        // 新用户：创建默认数据
        const onboardingData: OnboardingData = {
          userId: session.user.id,
          stylePreferences: [],
          fullBodyPhoto: '',
          skinTone: 'fair',
          bodyType: 'Hourglass',
          bodyStructure: 'Petite',
          faceShape: 'oval',
          selectedStyles: [],
          gender: ''
        };
        await AsyncStorage.setItem('onboardingData', JSON.stringify(onboardingData));

        // 查询用户配置
        try {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('name, fullbodyphoto, images')
            .eq('id', session.user.id)
            .single();

          if (userProfile?.fullbodyphoto) {
            onboardingData.fullBodyPhoto = userProfile.fullbodyphoto;
            await AsyncStorage.setItem('onboardingData', JSON.stringify(onboardingData));
            
            if (userProfile?.images) {
              await AsyncStorage.setItem('newlook', JSON.stringify(userProfile.images));
              router.replace('/');
              return;
            }
          }
        } catch (err) {
          console.warn('⚠️ 查询用户配置失败:', err);
        }

        // 新用户进入引导流程
        router.replace('/onboarding');
      } else {
        // 老用户直接进入主页
        router.replace('/');
      }

    } catch (error) {
      console.error('❌ 处理回调失败:', error);
      setStatus('处理登录信息失败');
      setTimeout(() => router.replace('/Login'), 2000);
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#fff'
    }}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={{ 
        marginTop: 20, 
        fontSize: 16,
        color: '#666'
      }}>
        {status}
      </Text>
    </View>
  );
}

