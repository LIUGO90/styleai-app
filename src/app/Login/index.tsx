import { AppleAuth } from "@/components/Auth";
import { GuestGuard } from "@/components/AuthGuard";
import { View, Text, Dimensions, ScrollView } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import OptimizedRenderMessage from "@/components/OptimizedRenderMessage";
import { Message } from "@/components/types";
import { cn } from "@/utils/cn";
import { ImagePerformanceMonitor } from "@/components/ImagePerformanceMonitor";
import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const initMessages: Message[] = [
  {
    id: "1",
    text: "Style these wide-leg pants for me.",
    sender: "user",
    timestamp: new Date(),
    showAvatars: false,
  },
  {
    id: "2",
    sender: "user",
    images: [
      {
        id: "1",
        url: require("../../../assets/onboarding/zero/messages-1.png"),
      },
      {
        id: "2",
        url: require("../../../assets/onboarding/zero/messages-2.png"),
      },
    ],
    text: "",
    timestamp: new Date(),
    showAvatars: false,
  },
  {
    id: "3",
    text: "Here are three stylish ways:",
    sender: "system",
    timestamp: new Date(),
    showAvatars: false,
  },
  {
    id: "4",
    sender: "system",
    images: [
      {
        id: "1",
        url: require("../../../assets/onboarding/zero/messages-3.png"),
      },
      {
        id: "2",
        url: require("../../../assets/onboarding/zero/messages-4.png"),
      },
      {
        id: "3",
        url: require("../../../assets/onboarding/zero/messages-5.png"),
      },
    ],
    text: "",
    timestamp: new Date(),
    showAvatars: false,
  },
];

export default function Login() {
  return (
    <GuestGuard>
      <SafeAreaView className="flex-1 bg-white items-center">
        {/* <View className="mt-14">
                    <DotsContainer activeIndex={0} indexNumber={6} />
                </View> */}

        <ScrollView className="flex-1 bg-white">
          <View className="bg-white rounded-xl mx-5 my-2 max-w-[500px]">
            {initMessages.map((message) => (
              <OptimizedRenderMessage key={message.id} item={message} />
            ))}
          </View>

          <View className="flex-row justify-center items-center mx-5 my-2">
            <Text className="text-xl text-center font-bold">
              Unlock fresh outfits from your current wardrobe
            </Text>
          </View>

        </ScrollView>
          {/* 底部按钮 */}
          <View className="mb-10 mt-4">
            <View className="flex-col justify-between items-center gap-2">
              {/* <Pressable onPress={handleNext} className="px-24 py-3 justify-center items-center bg-white border-2 border-black rounded-full">
                                <Text className="text-black" style={{ fontSize: 16, fontWeight: '500' }}>Google Sign In</Text>
                            </Pressable> */}
              <View className="items-center">
                <AppleAuth />
              </View>
            </View>
          </View>
      </SafeAreaView>
    </GuestGuard>
  );
}
