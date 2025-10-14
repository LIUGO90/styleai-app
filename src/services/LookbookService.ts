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
  private static readonly LOOKBOOK_KEY = 'lookbook_items'; // 改为直接存储 items
  private static readonly CURRENT_COLLECTION_KEY = 'current_lookbook_collection';

  // 获取所有 lookbook 项目（按 list 统一存储）
  static async getAllItems(): Promise<LookbookItem[]> {
    try {
      const itemsJson = await AsyncStorage.getItem(this.LOOKBOOK_KEY);
      if (itemsJson) {
        const items = JSON.parse(itemsJson);
        return items.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('获取 lookbook 项目失败:', error);
      return [];
    }
  }

  // 获取所有相册集合（兼容性方法，按style分组）
  static async getAllCollections(): Promise<LookbookCollection[]> {
    try {
      const items = await this.getAllItems();

      // 按 style 分组
      const groupedByStyle = items.reduce((acc: { [key: string]: LookbookItem[] }, item) => {
        if (!acc[item.style]) {
          acc[item.style] = [];
        }
        acc[item.style].push(item);
        return acc;
      }, {});

      // 转换为 Collection 格式
      return Object.entries(groupedByStyle).map(([style, styleItems]) => ({
        id: `collection_${style}`,
        title: style,
        items: styleItems,
        createdAt: styleItems[0]?.createdAt || new Date(),
        updatedAt: styleItems[styleItems.length - 1]?.createdAt || new Date(),
      }));
    } catch (error) {
      console.error('获取相册集合失败:', error);
      return [];
    }
  }

  // 创建新的相册集合（兼容性方法，实际上不需要创建）
  static async createCollection(title: string, userId: string): Promise<LookbookCollection> {
    // 在新的架构中，集合是虚拟的，由 style 动态分组
    // 返回一个虚拟的集合对象
    const collection: LookbookCollection = {
      id: `collection_${title}`,
      title,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return collection;
  }

  // 添加图片到相册（直接添加到 list）
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


    // 直接添加到 list，不管 collectionId
    const items = await this.getAllItems();

    items.push(item);

    await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(items));

    // 验证保存
    const savedItems = await this.getAllItems();

    return item;
  }

  // 批量添加图片
  static async addMultipleItems(
    style: string,
    images: string[],
    userId: string,
    title?: string,
    description?: string
  ): Promise<LookbookItem[]> {
    const items = await this.getAllItems();
    const newItems: LookbookItem[] = [];

    for (const image of images) {
      const item: LookbookItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        style,
        images: [image],
        createdAt: new Date(),
        userId,
        title,
        description,
      };
      newItems.push(item);
      items.push(item);
    }

    await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(items));
    return newItems;
  }

  // 获取指定集合
  static async getCollection(collectionId: string): Promise<LookbookCollection | null> {
    const collections = await this.getAllCollections();
    return collections.find(c => c.id === collectionId) || null;
  }

  // 获取用户的默认集合（兼容性方法，返回虚拟集合）
  static async getOrCreateDefaultCollection(userId: string): Promise<LookbookCollection> {
    // 在新的架构中，不需要真正创建集合
    // 直接返回一个虚拟的默认集合
    const defaultCollection: LookbookCollection = {
      id: `collection_default`,
      title: 'My Lookbook',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return defaultCollection;
  }

  // 删除相册项目（直接从 list 删除）
  static async deleteLookbookItem(collectionId: string, itemId: string): Promise<void> {
    const items = await this.getAllItems();
    const filteredItems = items.filter(item => item.id !== itemId);
    await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(filteredItems));
  }

  // 删除指定 ID 的项目
  static async deleteItemById(itemId: string): Promise<void> {
    const items = await this.getAllItems();
    const filteredItems = items.filter(item => item.id !== itemId);
    await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(filteredItems));
  }

  // 删除整个集合（删除指定 style 的所有项目）
  static async deleteCollection(collectionId: string): Promise<void> {
    // 从 collectionId 提取 style
    const style = collectionId.replace('collection_', '');
    const items = await this.getAllItems();
    const filteredItems = items.filter(item => item.style !== style);
    await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(filteredItems));
  }

  // 删除指定 style 的所有项目
  static async deleteByStyle(style: string): Promise<void> {
    const items = await this.getAllItems();
    const filteredItems = items.filter(item => item.style !== style);
    await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify(filteredItems));
  }

  // 清空所有项目
  static async clearAll(): Promise<void> {
    await AsyncStorage.setItem(this.LOOKBOOK_KEY, JSON.stringify([]));
  }

  // 更新集合标题（暂不支持，因为按 style 分组）
  static async updateCollectionTitle(collectionId: string, title: string): Promise<void> {
    console.warn('updateCollectionTitle is not supported in list-based storage');
  }
}
