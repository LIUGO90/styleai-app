# EAS 构建问题修复指南

## 问题描述
在 EAS 构建过程中遇到 Bun lockfile 错误：
```
error: lockfile had changes, but lockfile is frozen
bun install --frozen-lockfile exited with non-zero code: 1
```

## 解决方案

### 1. 配置 EAS 使用 npm
在 `eas.json` 中为所有构建配置添加了：
```json
{
  "env": {
    "NPM_CONFIG_PACKAGE_MANAGER": "npm"
  }
}
```

### 2. 指定 Node.js 版本
为所有构建配置指定了 Node.js 版本：
```json
{
  "node": "20.11.0"
}
```

### 3. 在 package.json 中指定包管理器
添加了：
```json
{
  "packageManager": "npm@11.5.1"
}
```

### 4. 创建 .npmrc 文件
确保使用 npm：
```
engine-strict=true
```

### 5. 删除 Bun lockfile
移除了所有 Bun 相关的 lockfile：
- `bun.lock`
- `bun.lockb`

## 当前配置状态

### ✅ 已修复
- EAS 构建现在使用 npm 而不是 Bun
- 所有依赖版本一致
- Apple 开发者凭据已配置
- Bundle Identifier 已注册: `com.styleai.app`

### 📱 构建命令
```bash
# 开发版本构建
npx eas-cli build --platform ios --profile development

# 预览版本构建
npx eas-cli build --platform ios --profile preview

# 生产版本构建
npx eas-cli build --platform ios --profile production

# 本地构建（测试用）
npx eas-cli build --platform ios --profile development --local
```

### 🔧 环境变量
确保在 `.env` 文件中配置了正确的 Supabase 凭据：
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 注意事项
- 确保使用 npm 而不是 Bun 进行本地开发
- 所有 lockfile 都是 npm 格式
- EAS 构建环境会自动使用 npm
