# AI Fashion Stylist App

一款基于 AI 的时尚穿搭应用，帮助用户通过人工智能技术生成个性化的时尚造型和穿搭灵感。

## ✨ 主要功能

- 🎨 **AI 穿搭生成** - 基于用户照片和风格偏好生成个性化穿搭
- 👗 **多种风格模板** - 支持 Old Money、Y2K、Burgundy Fall 等多种时尚风格
- 📸 **虚拟试衣** - 将用户照片与服装搭配进行智能合成
- 📱 **个人相册** - 保存和管理生成的穿搭造型
- 💬 **AI 聊天助手** - 实时的时尚搭配建议和咨询

## 📱 技术栈

- **框架**: React Native + Expo Router
- **语言**: TypeScript
- **UI**: NativeWind (TailwindCSS)
- **状态管理**: React Context + AsyncStorage
- **图片处理**: Expo Image
- **AI 服务**: 自定义 AI Request 服务

## 🎯 效果展示

### Old Money 风格

<p align="center">
  <img src="https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_001.png" width="30%" />
  <img src="https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_002.png" width="30%" />
  <img src="https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_003.png" width="30%" />
</p>

<p align="center">
  <img src="https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_004.png" width="30%" />
  <img src="https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_005.png" width="30%" />
</p>

### Burgundy Fall 风格

<p align="center">
  <img src="https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_001.png" width="30%" />
  <img src="https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_002.png" width="30%" />
  <img src="https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_003.png" width="30%" />
</p>

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
bun install
```

### 运行项目

```bash
# 启动开发服务器
npx expo start

# iOS
npx expo start --ios

# Android
npx expo start --android
```

## 📁 项目结构

```
src/
├── app/                    # 应用页面和路由
│   ├── tabs/              # Tab 导航页面
│   ├── onboarding/        # 用户引导流程
│   ├── foryou.tsx         # AI 穿搭推荐页
│   └── ...
├── components/            # 可复用组件
├── services/              # 业务服务层
├── hooks/                 # 自定义 Hooks
├── contexts/              # 全局状态管理
└── utils/                 # 工具函数
```

## 🔧 环境配置

需要配置以下环境变量和服务：

- AI 图像生成服务 API
- 文件存储服务（Vercel Blob）
- 用户认证服务
- RevenueCat（订阅管理，可选）

## 📄 许可证

MIT License
