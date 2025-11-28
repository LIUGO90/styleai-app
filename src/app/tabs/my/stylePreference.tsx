import { OnboardingData } from "@/components/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

const path = "../../../../assets/onboarding"

const STYLE_OPTIONS = [
    {
        id: "Casual",
        name: "Casual",
        url: require(path + "/Style/Casual.png"),
    },
    {
        id: "Classy",
        name: "Classy",
        url: require(path + "/Style/Classy.jpg"),
    },
    {
        id: "Old Money",
        name: "Old Money",
        url: require(path + "/Style/OldMoney.png"),
    },
    {
        id: "Preppy",
        name: "Preppy",
        url: require(path + "/Style/Preppy.png"),
    },
    {
        id: "Coastal",
        name: "Coastal",
        url: require(path + "/Style/Coastal.png"),
    },
    {
        id: "Boho",
        name: "Boho",
        url: require(path + "/Style/Boho.png"),
    },
    {
        id: "Coquette",
        name: "Coquette",
        url: require(path + "/Style/Coquette.png"),
    },
    {
        id: "Edgy",
        name: "Edgy",
        url: require(path + "/Style/Edgy.png"),
    },
    {
        id: "Sporty",
        name: "Sporty",
        url: require(path + "/Style/Sporty.png"),
    },
    {
        id: "Streetstyle",
        name: "Streetstyle",
        url: require(path + "/Style/Streetstyle.png"),
    },
    {
        id: "Dopamine",
        name: "Dopamine",
        url: require(path + "/Style/Dopamine.png"),
    },
    {
        id: "Y2K",
        name: "Y2K",
        url: require(path + "/Style/Y2K.png"),
    },
];


export default function StylePreferenceScreen() {
    const router = useRouter();
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const [isUploading, setIsUploading] = useState<boolean>(false);

    useEffect(() => {
        const loadOnboardingData = async () => {
            const onboardingData = await AsyncStorage.getItem("onboardingData");
            if (onboardingData) {
                const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
                if (onboardingDataObj.selectedStyles.length !== 0) {
                    setSelectedStyles(onboardingDataObj.selectedStyles);
                }
            }
        };
        loadOnboardingData();
    }, []); // 添加空依赖数组，只在组件挂载时执行一次

    const handleStyleToggle = (styleId: string) => {
        setSelectedStyles((prev) => {
            if (prev.includes(styleId)) {
                return prev.filter((id) => id !== styleId);
            } else {
                return [...prev, styleId];
            }
        });
    };
    const handleNext = async () => {

        if (selectedStyles.length > 0) {
            setIsUploading(true);
            const onboardingData = await AsyncStorage.getItem("onboardingData");
            if (onboardingData) {
                const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
                onboardingDataObj.selectedStyles = selectedStyles;
                await AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingDataObj));
            }
        }
        router.replace("/tabs/my");
    };


    return (
        <SafeAreaView edges={["top"]} className="flex-1 bg-white">

            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-200 relative">
                <Pressable
                    onPress={() => {
                        router.replace("/tabs/my");
                    }}
                    className="absolute left-4"
                    style={{
                        zIndex: 10,
                        minWidth: 44,
                        minHeight: 44,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <MaterialCommunityIcons name="chevron-left" size={32} color="#000" />
                </Pressable>
                <Text className="text-xl font-bold text-gray-800 flex-1 text-center">Style Preference</Text>

            </View>
            <ScrollView>
                {/* 风格选择网格 */}
                <View className="flex-row flex-wrap justify-between px-8">
                    {STYLE_OPTIONS.map((style) => {
                        const isSelected = selectedStyles.includes(style.id);
                        return (
                            <Pressable
                                key={style.id}
                                onPress={() => handleStyleToggle(style.id)}
                                className={`w-[48%] max-w-[200px] mb-4 rounded-xl border-2 overflow-hidden ${isSelected
                                    ? "border-orange-500 bg-orange-50"
                                    : "border-gray-200 bg-white"
                                    }`}
                            >
                                {/* 图片容器 */}
                                <View className="relative bg-gray-100 items-center justify-center">
                                    <Image
                                        source={style.url}
                                        style={{
                                            width: "100%",
                                            maxWidth: 200,
                                            height: 280,
                                            flex: 1,
                                        }}
                                        contentFit="cover"
                                    />
                                    {/* 选中状态覆盖层 */}
                                    {isSelected && (
                                        <View className="absolute top-2 right-2">
                                            <View className="bg-orange-500 rounded-full w-8 h-8 items-center justify-center shadow-lg">
                                                <MaterialCommunityIcons
                                                    name="check"
                                                    size={20}
                                                    color="white"
                                                />
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* 风格名称 */}
                                <View className="p-3">
                                    <Text
                                        className={`text-sm font-medium text-center ${isSelected ? "text-orange-600" : "text-gray-700"
                                            }`}
                                    >
                                        {style.name}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
            <View className="p-5">
                <Pressable
                    onPress={handleNext}
                    className="py-4 px-6 rounded-full bg-black"
                >
                    <Text className="text-center font-semibold text-white text-lg">
                        Save
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
};