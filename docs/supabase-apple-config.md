# Supabase Apple认证配置指南

## 1. 基本配置

在Supabase Dashboard > Authentication > Providers > Apple中配置：

### 必需字段
- **Client ID**: ` com.stylai,host.exp.Exponent`
- **Client Secret**: 使用 `apple_jwt_generator.py` 生成的token
- **Redirect URL**: `https://your-project-id.supabase.co/auth/v1/callback`

### 生成的Client Secret
```
eyJhbGciOiJFUzI1NiIsImtpZCI6IjczNjM1QlVOVDUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJEMkY5UlpUNTRTIiwiaWF0IjoxNzU2OTc1Mjk5LCJleHAiOjE3NzI1MjcyOTksImF1ZCI6Imh0dHBzOi8vYXBwbGVpZC5hcHBsZS5jb20iLCJzdWIiOiJjb20uc3R5bGFpIn0.sE0QbZuKlLmqHyrfyjxlNIAcs4PvVHdUon200zlZ5TeHEd7nhHBPxNY2KiNX_lqD6PRfq64P7So_Pe1nzDCYug
```

## 2. 开发环境配置

### 问题
在Expo开发环境中，Apple ID token的audience是 `host.exp.Exponent`，但Supabase期望 `com.stylai`。

### 解决方案

#### 方案A: 配置多个Client ID
在Supabase中配置多个Client ID：
- `com.stylai` (生产环境)
- `host.exp.Exponent` (Expo开发环境)

#### 方案B: 使用自定义域名
在Expo中配置自定义scheme，避免使用 `host.exp.Exponent`。

#### 方案C: 开发环境跳过验证
在开发环境中临时跳过audience验证（仅用于测试）。

## 3. Apple Developer Console配置

确保在Apple Developer Console中配置：

### App ID配置
- **Bundle ID**: `com.stylai`
- **Sign In with Apple**: 启用

### Service ID配置
- **Identifier**: `com.stylai.service`
- **Domains**: `your-project-id.supabase.co`
- **Redirect URLs**: `https://your-project-id.supabase.co/auth/v1/callback`

## 4. 测试步骤

1. 配置Supabase Apple认证
2. 运行应用
3. 点击Apple登录按钮
4. 完成Apple认证流程
5. 检查是否成功跳转到主应用

## 5. 常见问题

### Q: audience错误
**A**: 确保Supabase配置了正确的Client ID，包括开发环境的 `host.exp.Exponent`。

### Q: 重定向失败
**A**: 检查Apple Developer Console中的Redirect URL配置。

### Q: Client Secret过期
**A**: 重新运行 `apple_jwt_generator.py` 生成新的Client Secret。
