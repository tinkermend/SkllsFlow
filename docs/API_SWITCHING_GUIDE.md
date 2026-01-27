# API 切换指南

本文档说明如何在项目中切换 Mock 数据和真实后端 API。

## 概述

项目实现了统一的 API 切换层，支持在 Mock 数据和真实后端 API 之间无缝切换，无需修改业务代码。

## 架构设计

### 1. 配置层 (`src/config/api.ts`)

统一的 API 配置文件，通过环境变量控制 API 模式：

```typescript
export const API_CONFIG = {
  useMockApi: import.meta.env.VITE_MOCK === "true",
  baseUrl: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
};
```

### 2. 服务层 (`src/features/*/api/*.api.ts`)

每个功能模块的 API 服务层实现了两套 API：

- **mockApi**: 前端模拟数据，无需后端服务
- **realApi**: 真实后端 API 调用

根据 `API_CONFIG.useMockApi` 自动选择：

```typescript
export const skillsApi = API_CONFIG.useMockApi ? mockApi : realApi;
```

### 3. Hooks 层 (`src/features/*/hooks/*.ts`)

使用 TanStack Query 封装 API 调用，业务代码无需关心数据来源：

```typescript
export function useSkills() {
  return useQuery({
    queryKey: skillsKeys.lists(),
    queryFn: () => skillsApi.getSkills(),
  });
}
```

## 切换方式

### 方法 1：环境变量配置（推荐）

在项目根目录创建 `.env` 文件：

#### 使用 Mock 数据（默认）

```bash
# .env
VITE_MOCK=true
```

#### 使用真实后端 API

```bash
# .env
VITE_MOCK=false
```

### 方法 2：启动时指定

```bash
# Mock 模式
VITE_MOCK=true pnpm dev

# 真实 API 模式
VITE_MOCK=false pnpm dev
```

## 使用场景

### 场景 1：前端独立开发（Mock 模式）

适合前端开发人员在后端 API 未完成时进行开发。

**配置：**

```bash
VITE_MOCK=true
```

**启动：**

```bash
pnpm dev
```

**特点：**

- 无需启动后端服务
- 数据响应快速
- 可自定义 Mock 数据

### 场景 2：前后端联调（真实 API 模式）

适合前后端集成测试和联调。

**配置：**

```bash
VITE_MOCK=false
```

**启动：**

```bash
# 终端 1：启动后端服务
pnpm dev:server

# 终端 2：启动前端服务
pnpm dev

# 或同时启动
pnpm dev:all
```

**特点：**

- 使用真实后端数据
- 测试完整的数据流
- 验证 API 接口

### 场景 3：生产环境

**配置：**

```bash
VITE_MOCK=false
VITE_API_URL=https://api.example.com
```

## 为新功能添加 API 切换支持

### 步骤 1：定义类型

```typescript
// src/features/your-feature/types/index.ts
export interface YourData {
  id: string;
  name: string;
  // ...
}
```

### 步骤 2：创建 Mock 数据

```typescript
// src/features/your-feature/mock-data.ts
export const mockYourData: YourData[] = [
  { id: "1", name: "Example" },
  // ...
];
```

### 步骤 3：创建 API 服务层

```typescript
// src/features/your-feature/api/your-feature.api.ts
import axios from "axios";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import type { YourData } from "../types";
import { mockYourData } from "../mock-data";

const apiClient = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
});

// Mock API 实现
const mockApi = {
  async getData(): Promise<YourData[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockYourData;
  },
};

// 真实 API 实现
const realApi = {
  async getData(): Promise<YourData[]> {
    const response = await apiClient.get<YourData[]>("/your-endpoint");
    return response.data;
  },
};

// 统一导出
export const yourFeatureApi = API_CONFIG.useMockApi ? mockApi : realApi;
```

### 步骤 4：创建 React Query Hooks

```typescript
// src/features/your-feature/hooks/use-your-feature.ts
import { useQuery } from "@tanstack/react-query";
import { yourFeatureApi } from "../api/your-feature.api";

export const yourFeatureKeys = {
  all: ["your-feature"] as const,
  lists: () => [...yourFeatureKeys.all, "list"] as const,
};

export function useYourData() {
  return useQuery({
    queryKey: yourFeatureKeys.lists(),
    queryFn: () => yourFeatureApi.getData(),
  });
}
```

