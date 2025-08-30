import { Redirect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Google from 'expo-auth-session/providers/google';

export default function RootIndex() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkOnboardingStatus = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('onboardingData');
        console.log('Onboarding status:', jsonValue);
        
        if (isMounted) {
          setHasCompletedOnboarding(jsonValue !== null);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Error reading onboarding status:', e);
        if (isMounted) {
          setHasCompletedOnboarding(false);
          setIsLoading(false);
        }
      }
    };

    checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    console.log("Redirecting to onboarding");
    return <Redirect href="/onboarding" />;
  } else {
    console.log("Redirecting to styling");
    return <Redirect href="/tabs" />;
  }
}
