import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import DottomPicker from "./DottomPicker";
import { useLocalSearchParams } from "expo-router";

export default function LookbookOne() {
  const [selectedStyles, setSelectedStyles] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);

  // 接收传递的参数
  // const params = useLocalSearchParams();

  // // 打印接收到的参数
  // useEffect(() => {
  //     console.log("Received params:", params);
  //     setSelectedStyles("")
  // }, [params.userId]);

  const STYLE_OPTIONS = [
    {
      id: "Casual",
      name: "Casual",
      url: require("../../../../assets/onboarding/Style/Casual.png"),
    },
    {
      id: "Classy",
      name: "Classy",
      url: require("../../../../assets/onboarding/Style/Classy.jpg"),
    },
    {
      id: "Old Money",
      name: "Old Money",
      url: require("../../../../assets/onboarding/Style/OldMoney.png"),
    },
    {
      id: "Preppy",
      name: "Preppy",
      url: require("../../../../assets/onboarding/Style/Preppy.png"),
    },
    {
      id: "Coastal",
      name: "Coastal",
      url: require("../../../../assets/onboarding/Style/Coastal.png"),
    },
    {
      id: "Boho",
      name: "Boho",
      url: require("../../../../assets/onboarding/Style/Boho.png"),
    },
    {
      id: "Coquette",
      name: "Coquette",
      url: require("../../../../assets/onboarding/Style/Coquette.png"),
    },
    {
      id: "Edgy",
      name: "Edgy",
      url: require("../../../../assets/onboarding/Style/Edgy.png"),
    },
    {
      id: "Sporty",
      name: "Sporty",
      url: require("../../../../assets/onboarding/Style/Sporty.png"),
    },
    {
      id: "Streetstyle",
      name: "Streetstyle",
      url: require("../../../../assets/onboarding/Style/Streetstyle.png"),
    },
    {
      id: "Dopamine",
      name: "Dopamine",
      url: require("../../../../assets/onboarding/Style/Dopamine.png"),
    },
    {
      id: "Y2K",
      name: "Y2K",
      url: require("../../../../assets/onboarding/Style/Y2K.png"),
    },
  ];

  const MODEL_OPTIONS = [
    { id: "1", url: require("../../../../assets/onboarding/model/1.png") },
    { id: "2", url: require("../../../../assets/onboarding/model/2.png") },
    { id: "3", url: require("../../../../assets/onboarding/model/3.png") },
  ];

  const handleStyleToggle = (styleId: string) => {
    setSelectedStyles(styleId);
    setModalVisible(true);
  };

  const handleNext = async () => {};

  return (
    <View className="flex-1 bg-white px-5">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View className="flex-1 p-2 ">
          <Text className="text-xl font-bold text-start  text-black">
            Select a style and generate persoanlized lookbook.
          </Text>
        </View>

        {/* 风格选择网格 */}
        <View className="flex-row flex-wrap justify-between ">
          {STYLE_OPTIONS.map((style) => {
            const isSelected = selectedStyles === style.id;
            return (
              <Pressable
                key={style.id}
                onPress={() => handleStyleToggle(style.id)}
                className={`w-[48%] mb-4 rounded-xl border-2 overflow-hidden ${
                  isSelected ? "border-red-500" : "border-gray-200"
                }`}
              >
                {/* 图片容器 */}
                <View className="relative bg-gray-100 items-center justify-center ">
                  <Image
                    source={style.url}
                    style={{
                      width: "100%",
                      height: 280,
                      flex: 1,
                    }}
                    contentFit="cover"
                  />

                  {/* 水印 */}
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="bg-opacity-60 rounded-lg px-3 py-1">
                      <Text className="text-white text-3xl font-bold text-center">
                        {style.name}
                      </Text>
                      <Text className="text-white text-sm font-bold text-center">
                        10 outfits
                      </Text>
                    </View>
                  </View>

                  {/* 选中状态覆盖层 */}
                  {isSelected && (
                    <View className="absolute top-2 right-2">
                      <View className="bg-red-500 rounded-full w-8 h-8 items-center justify-center shadow-lg">
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color="white"
                        />
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <DottomPicker
        isVisible={modalVisible}
        onClose={() => {
          setSelectedStyles("");
          setModalVisible(false);
        }}
      >
        <View className="p-5 mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 30,
            }}
            style={{
              marginHorizontal: -20,
            }}
          >
            {MODEL_OPTIONS.map((image, index) => {
              return (
                <View
                  key={image.id}
                  className="relative mr-4"
                  style={{
                    width: 120,
                    height: 260,
                  }}
                >
                  {/* 图片容器 */}
                  <View
                    className="rounded-xl overflow-hidden shadow-md"
                    style={{
                      width: "100%",
                      height: "100%",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={image.url}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View className="flex-row space-x-4 mt-5">
            <Pressable
              onPress={handleNext}
              className={`flex-1 py-3 px-6 rounded-full ${
                selectedStyles.length > 0 ? "bg-black" : "bg-gray-300"
              }`}
              disabled={selectedStyles.length === 0}
            >
              <Text
                className={`text-center text-base font-extrabold text-white`}
              >
                Generate My Magic Look
              </Text>
            </Pressable>
          </View>
        </View>
      </DottomPicker>
    </View>
  );
}
