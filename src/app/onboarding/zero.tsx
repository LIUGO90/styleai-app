import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import DotsContainer from '@/components/dotsContainer';
import OptimizedRenderMessage from '@/components/OptimizedRenderMessage';
import { Message } from '@/components/types';
import { cn } from '@/utils/cn';
import { ImagePerformanceMonitor } from '@/components/ImagePerformanceMonitor';
import { OnboardingData } from '@/components/types';
import AsyncStorage from '@react-native-async-storage/async-storage';


const initMessages: Message[] = [
  {
    id: '1',
    text: 'Style these wide-leg pants for me.',
    sender: 'user',
    timestamp: new Date(),
    showAvatars: false,
  },
  {
    id: '2',
    sender: 'user',
    images: [{
      id: '1',
      url: require("../../../assets/onboarding/zero/messages-1.png"),
    }, {
      id: '2',
      url: require("../../../assets/onboarding/zero/messages-2.png"),
    }],
    text: '',
    timestamp: new Date(),
    showAvatars: false,
  },
  {
    id: '3',
    text: "Here are three stylish ways:",
    sender: 'system',
    timestamp: new Date(),
    showAvatars: false,
  },
  {
    id: '4',
    sender: 'system',
    images: [{
      id: '1',
      url: require("../../../assets/onboarding/zero/messages-3.png"),
    }, {
      id: '2',
      url: require("../../../assets/onboarding/zero/messages-4.png"),
    }, {
      id: '3',
      url: require("../../../assets/onboarding/zero/messages-5.png"),
    }],
    text: '',
    timestamp: new Date(),
    showAvatars: false,
  }
]

const { width, height } = Dimensions.get('window');

export default function OnboardingZero() {
  const router = useRouter();

  const handleSkip = async () => {
    try {
      // await AsyncStorage.setItem('my-onboarding', 'completed');
      router.replace('/tabs');
    } catch (e) {
      console.error('Error saving onboarding status:', e);
    }
  };

  const handleNext = () => {
    Alert.alert('模拟登录成功');
    const onboardingData: OnboardingData = {
      userId: '123',
      stylePreferences: [],
      fullBodyPhoto: '',
      skinTone: '',
      bodyType: '',
      bodyStructure: '',
      faceShape: '',
      selectedStyles: [],
    };
    AsyncStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    router.push('/onboarding/one');
  };

  return (
    <View style={styles.container}>
      {/* 性能监控组件 - 开发模式下显示 */}
      <ImagePerformanceMonitor visible={__DEV__} />

      <View className="mt-11">
        <DotsContainer activeIndex={0} indexNumber={6} />
      </View>
      
      <ScrollView style={styles.container}>


        <View className={cn(
          "bg-white rounded-xl mx-5 my-2",

        )}>
          {initMessages.map((message) => (
            <OptimizedRenderMessage key={message.id} item={message} />
          ))}
        </View>

        <View className="flex-row justify-center items-center mx-5 my-2">
          <Text className="text-xl text-center font-bold">
            Unlock fresh outfits from your current wardrobe
          </Text>
        </View>

        {/* 底部按钮 */}
        <View style={styles.bottomContainer}>
          <View style={styles.buttonContainer}>
            <Pressable onPress={handleNext} style={styles.googleButton} className="w-full justify-center items-center">
              <Text style={styles.googleButtonText}>Google Sign In</Text>
            </Pressable>
            <Pressable onPress={handleNext} style={styles.appleButton} className="w-full justify-center items-center">
              <Text style={styles.appleButtonText}>Apple Sign In</Text>
            </Pressable>
          </View>


        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  bottomContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    gap: 16
  },
  googleButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#000000',

  },
  googleButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  appleButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  appleButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});