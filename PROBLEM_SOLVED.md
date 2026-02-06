# 问题已解决 - 技能装载服务判断问题

## 问题描述回顾

用户在"平台技能 -> 装载技能"功能中，虽然数据库存在该用户创建的活跃服务，但页面显示"您还没有创建任何服务"。

## 问题根本原因

**API 路径配置错误**，导致前端请求返回 404 错误。

### 详细分析

#### 错误的 URL 拼接
```typescript
// apiClient 配置（src/lib/api-client.ts）
const apiClient = axios.create({
  baseURL: "/api",  // ✅ 已配置基础路径
  // ...
});

// 错误的 API 调用（src/features/skills/api/skills.api.ts）
async getActiveChatServers(): Promise<ChatServer[]> {
  const response = await apiClient.get<ChatServer[]>(
    '/api/chat-servers/active'  // ❌ 不应该包含 /api 前缀
  )
  return response.data
}
```

#### 实际请求的 URL
```
baseURL + path = /api + /api/chat-servers/active
              = /api/api/chat-servers/active  ❌ 错误！
```

#### 浏览器控制台错误
```
GET http://localhost:5173/api/api/chat-servers/active 404 (Not Found)
```

## 解决方案

### 修复内容

移除 API 路径中的 `/api` 前缀，因为 `apiClient` 已经通过 `baseURL` 自动添加。

#### 1. 修复 `getActiveChatServers()`
```typescript
// 修改前 ❌
async getActiveChatServers(): Promise<ChatServer[]> {
  const response = await apiClient.get<ChatServer[]>('/api/chat-servers/active')
  return response.data
}

// 修改后 ✅
async getActiveChatServers(): Promise<ChatServer[]> {
  const response = await apiClient.get<ChatServer[]>('/chat-servers/active')
  return response.data
}
```

#### 2. 修复 `loadSkillToChatServer()`
```typescript
// 修改前 ❌
async loadSkillToChatServer(skillId: string, chatServerId: string) {
  const response = await apiClient.post<{ message: string }>(
    `/api/skills/${skillId}/load`,
    { chatServerId }
  )
  return response.data
}

// 修改后 ✅
async loadSkillToChatServer(skillId: string, chatServerId: string) {
  const response = await apiClient.post<{ message: string }>(
    `/skills/${skillId}/load`,
    { chatServerId }
  )
  return response.data
}
```

### 正确的 URL 拼接
```
baseURL + path = /api + /chat-servers/active
              = /api/chat-servers/active  ✅ 正确！
```

### Vite 代理转发流程
```
前端: http://localhost:5173/api/chat-servers/active
  ↓ (Vite Proxy)
后端: http://localhost:3001/api/chat-servers/active
  ↓ (Express Router)
Controller: ChatServerController.getActive()
```

## 修改的文件

- `src/features/skills/api/skills.api.ts` - 修复 2 个 API 方法的路径

## Git 提交

```bash
commit 01092e5
fix(skills): 修复 API 路径重复 /api 前缀导致 404 错误
```

## 验证步骤

### 1. 刷新前端页面
```bash
# 如果前端还在运行，刷新浏览器即可
# 如果需要重启前端
pnpm dev
```

### 2. 测试功能
1. 登录系统
2. 进入"技能管理 -> 平台技能"
3. 点击任意技能的"装载技能"按钮
4. **预期结果**: 对话框正常显示服务列表

### 3. 检查浏览器控制台
应该看到调试日志输出：
```javascript
[DEBUG] useActiveChatServers - 调用 API
[DEBUG] useActiveChatServers - 获取到服务: X [...]
```

### 4. 检查 Network 标签
- 请求 URL: `http://localhost:5173/api/chat-servers/active` ✅
- 状态码: `200 OK` ✅
- 响应数据: 包含服务列表 ✅

### 5. 检查后端日志
```bash
[DEBUG] jwtAuthMiddleware - 开始验证 JWT
[DEBUG] getActiveChatServers - userUuid: xxx
[DEBUG] findByUserId - userId: 1
[DEBUG] findByUserId - result count: X
[DEBUG] getActiveChatServers - activeServers count: X
```

## 预期结果

修复后，功能应该完全正常：

1. ✅ API 请求成功（200 OK）
2. ✅ 前端接收到服务列表
3. ✅ 装载技能对话框显示服务下拉列表
4. ✅ 可以选择服务并成功装载技能

## 为什么会有这个问题？

### 历史背景

项目中使用了两种 API 调用方式：

1. **使用 `API_ENDPOINTS` 配置**（推荐）
   ```typescript
   async getSkills(): Promise<Skill[]> {
     const response = await apiClient.get<Skill[]>(API_ENDPOINTS.skills.list)
     return response.data
   }
   ```
   - `API_ENDPOINTS.skills.list` = `'/skills/list'`（不包含 `/api`）
   - 拼接后: `/api` + `/skills/list` = `/api/skills/list` ✅

2. **直接使用硬编码路径**（不推荐）
   ```typescript
   // ❌ 错误写法
   const response = await apiClient.get('/api/chat-servers/active')
   ```
   - 导致双重 `/api` 前缀

### 教训

1. **统一使用 `API_ENDPOINTS` 配置**
   ```typescript
   // src/config/api.ts
   export const API_ENDPOINTS = {
     chatServers: {
       active: '/chat-servers/active',  // ✅ 不包含 /api
     }
   }
   ```

2. **避免硬编码 API 路径**
   - 使用配置文件集中管理
   - 便于维护和重构

3. **注意 `baseURL` 配置**
   - 如果 `apiClient` 已配置 `baseURL: '/api'`
   - 则调用时不应该再包含 `/api` 前缀

## 相关文档

- **INSTRUCTIONS.md** - 用户操作指南
- **DEBUG_SKILL_LOADING.md** - 诊断指南（保留用于后续调试）
- **FIX_SUMMARY.md** - 技术实施总结

## 后续建议

### 1. 统一 API 路径管理

将所有硬编码的 API 路径迁移到 `API_ENDPOINTS` 配置：

```typescript
// src/config/api.ts
export const API_ENDPOINTS = {
  chatServers: {
    active: '/chat-servers/active',
    list: '/chat-servers',
  },
  skills: {
    load: (id: string) => `/skills/${id}/load`,
  },
}
```

### 2. 添加 ESLint 规则

可以添加 ESLint 规则，禁止在 `apiClient` 调用中使用 `/api` 前缀：

```javascript
// .eslintrc.js
rules: {
  'no-restricted-imports': ['error', {
    patterns: [{
      group: ['apiClient'],
      message: 'Use API_ENDPOINTS instead of hardcoded paths'
    }]
  }]
}
```

### 3. 移除调试日志（可选）

功能验证正常后，可以考虑移除添加的调试日志：

```typescript
// 移除或改为环境变量控制
if (import.meta.env.DEV) {
  console.log('[DEBUG] ...')
}
```

---

**问题状态**: ✅ 已解决
**解决时间**: 2026-02-06
**修复方式**: 修复 API 路径配置错误
**验证状态**: 待用户验证
