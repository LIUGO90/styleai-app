import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
    Alert,
} from "react-native";
import { Image } from "expo-image";
import DotsContainer from "@/components/dotsContainer";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const path = "../../../../assets/onboarding"
const SKIN_TONE_OPTIONS = [
    {
        id: "fair",
        label: "Fair",
        color: "#FFEADF",
        description: "Fair skin tone",
    },
    {
        id: "light",
        label: "Light",
        color: "#F1D1AC",
        description: "Light skin tone",
    },
    {
        id: "medium",
        label: "Medium",
        color: "#D9AC7E",
        description: "Medium skin tone",
    },
    {
        id: "tan",
        label: "Tan",
        color: "#AE725B",
        description: "Tan skin tone",
    },
    {
        id: "dark",
        label: "Dark",
        color: "#6B3C2C",
        description: "Dark skin tone",
    },
    {
        id: "deep-dark",
        label: "Deep Dark",
        color: "#3F2414",
        description: "Deep dark skin tone",
    },
];
// 体型选项数据
const BODY_TYPE_OPTIONS = [
    {
        id: "Hourglass",
        label: "Hourglass",
        image: require(path + "/BodyType/hourglass.jpeg"),
    },
    {
        id: "Pear",
        label: "Pear",
        image: require(path + "/BodyType/pear.jpeg"),
    },
    {
        id: "Triangle",
        label: "Triangle",
        image: require(path + "/BodyType/triangle.jpeg"),
    },
    {
        id: "Inverted Triangle",
        label: "Inverted",
        image: require(path + "/BodyType/invertedTriangle.jpeg"),
    },
    {
        id: "Rectangle",
        label: "Rectangle",
        image: require(path + "/BodyType/rectangle.jpeg"),
    },
    {
        id: "Apple",
        label: "Apple",
        image: require(path + "/BodyType/apple.jpeg"),
    },
];

// 身体量感结构选项数据
const BODY_STRUCTURE_OPTIONS = [
    {
        id: "Petite",
        label: "Petite",
        image: require(path + "/BodyStructure/petite.jpeg"),
    },
    {
        id: "Slim",
        label: "Slim",
        image: require(path + "/BodyStructure/slim.jpeg"),
    },
    {
        id: "Average",
        label: "Average",
        image: require(path + "/BodyStructure/average.jpeg"),
    },
    {
        id: "Chubby",
        label: "Chubby",
        image: require(path + "/BodyStructure/chubby.jpeg"),
    },
    // {
    //   id: "Plus-size",
    //   label: "Plus-size",
    //   image: require(path + "/BodyStructure/plus.jpeg"),
    // },
];


