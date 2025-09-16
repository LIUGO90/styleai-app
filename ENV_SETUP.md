# 环境变量配置指南

## 当前状态
你的应用现在可以运行，但使用的是模拟的 Supabase 配置。要完全启用所有功能，需要配置真实的 Supabase 项目。

## 配置步骤

### 1. 创建 Supabase 项目
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 或 "New project"
3. 填写项目信息并创建

### 2. 获取配置信息
在 Supabase 仪表板中：
1. 进入 **Settings** > **API**
2. 复制以下信息：
   - **Project URL** (类似: `https://your-project-id.supabase.co`)
   - **anon public** 密钥 (以 `eyJ` 开头的长字符串)

### 3. 更新环境变量
编辑项目根目录的 `.env` 文件：

```env
# 替换为你的真实 Supabase 配置
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API 配置（如果需要）
EXPO_PUBLIC_API_URL=https://your-api-url.com
```

### 4. 重启应用
```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm start
```

## 当前功能状态

### ✅ 已工作的功能
- Apple 登录（模拟模式）
- 应用导航和界面
- 所有 UI 组件
- 本地数据存储

### ⚠️ 需要真实 Supabase 的功能
- 用户数据持久化
- 云端数据同步
- 实时功能
- 文件上传到云端

## 测试建议
1. 先用当前配置测试应用的基本功能
2. 确认 UI 和导航都正常后，再配置真实的 Supabase
3. 配置 Supabase 后，可以测试完整的用户认证流程

## 注意事项
- `.env` 文件已添加到 `.gitignore`，不会被提交到版本控制
- 环境变量必须以 `EXPO_PUBLIC_` 开头才能在客户端使用
- 重启开发服务器后环境变量才会生效
