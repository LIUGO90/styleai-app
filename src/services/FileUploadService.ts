import * as FileSystem from 'expo-file-system';

export const uploadImageWithFileSystem = async (selectedImage: string) => {
  try {
    const imageUri = selectedImage.split('/').pop() || '';
    console.log('imageUri', imageUri);
    const response = await FileSystem.uploadAsync(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/upload`, selectedImage, {
      httpMethod: 'POST', // Or 'PUT' depending on your server
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'image/jpeg',
        'file-name': imageUri,// Or the appropriate image type
      },
    });
    console.log('Upload successful:', response);
    const imageUrl = JSON.parse(response.body).blobUrl;
    console.log('imageUrl', imageUrl);
    // await AsyncStorage.setItem('saveKey', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};