export default function PhysicalProfile() {
    const router = useRouter();
    const [selectedSkinTone, setSelectedSkinTone] = useState<string | null>(null);
    const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
    const [selectedBodyStructure, setSelectedBodyStructure] = useState<string | null>(null);


    useEffect(() => {
        const loadOnboardingData = async () => {
            const onboardingData = await AsyncStorage.getItem("onboardingData");
            if (onboardingData) {
                const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
                setSelectedSkinTone(onboardingDataObj.skinTone);
                setSelectedBodyType(onboardingDataObj.bodyType);
                setSelectedBodyStructure(onboardingDataObj.bodyStructure);
            } else {
                setSelectedSkinTone(null);
                setSelectedBodyType(null);
                setSelectedBodyStructure(null);
            }
        };
        loadOnboardingData();
    }, []);

    const handleNext = async () => {
        if (selectedSkinTone && selectedBodyType && selectedBodyStructure) {
            const onboardingData = await AsyncStorage.getItem("onboardingData");
            if (onboardingData) {
                const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
                onboardingDataObj.skinTone = selectedSkinTone;
                onboardingDataObj.bodyType = selectedBodyType;
                onboardingDataObj.bodyStructure = selectedBodyStructure;
                await AsyncStorage.setItem(
                    "onboardingData",
                    JSON.stringify(onboardingDataObj),
                );
            }
            router.replace("/tabs/my");
        }
    };
    return (
        <SafeAreaView edges={["top"]} className="flex-1 bg-white">
            {/* 背景图片 */}
            <Image
                source={require("../../../../assets/background.png")}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory-disk"
            />
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
                <Text className="text-xl font-bold text-gray-800 flex-1 text-center">Physical Profile</Text>

            </View>

            <ScrollView className="flex-1 px-8"  >
                {/* 内容层 */}

                <View className="flex-1 ">
                    <View className="flex-1 justify-center my-2">
                        <Text className="text-2xl font-bold text-start mb-2 text-black">
                            Skin Tone
                        </Text>
                        {/* 肤色选择 */}
                        <View className="">
                            <View className="flex-row flex-wrap justify-between ">
                                {SKIN_TONE_OPTIONS.map((option) => (
                                    <Pressable
                                        key={option.id}
                                        onPress={() => setSelectedSkinTone(option.id)}
                                        className={`items-center w-[15%]`}
                                    >
                                        <View
                                            style={{
                                                width: "100%",
                                                aspectRatio: 1 / 1,
                                                backgroundColor: option.color,
                                                borderRadius: 30,
                                                borderWidth: 2,
                                                borderColor:
                                                    selectedSkinTone === option.id
                                                        ? "#FF6036"
                                                        : "#e5e7eb",
                                            }}
                                        />
                                        <Text className="text-xs mt-1 text-center text-gray-600">
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                <View className="flex-1">
                    <View className="flex-1 justify-center my-2">
                        <Text className="text-2xl font-bold text-start mb-2 text-black">
                            Body Type
                        </Text>
                        {/* 肤色选择 */}
                        <View className="">
                            <View className="flex-row flex-wrap justify-between ">
                                {BODY_TYPE_OPTIONS.map((option, index) => (
                                    <Pressable
                                        key={option.id}
                                        onPress={() => setSelectedBodyType(option.id)}
                                        className={`items-center p-2 rounded-xl border-2 w-[30%] mb-3 ${selectedBodyType === option.id
                                            ? "border-orange-500 bg-orange-50"
                                            : "border-gray-200 bg-white"
                                            }`}
                                        style={{
                                            marginRight: (index + 1) % 3 === 0 ? 0 : "3.33%",
                                        }}
                                    >
                                        <View className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden items-center justify-center">
                                            <Image
                                                source={option.image}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                }}
                                                resizeMode="cover"
                                            />
                                        </View>
                                        <Text
                                            className={`text-xs mt-1 font-medium text-center ${selectedBodyType === option.id
                                                ? "text-orange-600"
                                                : "text-gray-700"
                                                }`}
                                        >
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                <View className="flex-1">
                    <View className="flex-1 justify-center my-2">
                        <Text className="text-2xl font-bold text-start mb-2 text-black">
                            Body Size
                        </Text>
                        {/* 肤色选择 */}
                        <View className="">
                            <View className="flex-row flex-wrap justify-between gap-2">
                                {BODY_STRUCTURE_OPTIONS.map((option, index) => (
                                    <Pressable
                                        key={option.id}
                                        onPress={() => setSelectedBodyStructure(option.id)}
                                        className={`items-center p-2 rounded-xl border-2 w-[46%] mb-3 ${selectedBodyStructure === option.id
                                            ? "border-orange-500 bg-orange-50"
                                            : "border-gray-200 bg-white"
                                            }`}
                                    >

                                        <Image
                                            source={option.image}
                                            style={{
                                                width: "100%",
                                                aspectRatio: 1 / 1.2,
                                            }}
                                            resizeMode="cover"
                                        />

                                        <Text
                                            className={`text-xs mt-1 font-medium text-center ${selectedBodyStructure === option.id
                                                ? "text-blue-600"
                                                : "text-gray-700"
                                                }`}
                                        >
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* 底部部分 */}
            <View className="p-5">
                <View className="flex-col">
                    <Pressable
                        onPress={handleNext}
                        className={`p-4 rounded-full ${selectedSkinTone ? "bg-black" : "bg-gray-300"}`}
                        disabled={false}
                    >
                        <Text className={`text-center font-medium text-white`}>Save</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}