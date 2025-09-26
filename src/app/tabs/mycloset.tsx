import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { useLocalSearchParams } from "expo-router";

export default function LookbookOne() {
  const [selectedStyles, setSelectedStyles] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // 接收传递的参数
  // const params = useLocalSearchParams();

  // // 打印接收到的参数
  // useEffect(() => {
  //     console.log("Received params:", params);
  //     setSelectedStyles("")
  // }, [params.userId]);

  const STYLE_OPTIONS = [
    {
      id: "white_shirt",
      name: "white_shirt",
      url: require("../../../assets/Top/01_white_shirt.webp"),
    },
    {
      id: "stripped_tank_top",
      name: "stripped_tank_top",
      url: require("../../../assets/Top/02_stripped_tank_top.jpg"),
    },
    {
      id: "black_tank_top",
      name: "black_tank_top",
      url: require("../../../assets/Top/03_polo_shirt.jpg"),
    },
    {
      id: "stripped_button_up_shirt_2",
      name: "stripped_button_up_shirt_2",
      url: require("../../../assets/Top/04_stripped_button_up_shirt_2.jpg"),
    },
    {
      id: "stripped_knit_top",
      name: "stripped_knit_top",
      url: require("../../../assets/Top/05_stripped_knit_top.jpg"),
    },
    {
      id: "printed_shirt",
      name: "printed_shirt",
      url: require("../../../assets/Top/06_printed_shirt.jpg"),
    },
    {
      id: "green_blouse",
      name: "green_blouse",
      url: require("../../../assets/Top/07_green_blouse.jpg"),
    },
    {
      id: "stripped_button_up_shirt",
      name: "stripped_button_up_shirt",
      url: require("../../../assets/Top/08_stripped_button_up_shirt.png"),
    },
    {
      id: "white_blouse",
      name: "white_blouse",
      url: require("../../../assets/Top/09_white_blouse.jpg"),
    },
    {
      id: "yellow_sleeveless_top",
      name: "yellow_sleeveless_top",
      url: require("../../../assets/Top/10_yellow_sleeveless_top.jpg"),
    },
    {
      id: "floral_shirt",
      name: "floral_shirt",
      url: require("../../../assets/Top/11_floral_shirt.jpg"),
    },
    {
      id: "ivory_vest",
      name: "ivory_vest",
      url: require("../../../assets/Top/12_ivory_vest.webp"),
    },
    {
      id: "black_camisole",
      name: "black_camisole",
      url: require("../../../assets/Top/13_black_camisole.jpg"),
    },
  ];

  const handleStyleToggle = (styleId: string) => {
    const selectedStyle = STYLE_OPTIONS.find(style => style.id === styleId);
    if (selectedStyle) {
      setSelectedItem(selectedStyle);
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleNext = async () => { };

  return (
    <View className="flex-1 bg-white px-5">
      {/* <View className="flex-1 p-5 ">
        <Text className="text-base font-bold text-start  text-black">
          My Closet
        </Text>
      </View> */}
      <Pressable
        onPress={() => handleStyleToggle("white_shirt")}
        className="bg-gray-200 rounded-full w-full h-12 items-center justify-center shadow-lg my-5"
      >
        <Text className="">+ Add to Closet</Text>
      </Pressable>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="p-5"
      >
        {/* 风格选择网格 */}
        <View className="flex-row flex-wrap justify-between ">
          {STYLE_OPTIONS.map((style) => {
            const isSelected = selectedStyles === style.id;
            return (
              <Pressable
                key={style.id}
                onPress={() => handleStyleToggle(style.id)}
                className={`w-[48%] mb-4 rounded-xl border-2 overflow-hidden ${isSelected ? "border-red-500" : "border-gray-200"
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

      {/* 底部弹窗 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={closeModal}
        >
          <View
            className="bg-white border-t-2 border-gray-200 rounded-t-3xl max-h-[80%] min-h-[300]"
          >
            {/* 下拉指示器 */}
            <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />

            {/* 弹窗内容 */}
            <View className="mt-5 items-center">
              {selectedItem && (
                <Image
                  source={selectedItem.url}
                  style={{
                    width: 200,
                    height: 280,
                    borderRadius: 10,
                    marginBottom: 15,
                  }}
                  contentFit="cover"
                />
              )}
            </View>

            {/* 弹窗底部按钮 */}
            <View className="flex-col gap-2 justify-center items-center mb-10 ">
              <Pressable
                onPress={() => {
                  console.log('Style item:', selectedItem?.id);
                  closeModal();
                }}
                className="bg-black py-3 my-1 w-[50%] rounded-xl items-center justify-center"
              >
                <Text className="font-semibold text-lg text-white">
                  Style this item
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  console.log('Delete item:', selectedItem?.id);
                  closeModal();
                }}
                className="bg-red-50 border border-red-200 py-3 my-1 w-[50%] rounded-xl items-center justify-center"
              >
                <Text className="font-semibold text-lg" style={{ color: '#dc2626' }}>
                  Delete this item
                </Text>
              </Pressable>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
