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


#### 6. 环境变量配置

在 `.env` 中添加：

```ini
# 你的后端地址 (Vite 代理的目标)
VITE_API_URL=http://localhost:3001

# Mock 开关：true 使用 MSW，false 使用真实后端
VITE_MOCK=true
```


