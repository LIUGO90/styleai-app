# Supabase 配置指南

## 问题解决

当前遇到的错误：
```
Error: @supabase/auth-js: Expected parameter to be UUID but is not
```

## 解决步骤

### 1. 创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取项目 URL 和 API 密钥

### 2. 创建环境变量文件
在项目根目录创建 `.env` 文件：

```env
# Supabase 配置
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. 获取 Supabase 配置
1. 在 Supabase 仪表板中，进入 Settings > API
2. 复制 "Project URL" 到 `EXPO_PUBLIC_SUPABASE_URL`
3. 复制 "anon public" 密钥到 `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 4. 重启开发服务器
```bash
npx expo start --clear
```

## 注意事项
- 确保 `.env` 文件在 `.gitignore` 中（不要提交到版本控制）
- 环境变量必须以 `EXPO_PUBLIC_` 开头才能在客户端使用
- 重启开发服务器后环境变量才会生效
