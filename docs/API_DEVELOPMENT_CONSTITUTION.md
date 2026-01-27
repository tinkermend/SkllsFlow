# API 开发宪法

> **本文档是项目 API 开发的最高准则，所有功能模块必须严格遵守。**

## 📜 核心原则

### 第一条：统一切换原则

**所有功能模块的 API 调用必须支持 Mock 和真实 API 的统一切换，不得硬编码数据源。**

- ✅ 正确：通过 `API_CONFIG.useMockApi` 自动切换
- ❌ 错误：直接在组件中使用 Mock 数据或硬编码 API 调用

### 第二条：分层架构原则

**所有 API 相关代码必须按照以下三层架构组织：**

1. **配置层** (`src/config/api.ts`) - 全局 API 配置
2. **服务层** (`src/features/*/api/*.api.ts`) - Mock 和真实 API 实现
3. **Hooks 层** (`src/features/*/hooks/*.ts`) - React Query 封装

### 第三条：业务隔离原则

**业务组件不得直接调用 API，必须通过 Hooks 层访问数据。**

- ✅ 正确：`const { data } = useSkills()`
- ❌ 错误：`const data = await axios.get('/api/skills')`

---

## 🏗️ 强制性架构规范

### 1. 目录结构规范

每个功能模块必须包含以下目录结构：

```
src/features/{feature-name}/
├── api/
│   └── {feature-name}.api.ts    # API 服务层（必需）
├── hooks/
│   └── use-{feature-name}.ts    # React Query Hooks（必需）
├── types/
│   └── index.ts                 # 类型定义（必需）
├── mock-data.ts                 # Mock 数据（必需）
├── components/                  # 功能组件（可选）
└── index.tsx                    # 主页面组件（必需）
```

### 2. API 服务层规范

**文件路径：** `src/features/{feature-name}/api/{feature-name}.api.ts`

**强制要求：**

```typescript
import axios from 'axios'
import { API_CONFIG, API_ENDPOINTS } from '@/config/api'
import type { YourDataType } from '../types'
import { mockYourData } from '../mock-data'

// 1. 创建 Axios 实例（必需）
const apiClient = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
})

// 2. Mock API 实现（必需）
const mockApi = {
  async getData(): Promise<YourDataType[]> {
    // 模拟网络延迟（推荐 200-500ms）
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockYourData
  },

  async getById(id: string): Promise<YourDataType | null> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockYourData.find(item => item.id === id) || null
  },

  async create(data: Omit<YourDataType, 'id'>): Promise<YourDataType> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { ...data, id: `generated_${Date.now()}` }
  },

  async update(id: string, data: Partial<YourDataType>): Promise<YourDataType> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const item = mockYourData.find(i => i.id === id)
    if (!item) throw new Error('Not found')
    return { ...item, ...data }
  },

  async delete(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const item = mockYourData.find(i => i.id === id)
    if (!item) throw new Error('Not found')
  },
}

// 3. 真实 API 实现（必需）
const realApi = {
  async getData(): Promise<YourDataType[]> {
    const response = await apiClient.get<YourDataType[]>(
      API_ENDPOINTS.yourFeature.list
    )
    return response.data
  },

  async getById(id: string): Promise<YourDataType | null> {
    try {
      const response = await apiClient.get<YourDataType>(
        API_ENDPOINTS.yourFeature.detail(id)
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async create(data: Omit<YourDataType, 'id'>): Promise<YourDataType> {
    const response = await apiClient.post<YourDataType>(
      API_ENDPOINTS.yourFeature.create,
      data
    )
    return response.data
  },

  async update(id: string, data: Partial<YourDataType>): Promise<YourDataType> {
    const response = await apiClient.patch<YourDataType>(
      API_ENDPOINTS.yourFeature.update(id),
      data
    )
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.yourFeature.delete(id))
  },
}

// 4. 统一导出（必需）
export const yourFeatureApi = API_CONFIG.useMockApi ? mockApi : realApi
```

**禁止事项：**
- ❌ 不得在服务层中直接返回硬编码数据
- ❌ 不得在服务层中使用 `if/else` 判断环境
- ❌ 不得跳过 Mock API 实现
- ❌ 不得跳过真实 API 实现