### 步骤 5：在组件中使用

```typescript
// src/features/your-feature/index.tsx
import { useYourData } from "./hooks/use-your-feature";

export function YourFeature() {
  const { data, isLoading, error } = useYourData();

  // 业务逻辑无需关心数据来源
  // ...
}
```

### 步骤 6：添加后端 API 路由（可选）

如果需要真实 API 支持，在后端添加对应路由：

```typescript
// server/routes/your-feature.routes.ts
import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  // 实现逻辑
  res.json([]);
});

export default router;
```

然后在 `server/index.ts` 中注册路由：

```typescript
import yourFeatureRoutes from "./routes/your-feature.routes";
app.use("/api/your-feature", yourFeatureRoutes);
```

## 已支持的功能模块

### 技能管理 (Skills)

**文件位置：**

- API 服务层: `src/features/skills/api/skills.api.ts`
- Hooks: `src/features/skills/hooks/use-skills.ts`
- 后端路由: `server/routes/skills.routes.ts`

**可用 Hooks：**

- `useSkills()` - 获取技能列表
- `useSkill(id)` - 获取技能详情
- `useCreateSkill()` - 创建技能
- `useUpdateSkill()` - 更新技能
- `useDeleteSkill()` - 删除技能

**API 端点：**

- `GET /api/skills` - 获取技能列表
- `GET /api/skills/:id` - 获取技能详情
- `POST /api/skills` - 创建技能
- `PATCH /api/skills/:id` - 更新技能
- `DELETE /api/skills/:id` - 删除技能

## 调试技巧

### 1. 查看当前 API 模式

在浏览器控制台中查看：

```javascript
// 开发环境会自动打印
// [API Config] Mode: Mock / Real API
// [API Config] Base URL: /api
```

### 2. 验证环境变量

```bash
# 查看 Vite 环境变量
pnpm dev --debug
```

### 3. 网络请求监控

- **Mock 模式**: 不会看到网络请求（数据在前端生成）
- **真实 API 模式**: 可在浏览器 Network 面板看到 `/api/*` 请求

## 常见问题

### Q1: 切换模式后没有生效？

**A:** 需要重启开发服务器。环境变量在构建时读取，运行时无法动态修改。

```bash
# 停止服务器 (Ctrl+C)
# 重新启动
pnpm dev
```

### Q2: Mock 模式下如何修改数据？

**A:** 编辑对应功能模块的 `mock-data.ts` 文件：

```typescript
// src/features/skills/mock-data.ts
export const mockSkills: Skill[] = [
  // 添加或修改数据
];
```

### Q3: 真实 API 模式下后端未启动会怎样？

**A:** 前端会显示错误状态，提示网络请求失败。确保后端服务已启动：

```bash
pnpm dev:server
```

### Q4: 如何在生产环境禁用 Mock？

**A:** 在生产构建时确保环境变量设置正确：

```bash
VITE_MOCK=false pnpm build
```

### Q5: 可以部分功能用 Mock，部分用真实 API 吗？

**A:** 当前架构是全局切换。如需部分切换，可以在具体的 API 服务层中自定义逻辑：

```typescript
// 强制使用 Mock（忽略全局配置）
export const yourFeatureApi = mockApi;

// 强制使用真实 API（忽略全局配置）
export const yourFeatureApi = realApi;
```

## 最佳实践

1. **开发阶段**: 使用 Mock 模式快速迭代 UI
2. **联调阶段**: 切换到真实 API 模式验证接口
3. **Mock 数据**: 保持与真实数据结构一致
4. **错误处理**: Mock API 也应模拟错误场景
5. **类型安全**: 前后端共享类型定义
6. **文档同步**: API 变更时同步更新 Mock 数据

## 相关文件

- 配置文件: [src/config/api.ts](../src/config/api.ts)
- 环境变量示例: [.env.example](../.env.example)
- 技能管理示例: [src/features/skills/](../src/features/skills/)
- 后端服务: [server/](../server/)

## 更新日志

- **2026-01-27**: 创建统一 API 切换层，移除 `MOCK_OPENCODE` 环境变量
- **2026-01-27**: 为技能管理添加完整的 Mock/Real API 支持
