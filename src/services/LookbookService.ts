import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LookbookItem {
  id: string;
  style: string;
  images: string[];
  createdAt: Date;
  userId: string;
  title?: string;
  description?: string;
}

export interface LookbookCollection {
  id: string;
  title: string;
  items: LookbookItem[];
  createdAt: Date;
  updatedAt: Date;
}

export class LookbookService {
  private static readonly LOOKBOOK_KEY = 'lookbook_collections';
  private static readonly CURRENT_COLLECTION_KEY = 'current_lookbook_collection';

  // 获取所有相册集合
  static async getAllCollections(): Promise<LookbookCollection[]> {
    try {
      const collectionsJson = await AsyncStorage.getItem(this.LOOKBOOK_KEY);
      if (collectionsJson) {
        const collections = JSON.parse(collectionsJson);
        return collections.map((collection: any) => ({
          ...collection,
          createdAt: new Date(collection.createdAt),
          updatedAt: new Date(collection.updatedAt),
          items: collection.items.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          })),
        }));
      }
      return [];
    } catch (error) {
      console.error('获取相册集合失败:', error);
      return [];
    }
  }

  // 创建新的相册集合
  static async createCollection(title: string, userId: string): Promise<LookbookCollection> {
    const collection: LookbookCollection = {
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collections = await this.getAllCollections();
    collections.push(collection);
    await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(collections));

    return collection;
  }

  // 添加图片到相册
  static async addLookbookItem(
    collectionId: string,
    style: string,
    images: string[],
    userId: string,
    title?: string,
    description?: string
  ): Promise<LookbookItem> {
    const item: LookbookItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      style,
      images,
      createdAt: new Date(),
      userId,
      title,
      description,
    };

    const collections = await this.getAllCollections();
    const collectionIndex = collections.findIndex(c => c.id === collectionId);
    
    if (collectionIndex !== -1) {
      collections[collectionIndex].items.push(item);
      collections[collectionIndex].updatedAt = new Date();
      await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(collections));
    }

    return item;
  }

  // 获取指定集合
  static async getCollection(collectionId: string): Promise<LookbookCollection | null> {
    const collections = await this.getAllCollections();
    return collections.find(c => c.id === collectionId) || null;
  }

  // 获取用户的默认集合
  static async getOrCreateDefaultCollection(userId: string): Promise<LookbookCollection> {
    const collections = await this.getAllCollections();
    let defaultCollection = collections.find(c => c.title === 'My Lookbook');

    if (!defaultCollection) {
      defaultCollection = await this.createCollection('My Lookbook', userId);
    }

    return defaultCollection;
  }

  // 删除相册项目
  static async deleteLookbookItem(collectionId: string, itemId: string): Promise<void> {
    const collections = await this.getAllCollections();
    const collectionIndex = collections.findIndex(c => c.id === collectionId);
    
    if (collectionIndex !== -1) {
      collections[collectionIndex].items = collections[collectionIndex].items.filter(
        item => item.id !== itemId
      );
      collections[collectionIndex].updatedAt = new Date();
      await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(collections));
    }
  }

  // 删除整个集合
  static async deleteCollection(collectionId: string): Promise<void> {
    const collections = await this.getAllCollections();
    const filteredCollections = collections.filter(c => c.id !== collectionId);
    await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(filteredCollections));
  }

  // 更新集合标题
  static async updateCollectionTitle(collectionId: string, title: string): Promise<void> {
    const collections = await this.getAllCollections();
    const collectionIndex = collections.findIndex(c => c.id === collectionId);
    
    if (collectionIndex !== -1) {
      collections[collectionIndex].title = title;
      collections[collectionIndex].updatedAt = new Date();
      await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(collections));
    }
  }
}
