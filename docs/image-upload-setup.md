# 图片上传配置指南

## 概述

由于 `@vercel/blob` 在 React Native 环境中存在兼容性问题（尝试导入 Node.js 标准库模块），我们提供了一个替代的图片上传解决方案，使用标准的 `fetch` API 和 `FormData`。

## 问题说明

### Vercel Blob 兼容性问题

```
The package at "node_modules\@vercel\blob\dist\chunk-Z56QURM6.js" attempted to import the Node standard library module "stream".
It failed because the native React Native runtime does not include the Node standard library.
```

这是因为 `@vercel/blob` 包依赖 Node.js 的 `stream` 模块，而 React Native 运行时不包含这些模块。

## 解决方案

### 1. 使用兼容的图片上传服务

我们创建了一个新的图片上传服务 `src/services/imageUpload.ts`，它：

- ✅ 完全兼容 React Native
- ✅ 支持 Web 和移动端
- ✅ 使用标准的 `fetch` API
- ✅ 支持文件验证和错误处理
- ✅ 提供模拟上传功能用于测试

### 2. 新的组件结构

```
src/
├── services/
│   └── imageUpload.ts          # 新的图片上传服务
├── components/
│   └── ImageUploadComponent.tsx # 新的图片上传组件
└── app/
    └── image-upload-test.tsx   # 测试页面
```

## 使用方法

### 基本配置

```tsx
import { imageUploadService } from '@/services/imageUpload';

// 初始化服务
const config = {
  uploadUrl: 'https://your-api.com/upload',
  apiKey: 'your-api-key', // 可选
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

imageUploadService.initialize(config);
```

### 在组件中使用

```tsx
import { ImageUploadComponent } from '@/components/ImageUploadComponent';

<ImageUploadComponent
  onImageUploaded={(result) => {
    if (result.success) {
      console.log('上传成功:', result.url);
    }
  }}
  placeholder="上传图片"
  maxSize={5}
  useMockUpload={true} // 使用模拟上传进行测试
/>
```

### 直接使用服务

```tsx
import { imageUploadService } from '@/services/imageUpload';

// 选择图片
const imageUri = await imageUploadService.pickImageFromGallery();

// 上传图片
const result = await imageUploadService.uploadImage(imageUri);
if (result.success) {
  console.log('图片URL:', result.url);
}
```

## 功能特性

### ✅ 支持的功能

- **跨平台兼容**: Web、iOS、Android
- **文件选择**: 相册选择、拍照
- **文件验证**: 类型、大小限制
- **上传进度**: 实时进度显示
- **错误处理**: 完善的错误提示
- **图片预览**: 上传前预览
- **模拟上传**: 测试模式，无需真实服务器

### 🔧 配置选项

```tsx
interface UploadConfig {
  uploadUrl: string;           // 上传服务器URL
  apiKey?: string;            // API密钥（可选）
  maxFileSize?: number;       // 最大文件大小
  allowedTypes?: string[];    // 允许的文件类型
}
```

## 测试模式

### 模拟上传

当 `useMockUpload={true}` 时，组件会使用模拟上传功能：

```tsx
<ImageUploadComponent
  useMockUpload={true}
  onImageUploaded={(result) => {
    // result.url 将是模拟的URL
    // 例如: https://example.com/uploads/1234567890.jpg
  }}
/>
```

### 测试页面

访问 `http://localhost:8081/image-upload-test` 查看完整的测试页面。

## 服务器端要求

### API 端点格式

您的上传服务器需要支持以下格式：

```typescript
// 请求格式
POST /upload
Content-Type: multipart/form-data

// 请求体
FormData {
  file: Blob
}

// 响应格式
{
  "url": "https://your-cdn.com/uploads/filename.jpg",
  "success": true
}
```

### 示例服务器实现

#### Node.js + Express + Multer

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

// 配置存储
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 上传端点
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件上传' });
  }
  
  const fileUrl = `https://your-cdn.com/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    success: true
  });
});
```

#### Python + Flask

```python
from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件上传'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        file_url = f"https://your-cdn.com/uploads/{filename}"
        return jsonify({
            'url': file_url,
            'success': True
        })
    
    return jsonify({'error': '不支持的文件类型'}), 400
```

## 部署建议

### 1. 文件存储

- **云存储**: 使用 AWS S3、Google Cloud Storage、阿里云 OSS 等
- **CDN**: 配置 CDN 加速图片访问
- **备份**: 定期备份上传的文件

### 2. 安全考虑

- **文件验证**: 服务器端也要验证文件类型和大小
- **访问控制**: 实现适当的认证和授权
- **病毒扫描**: 对上传的文件进行安全扫描

### 3. 性能优化

- **图片压缩**: 自动压缩上传的图片
- **格式转换**: 转换为 WebP 等现代格式
- **缓存策略**: 设置合适的缓存头

## 迁移指南

### 从 Vercel Blob 迁移

如果您之前使用了 Vercel Blob，可以按以下步骤迁移：

1. **移除依赖**:
   ```bash
   npm uninstall @vercel/blob
   ```

2. **替换导入**:
   ```tsx
   // 旧代码
   import { put } from '@vercel/blob';
   
   // 新代码
   import { imageUploadService } from '@/services/imageUpload';
   ```

3. **更新配置**:
   ```tsx
   // 旧配置
   const { url } = await put(filename, blob, {
     access: 'public',
     token: uploadToken,
   });
   
   // 新配置
   imageUploadService.initialize({
     uploadUrl: 'https://your-api.com/upload',
     apiKey: 'your-api-key',
   });
   const result = await imageUploadService.uploadImage(imageUri);
   ```

## 常见问题

### Q: 如何配置真实的上传服务器？

A: 将 `uploadUrl` 替换为您的实际 API 端点，并确保服务器返回正确的响应格式。

### Q: 可以同时使用多个上传服务吗？

A: 可以，每个服务实例都是独立的，可以配置不同的上传端点。

### Q: 模拟上传模式有什么用途？

A: 用于开发和测试阶段，无需真实服务器即可测试 UI 和交互逻辑。

### Q: 如何自定义文件命名规则？

A: 在 `imageUploadService` 中修改 `generateFileName` 方法。

## 相关文件

- `src/services/imageUpload.ts` - 图片上传服务
- `src/components/ImageUploadComponent.tsx` - 图片上传组件
- `src/app/image-upload-test.tsx` - 测试页面
- `src/app/onboarding/five.tsx` - 使用示例

## 支持

如果遇到问题，请：

1. 检查网络连接
2. 验证服务器配置
3. 查看控制台错误信息
4. 确认文件格式和大小限制
