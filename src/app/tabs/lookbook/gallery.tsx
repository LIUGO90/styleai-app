import { View, Text, ScrollView, Pressable, StyleSheet, Alert, RefreshControl, Modal, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { LookbookService, LookbookItem, LookbookCollection } from "@/services/LookbookService";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LookbookGallery() {
  const [collections, setCollections] = useState<LookbookCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LookbookItem | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // 加载相册数据
  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await LookbookService.getAllCollections();
      setCollections(data);
    } catch (error) {
      console.error('Failed to load collections:', error);
      Alert.alert('Error', 'Failed to load your lookbook collections');
    } finally {
      setLoading(false);
    }
  };

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollections();
    setRefreshing(false);
  };

  // 打开图片 modal
  const openImageModal = (item: LookbookItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // 关闭 modal
  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  // 删除相册项目
  const deleteItem = async (collectionId: string, itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this lookbook item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await LookbookService.deleteLookbookItem(collectionId, itemId);
              await loadCollections();
              // 如果删除的是当前 modal 中的项目，关闭 modal
              if (selectedItem && selectedItem.id === itemId) {
                closeImageModal();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const renderLookbookItem = (item: LookbookItem, collectionId: string) => (
    <Pressable
      key={item.id}
      onPress={() => openImageModal(item)}
      className="mb-4 bg-white rounded-xl shadow-sm border border-gray-200"
    >
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-black">{item.title || item.style}</Text>
            <Text className="text-sm text-gray-500">{item.description}</Text>
            <Text className="text-xs text-gray-400 mt-1">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              deleteItem(collectionId, item.id);
            }}
            className="p-2"
          >
            <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
          </Pressable>
        </View>

        {/* 图片网格 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {item.images.slice(0, 3).map((imageUrl, index) => (
              <View key={index} className="relative">
                <Image
                  source={{ uri: imageUrl }}
                  style={{
                    width: 100,
                    height: 180,
                    borderRadius: 8,
                  }}
                  contentFit="cover"
                />
                <View className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{index + 1}</Text>
                </View>
                {item.images.length > 3 && index === 2 && (
                  <View className="absolute inset-0 bg-opacity-50 rounded-lg items-center justify-center">
                    <Text className="text-white text-lg font-bold">+{item.images.length - 3}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Loading your lookbook...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-5">
          {collections.length > 0 && (
            <View className="flex-row justify-between items-center mb-6">
              {/* <Text className="text-xl font-bold text-black">My Lookbook</Text> */}
              <Pressable
                onPress={() => router.push('/tabs/lookbook/one')}
                className="bg-black rounded-full px-4 py-2"
              >
                <Text className="text-white font-semibold">Generate New</Text>
              </Pressable>
            </View>
          )}

          {collections.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <MaterialCommunityIcons name="image-outline" size={64} color="#9ca3af" />
              <Text className="text-xl font-semibold text-gray-500 mt-4">No Lookbooks Yet</Text>
              <Text className="text-gray-400 text-center mt-2">
                Generate your first personalized lookbook to get started
              </Text>
              <Pressable
                onPress={() => router.push('/tabs/lookbook/one')}
                className="bg-black rounded-full px-6 py-3 mt-6"
              >
                <Text className="text-white font-semibold">Create Lookbook</Text>
              </Pressable>
            </View>
          ) : (
            collections.map((collection) => (
              <View key={collection.id} className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-black">{collection.title}</Text>
                  <Text className="text-sm text-gray-500">
                    {collection.items.length} items
                  </Text>
                </View>

                {collection.items.length === 0 ? (
                  <View className="bg-white rounded-xl p-8 items-center">
                    <MaterialCommunityIcons name="image-outline" size={48} color="#9ca3af" />
                    <Text className="text-gray-500 mt-2">No items in this collection</Text>
                  </View>
                ) : (
                  collection.items.map((item) => renderLookbookItem(item, collection.id))
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 图片查看 Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View className="flex-1 bg-white bg-opacity-90">
          {/* 顶部导航栏 */}
          <View className="flex-row justify-between items-center p-4 pt-12">
            <Pressable onPress={closeImageModal} className="p-2">
              <MaterialCommunityIcons name="close" size={24} color="black" />
            </Pressable>
            <Text className="text-black text-lg font-semibold">
              {selectedItem?.title || selectedItem?.style}
            </Text>
            <View className="w-8" />
          </View>

          {/* 垂直滚动图片展示区域 */}
          <ScrollView
            className="flex-1 "
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          >
            {selectedItem && (
              <View className="flex-row flex-wrap justify-between">
                {selectedItem.images.map((imageUrl, index) => (
                  <View key={index} className="w-[48%] mb-4">
                    <View className="relative">
                      <Image
                        source={{ uri: imageUrl }}
                        style={{
                          width: '100%',
                          height: screenHeight * 0.4,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: 'gray',
                        }}
                        contentFit="cover"
                      />

                      {/* 图片编号 */}
                      <View className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full w-6 h-6 items-center justify-center">
                        <Text className="text-white text-xs font-bold">{index + 1}</Text>
                      </View>
                    </View>

                    {/* 图片描述 */}
                    <Text className="text-white text-center text-xs opacity-80 mt-2">
                      Outfit {index + 1}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
