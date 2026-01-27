MSW (Mock Service Worker) 技术方案

### 最佳实践落地指南

我们将 Mock 逻辑完全解耦在 `src/mocks` 目录下，并通过 `.env` 控制。

#### 1. 目录结构规划

在 `src/` 下新增 `mocks` 目录：

```text
src/
├── mocks/
│   ├── browser.ts       # 浏览器端 Worker 设置
│   ├── handlers.ts      # 所有 API 的 Mock 规则 (AI 生成的核心区域)
│   └── data/            # (可选) 存放较大的 Mock JSON 数据
```

#### 2. 安装依赖

```bash
pnpm add -D msw
# 初始化 Service Worker 文件到 public 目录
npx msw init public/ --save
```

#### 3. 编写 Mock 处理器 (`src/mocks/handlers.ts`)

这里我们需要拦截发往你现有 Express 后端的请求（即 `/api`）。

`

#### 4. 配置浏览器入口 (`src/mocks/browser.ts`)


#### 5. 在 React 19 入口中集成 (`src/main.tsx`)

修改你的入口文件，确保在 `VITE_MOCK=true` 时先启动 MSW 再渲染 React。

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

// 创建路由实例
const router = createRouter({ routeTree })

// 封装启动逻辑
async function prepareApp() {
  // 仅在开发环境且开启了 Mock 开关时启动
  if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser')
    // 启动并忽略未定义的路由（让它们穿透到真实的 Express 3001 端口）
    return worker.start({
      onUnhandledRequest: 'bypass', 
    })
  }
}

prepareApp().then(() => {
  const rootElement = document.getElementById('root')!
  if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    )
  }
})
```

#### 6. 环境变量配置

在 `.env.development` 中添加：

```ini
# 你的后端地址 (Vite 代理的目标)
VITE_API_BASE_URL=http://localhost:3001

# Mock 开关：true 使用 MSW，false 使用真实后端
VITE_MOCK=true
```

---

### 如何利用 AI Code 能力自动生成 Mock？

这是你最想解决的痛点：**不想维护 Mock 配置**。你可以使用以下 Prompt 模板，将你的 `docs/openapi.json` 或 `server/routes/*.ts` 代码投喂给 AI。

**复制给 AI 的 Prompt (提示词):**

> 我正在开发一个基于 React 19 和 MSW 的前端项目。
> 请根据我提供的 API 接口定义，帮我生成 `src/mocks/handlers.ts` 的代码。
>
> **要求：**
> 1. 使用 `msw` 的 `http` 和 `HttpResponse` 对象。
> 2. 接口前缀统一为 `/api`。
> 3. 使用 `@faker-js/faker` 生成逼真的中文测试数据。
> 4. 为每个接口添加 `delay(500)` 来模拟真实网络延迟。
> 5. 严格遵循以下 TypeScript 类型定义。
>
> **接口定义/Swagger 文档内容：**
> (在此处粘贴你的 docs/openapi.json 内容 或 server/routes 代码)

---

