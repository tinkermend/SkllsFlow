### 完整 MCP 管理前后端设计方案

以下是详细的MCP 管理前后端设计方案。

#### 1. 整体布局架构

- **页面标题：** MCP 管理中心
- **顶部导航栏（Tabs）：**
  - `我的 MCP` (默认选中)
  - `MCP 市场`
- **全局操作区（右上角）：**
  - `+ 创建/导入 MCP` (主按钮，高亮)
  - `帮助文档` (图标)

---

#### 2. 模块一：我的 MCP (My MCPs)

**功能目标：** 管理已安装/注册的 MCP 实例，监控状态，进行配置。

- **顶部工具栏：**
  - 左侧：搜索框（Placeholder: 搜索 MCP 名称或描述）
  - 右侧：排序下拉（创建时间、健康状态）
- **内容区域（卡片网格布局）：**
  - **卡片样式：**
    - **Header：**
      - 左侧：MCP 图标（若无则根据语言显示 Python/JS 默认图标） + **MCP 名称**（加粗）。
      - 右侧：**健康状态指示灯**（绿=运行中/健康，红=异常/离线，灰=停止） + **部署标识**（Tag：本地/远程）。
    - **Body：**
      - **描述：** 限制 2 行，超出显示省略号。
      - **元数据：**
        - 语言：Python / Node.js
        - 创建人: 张三
        - 创建时间：YYYY-MM-DD
    - **Footer (操作区)：**
      - `配置` (快速修改环境变量)
      - `... 更多` 按钮：
        - `重启服务` (针对本地进程或重连远程)
        - `添加会话` (选择会话进行装载)
        - `卸载` (红色警示，二次确认)
- **空状态：** 若无数据，显示引导图及“去MCP市场看看”按钮。

---

#### 3. 模块二：MCP 市场 (MCP Marketplace)

**功能目标：** 发现公共 MCP 服务，快速安装或直接调用。

- **布局结构：** 左右分栏设计。
- **左侧：分类侧边栏**
  - 全部 (All)
  - 搜索工具 (Search)
  - 数据库 (Database)
  - 生产力 (Productivity)
  - 开发工具 (DevTools)
  - _支持分类上的数字角标显示该类目下的数量_
- **右侧：市场列表**
  - **顶部：** 市场搜索框。
  - **卡片内容（与“我的 MCP”略有不同）：**
    - 展示：名称、图标、描述、创建者,标签,已装载次数。
    - **核心操作按钮：**
      - `装载` (Load)：点击后弹出模态框“选择要装载的会话”。
        - _逻辑补充：_ 如果该 MCP 需要配置（如 API Key），点击装载后应先弹出配置框，配置完成后再选择会话。
      - `详情`：跳转详情页。
      - `删除`：(仅管理员可见或创建者可见,需二次确认) 红色文字按钮。

---

#### 4. 模块三：MCP 详情页 (Detail View)

**功能目标：** 全方位展示 MCP 的能力和元数据

- **头部信息区（Header）：**
  - 面包屑导航：返回 / MCP 名称
  - 左侧：大图标 + 名称 + 版本号 + 状态标签 + 部署类型标签。
  - 右侧操作：`添加到会话`、`配置`、`重启`、`卸载`。
  - 底部元数据：创建人、创建时间、语言类型、运行端口/地址。
- **主体内容区（Tabs 切换）：**
  1.  **概览 (Overview)：**
      - ReadMe 文档渲染（Markdown 格式），详细介绍功能和用法。
  2.  **工具列表 (Tools) - _核心_：**
      - 表格或列表形式展示该 MCP 提供的所有 Tool。
      - **列信息：** 工具名称 (Function Name)、功能描述、**入参定义 (Schema)**。
      - _交互：_ 点击入参定义，展开 JSON Schema 结构，方便开发者查看参数类型和必填项。
  3.  **关联会话 (Active Sessions)：**
      - 列表展示当前哪些会话正在加载此 MCP。
      - 操作：`从会话中移除`。
  4.  **配置与日志 (Config & Logs)：**
      - 显示当前的环境变量（Key 脱敏显示）。

---

#### 5. 模块四：创建/导入 MCP (Create Modal)

**功能目标：** 引导用户注册新的 MCP。

- **弹窗标题：** 创建新的 MCP
- **步骤一：基础信息**
  - **部署方式（Radio Group）：**
    - `本地部署 (Local)`：显示文件上传框（支持 .zip, .tar.gz），提示“请上传mcp文件的压缩包”。
    - `远程连接 (Remote)`：显示 URL 输入框（SSE 或 WebSocket 地址）。
  - **MCP 名称：** 输入框。
  - **图标：** 选择emoji 图标。
  - **MCP 描述：** 文本域。
  - **语言类型：** 下拉选择 (Python, Node.js, Go, Other)。
  - **标签：** Tag 输入组件（支持回车添加多个）。
- **步骤二：环境配置**
  - **键值对编辑器：** Key (如 `API_KEY`) - Value (如 `sk-xxxx`)。支持添加多行。
- **底部按钮：** `取消`、`创建`。

#### 6. 模块五: 装载 MCP 弹窗（点击“装载”触发）

1.  **选择目标：**
    - **选择会话：** 多选下拉框（支持搜索会话名称），选择将该 MCP 挂载到哪个会话中。

---

### 第三部分：交互与视觉细节补充

1.  **状态反馈：**
    - **健康检查：** 页面加载时应异步请求 MCP 的 `ping` 接口。
    - **Loading：** 创建或装载过程中，按钮显示 Loading 状态，防止重复点击。
    - **Toast 提示：** 操作成功（如“装载成功”）显示绿色顶部提示；失败显示红色错误详情。

2.  **空状态（Empty State）：**
    - 当“我的 MCP”为空时，显示插画和引导文案：“还没有 MCP？去**MCP平台**看看或**创建**一个吧”。

3.  **权限控制(后续实现)：**
    - 针对“市场”中的“删除”按钮，前端需根据用户角色（Admin/User）控制显隐。


## 数据库表结构

当前涉及的表都已经创建相关表定义见 docs/database_design/表名.sql

### 核心表

1. **mcp_services** - mcp 服务表
2. **mcp_categories** - MCP 服务分类表
3. **mcp_tags** - 标签表
4. **mcp_tools** - MCP 工具定义表
5. **mcp_resources** - MCP 资源定义表
6. **mcp_marketplace_items** - MCP 市场项目表

### 关联表

1. **mcp_service_tags** - MCP 服务与标签关联

## API 端点

### 基础路径
所有 MCP 相关 API 的基础路径为：`/api/mcp`

### 1. MCP 服务管理 API

#### 1.1 获取我的 MCP 列表
```http
GET /api/mcp/my-services
```

**权限要求**: 需要认证

**查询参数**:
- `search` (string, optional): 搜索关键词（名称或描述）
- `status` (string, optional): 状态筛选 (active/inactive/error/maintenance)
- `language` (string, optional): 语言筛选 (python/javascript/go/other)
- `sortBy` (string, optional): 排序字段 (createdAt/name/status)，默认 createdAt
- `sortOrder` (string, optional): 排序方向 (asc/desc)，默认 desc
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 20

**响应示例**:
```json
{
  "data": [
    {
      "id": "1",
      "mcpId": "mcp_123",
      "name": "GitHub MCP",
      "description": "GitHub API 集成服务",
      "icon": "🐙",
      "version": "1.0.0",
      "language": "python",
      "transportType": "stdio",
      "status": "active",
      "categoryId": "1",
      "categoryName": "开发工具",
      "tags": ["git", "github", "api"],
      "lastHealthCheckAt": "2026-01-30T10:00:00Z",
      "createdAt": "2026-01-20T10:00:00Z",
      "createdByUser": {
        "id": "1",
        "username": "张三",
        "avatar": "https://..."
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

#### 1.2 创建 MCP 服务
```http
POST /api/mcp/services
```

**权限要求**: 需要认证

**请求体**:
```json
{
  "name": "GitHub MCP",
  "description": "GitHub API 集成服务",
  "icon": "🐙",
  "version": "1.0.0",
  "language": "python",
  "transportType": "stdio",
  "connectionConfig": {
    "command": "python",
    "args": ["-m", "github_mcp"],
    "cwd": "/path/to/mcp"
  },
  "envVars": {
    "GITHUB_TOKEN": "ghp_xxx"
  },
  "categoryId": "1",
  "tags": ["git", "github", "api"]
}
```

**响应示例**:
```json
{
  "data": {
    "id": "1",
    "mcpId": "mcp_123",
    "name": "GitHub MCP",
    "status": "inactive",
    "createdAt": "2026-01-30T10:00:00Z"
  },
  "message": "MCP 服务创建成功"
}
```

#### 1.3 更新 MCP 服务
```http
PUT /api/mcp/services/:mcpId
```

**权限要求**: 需要认证，且为创建者或管理员

**请求体**: 同创建接口，所有字段可选

**响应示例**:
```json
{
  "data": {
    "id": "1",
    "mcpId": "mcp_123",
    "name": "GitHub MCP",
    "updatedAt": "2026-01-30T11:00:00Z"
  },
  "message": "MCP 服务更新成功"
}
```

#### 1.4 删除 MCP 服务
```http
DELETE /api/mcp/services/:mcpId
```

**权限要求**: 需要认证，且为创建者或管理员

**响应示例**:
```json
{
  "message": "MCP 服务删除成功"
}
```

#### 1.5 获取 MCP 服务详情
```http
GET /api/mcp/services/:mcpId
```

**权限要求**: 需要认证

**响应示例**:
```json
{
  "data": {
    "id": "1",
    "mcpId": "mcp_123",
    "name": "GitHub MCP",
    "description": "GitHub API 集成服务",
    "icon": "🐙",
    "version": "1.0.0",
    "language": "python",
    "transportType": "stdio",
    "connectionConfig": {
      "command": "python",
      "args": ["-m", "github_mcp"]
    },
    "envVars": {
      "GITHUB_TOKEN": "***"
    },
    "status": "active",
    "lastHealthCheckAt": "2026-01-30T10:00:00Z",
    "healthCheckResult": {
      "status": "healthy",
      "latency": 120,
      "message": "服务运行正常"
    },
    "categoryId": "1",
    "categoryName": "开发工具",
    "tags": ["git", "github", "api"],
    "tools": [
      {
        "toolName": "create_issue",
        "toolDescription": "创建 GitHub Issue",
        "toolSchema": { "type": "object", "properties": {...} }
      }
    ],
    "resources": [
      {
        "resourceName": "repositories",
        "resourceType": "list",
        "resourceDescription": "用户的仓库列表"
      }
    ],
    "activeSessions": [
      {
        "sessionId": "sess_123",
        "title": "项目开发会话",
        "createdAt": "2026-01-30T09:00:00Z"
      }
    ],
    "createdAt": "2026-01-20T10:00:00Z",
    "createdByUser": {
      "id": "1",
      "username": "张三",
      "avatar": "https://..."
    }
  }
}
```

#### 1.6 健康检查
```http
POST /api/mcp/services/:mcpId/health-check
```

**权限要求**: 需要认证

**响应示例**:
```json
{
  "data": {
    "status": "healthy",
    "latency": 120,
    "message": "服务运行正常",
    "checkedAt": "2026-01-30T10:00:00Z"
  }
}
```

#### 1.7 重启 MCP 服务
```http
POST /api/mcp/services/:mcpId/restart
```

**权限要求**: 需要认证，且为创建者或管理员

**响应示例**:
```json
{
  "message": "MCP 服务重启成功",
  "data": {
    "status": "active"
  }
}
```

### 2. MCP 市场 API

#### 2.1 获取市场列表
```http
GET /api/mcp/marketplace
```

**权限要求**: 需要认证

**查询参数**:
- `search` (string, optional): 搜索关键词
- `categoryId` (string, optional): 分类 ID
- `tags` (string[], optional): 标签筛选
- `sortBy` (string, optional): 排序字段 (installationCount/createdAt/name)
- `page` (number, optional): 页码
- `pageSize` (number, optional): 每页数量

**响应示例**:
```json
{
  "data": [
    {
      "id": "1",
      "mcpId": "mcp_123",
      "name": "GitHub MCP",
      "description": "GitHub API 集成服务",
      "icon": "🐙",
      "categoryName": "开发工具",
      "tags": ["git", "github"],
      "installationCount": 1250,
      "isVerified": true,
      "creatorUsername": "张三",
      "createdAt": "2026-01-20T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

#### 2.2 装载 MCP 到会话
```http
POST /api/mcp/services/:mcpId/load
```

**权限要求**: 需要认证

**请求体**:
```json
{
  "sessionIds": ["sess_123", "sess_456"]
}
```

**响应示例**:
```json
{
  "message": "MCP 装载成功",
  "data": {
    "successCount": 2,
    "failedCount": 0
  }
}
```

#### 2.3 从会话卸载 MCP
```http
POST /api/mcp/services/:mcpId/unload
```

**权限要求**: 需要认证

**请求体**:
```json
{
  "sessionIds": ["sess_123"]
}
```

**响应示例**:
```json
{
  "message": "MCP 卸载成功"
}
```

### 3. MCP 分类 API

#### 3.1 获取分类列表
```http
GET /api/mcp/categories
```

**权限要求**: 需要认证

**响应示例**:
```json
{
  "data": [
    {
      "id": "1",
      "categoryId": "cat_dev",
      "name": "开发工具",
      "description": "代码开发相关工具",
      "icon": "🛠️",
      "sortOrder": 1,
      "mcpCount": 25
    }
  ]
}
```

### 4. MCP 标签 API

#### 4.1 获取标签列表
```http
GET /api/mcp/tags
```

**权限要求**: 需要认证

**查询参数**:
- `search` (string, optional): 搜索关键词

**响应示例**:
```json
{
  "data": [
    {
      "id": "1",
      "name": "git",
      "color": "#f97316",
      "usageCount": 15
    }
  ]
}
```

#### 4.2 创建标签
```http
POST /api/mcp/tags
```

**权限要求**: 需要认证

**请求体**:
```json
{
  "name": "git",
  "color": "#f97316"
}
```

### 5. MCP 工具和资源 API

#### 5.1 获取 MCP 工具列表
```http
GET /api/mcp/services/:mcpId/tools
```

**权限要求**: 需要认证

**响应示例**:
```json
{
  "data": [
    {
      "id": "1",
      "toolName": "create_issue",
      "toolDescription": "创建 GitHub Issue",
      "toolSchema": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "body": { "type": "string" }
        },
        "required": ["title"]
      }
    }
  ]
}
```

#### 5.2 获取 MCP 资源列表
```http
GET /api/mcp/services/:mcpId/resources
```

**权限要求**: 需要认证

**响应示例**:
```json
{
  "data": [
    {
      "id": "1",
      "resourceName": "repositories",
      "resourceType": "list",
      "resourceDescription": "用户的仓库列表"
    }
  ]
}
```

## 前端目录结构

### 功能模块目录：`src/features/mcp-management/`

```
src/features/mcp-management/
├── index.tsx                          # 主页面入口（包含 Tabs 切换）
├── types/
│   └── index.ts                       # TypeScript 类型定义
├── api/
│   ├── mcp-services.api.ts           # MCP 服务相关 API
│   ├── mcp-marketplace.api.ts        # MCP 市场相关 API
│   ├── mcp-categories.api.ts         # 分类相关 API
│   └── mcp-tags.api.ts               # 标签相关 API
├── hooks/
│   ├── use-mcp-services.ts           # MCP 服务数据 Hook
│   ├── use-mcp-marketplace.ts        # 市场数据 Hook
│   ├── use-mcp-health-check.ts       # 健康检查 Hook
│   └── use-mcp-operations.ts         # MCP 操作 Hook（装载/卸载/重启）
├── components/
│   ├── my-mcps/                      # 我的 MCP 模块
│   │   ├── my-mcps-list.tsx         # MCP 列表容器
│   │   ├── mcp-card.tsx             # MCP 卡片组件
│   │   ├── mcp-search-bar.tsx       # 搜索和排序工具栏
│   │   └── mcp-empty-state.tsx      # 空状态组件
│   ├── marketplace/                  # MCP 市场模块
│   │   ├── marketplace-layout.tsx   # 市场布局（左右分栏）
│   │   ├── category-sidebar.tsx     # 分类侧边栏
│   │   ├── marketplace-list.tsx     # 市场列表
│   │   └── marketplace-card.tsx     # 市场卡片组件
│   ├── detail/                       # MCP 详情模块
│   │   ├── mcp-detail-page.tsx      # 详情页面
│   │   ├── detail-header.tsx        # 详情头部
│   │   ├── detail-overview.tsx      # 概览 Tab
│   │   ├── detail-tools.tsx         # 工具列表 Tab
│   │   ├── detail-sessions.tsx      # 关联会话 Tab
│   │   ├── detail-config.tsx        # 配置与日志 Tab
│   │   └── tool-schema-viewer.tsx   # JSON Schema 查看器
│   ├── dialogs/                      # 对话框组件
│   │   ├── create-mcp-dialog.tsx    # 创建/导入 MCP 对话框
│   │   ├── load-mcp-dialog.tsx      # 装载 MCP 对话框
│   │   ├── config-mcp-dialog.tsx    # 配置 MCP 对话框
│   │   └── delete-mcp-dialog.tsx    # 删除确认对话框
│   └── shared/                       # 共享组件
│       ├── health-status-badge.tsx  # 健康状态徽章
│       ├── deployment-badge.tsx     # 部署类型徽章
│       ├── language-icon.tsx        # 语言图标
│       ├── icon-picker.tsx          # 图标选择器（emoji）
│       └── tag-input.tsx            # 标签输入组件
└── config/
    └── constants.ts                  # 常量配置（状态映射、颜色等）
```

### 路由文件：`src/routes/_authenticated/mcp-management/`

```
src/routes/_authenticated/mcp-management/
├── index.tsx                         # MCP 管理主页（我的 MCP + 市场）
└── $mcpId.tsx                        # MCP 详情页（动态路由）
```

### 核心类型定义示例：`src/features/mcp-management/types/index.ts`

```typescript
// MCP 服务类型
export interface McpService {
  id: string;
  mcpId: string;
  name: string;
  description?: string;
  icon?: string;
  version?: string;
  language?: string;
  transportType: 'stdio' | 'sse' | 'websocket';
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  categoryId?: string;
  categoryName?: string;
  tags: string[];
  lastHealthCheckAt?: string;
  healthCheckResult?: HealthCheckResult;
  createdAt: string;
  createdByUser?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

// 健康检查结果
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  latency: number;
  message: string;
}

// MCP 市场项目
export interface McpMarketplaceItem {
  id: string;
  mcpId: string;
  name: string;
  description?: string;
  icon?: string;
  categoryName: string;
  tags: string[];
  installationCount: number;
  isVerified: boolean;
  creatorUsername: string;
  createdAt: string;
}

// MCP 工具定义
export interface McpTool {
  id: string;
  toolName: string;
  toolDescription?: string;
  toolSchema: Record<string, any>;
}

// MCP 资源定义
export interface McpResource {
  id: string;
  resourceName: string;
  resourceType: string;
  resourceDescription?: string;
}
```

## 后端目录结构

### 服务端目录：`server/`

```
server/
├── routes/
│   └── mcp.routes.ts                 # MCP 路由定义
├── controllers/
│   ├── mcp-services.controller.ts    # MCP 服务控制器
│   ├── mcp-marketplace.controller.ts # MCP 市场控制器
│   ├── mcp-categories.controller.ts  # 分类控制器
│   └── mcp-tags.controller.ts        # 标签控制器
├── services/
│   ├── mcp-services.service.ts       # MCP 服务业务逻辑
│   ├── mcp-marketplace.service.ts    # 市场业务逻辑
│   ├── mcp-health-check.service.ts   # 健康检查服务
│   └── mcp-connection.service.ts     # MCP 连接管理服务
├── repositories/
│   ├── mcp-services.repository.ts    # MCP 服务数据访问层
│   ├── mcp-tools.repository.ts       # 工具数据访问层
│   ├── mcp-resources.repository.ts   # 资源数据访问层
│   ├── mcp-categories.repository.ts  # 分类数据访问层
│   ├── mcp-tags.repository.ts        # 标签数据访问层
│   └── mcp-marketplace.repository.ts # 市场数据访问层
├── types/
│   └── mcp.types.ts                  # MCP 相关类型定义
└── utils/
    ├── mcp-validator.ts              # MCP 配置验证工具
    └── mcp-encryption.ts             # 认证信息加密工具
```

### 核心代码示例

#### 1. 路由定义：`server/routes/mcp.routes.ts`

```typescript
import { Router } from 'express';
import { McpServicesController } from '../controllers/mcp-services.controller.js';
import { McpMarketplaceController } from '../controllers/mcp-marketplace.controller.js';
import { McpCategoriesController } from '../controllers/mcp-categories.controller.js';
import { McpTagsController } from '../controllers/mcp-tags.controller.js';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';

const router = Router();

// 所有 MCP 路由都需要认证
router.use(jwtAuthMiddleware);

// MCP 服务管理路由
router.get('/my-services', McpServicesController.getMyServices);
router.post('/services', McpServicesController.createService);
router.get('/services/:mcpId', McpServicesController.getServiceDetail);
router.put('/services/:mcpId', McpServicesController.updateService);
router.delete('/services/:mcpId', McpServicesController.deleteService);
router.post('/services/:mcpId/health-check', McpServicesController.healthCheck);
router.post('/services/:mcpId/restart', McpServicesController.restartService);
router.post('/services/:mcpId/load', McpServicesController.loadToSessions);
router.post('/services/:mcpId/unload', McpServicesController.unloadFromSessions);

// MCP 工具和资源路由
router.get('/services/:mcpId/tools', McpServicesController.getTools);
router.get('/services/:mcpId/resources', McpServicesController.getResources);

// MCP 市场路由
router.get('/marketplace', McpMarketplaceController.getMarketplaceList);

// 分类路由
router.get('/categories', McpCategoriesController.getCategories);

// 标签路由
router.get('/tags', McpTagsController.getTags);
router.post('/tags', McpTagsController.createTag);

export default router;
```

#### 2. Repository 层示例：`server/repositories/mcp-services.repository.ts`

```typescript
import { BaseRepository } from './base.repository.js';
import { Prisma } from '@prisma/client';

export class McpServicesRepository extends BaseRepository<'mcpService'> {
  constructor() {
    super('mcpService');
  }

  /**
   * 获取用户的 MCP 服务列表（带分页和筛选）
   */
  async findUserServices(userId: bigint, options: {
    search?: string;
    status?: string;
    language?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }) {
    const { search, status, language, sortBy = 'createdAt', sortOrder = 'desc', page = 1, pageSize = 20 } = options;

    const where: Prisma.McpServiceWhereInput = {
      createdByUserId: userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status: status as any }),
      ...(language && { language }),
    };

    const [data, total] = await Promise.all([
      this.prisma.mcpService.findMany({
        where,
        include: {
          category: true,
          creator: {
            select: { id: true, username: true, avatar: true },
          },
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mcpService.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取 MCP 服务详情（包含工具、资源、关联会话）
   */
  async findDetailById(id: bigint) {
    return this.prisma.mcpService.findUnique({
      where: { id },
      include: {
        category: true,
        creator: {
          select: { id: true, username: true, avatar: true },
        },
        tags: {
          include: { tag: true },
        },
        mcpTools: true,
        mcpResources: true,
        sessionMcps: {
          include: {
            // 注意：需要在 Prisma schema 中添加 session 关联
          },
        },
      },
    });
  }
}
```

## 权限控制设计

### 权限定义

基于现有的 RBAC 权限系统，需要在 `permissions` 表中添加以下权限：

| 权限代码 | 权限名称 | 资源 | 操作 | 模块 | 说明 |
|---------|---------|------|------|------|------|
| `mcp:read` | 查看 MCP | mcp | read | mcp-management | 查看 MCP 列表和详情 |
| `mcp:create` | 创建 MCP | mcp | create | mcp-management | 创建新的 MCP 服务 |
| `mcp:update` | 更新 MCP | mcp | update | mcp-management | 更新 MCP 配置 |
| `mcp:delete` | 删除 MCP | mcp | delete | mcp-management | 删除 MCP 服务 |
| `mcp:manage` | 管理 MCP | mcp | manage | mcp-management | 重启、健康检查等管理操作 |
| `mcp:load` | 装载 MCP | mcp | load | mcp-management | 装载 MCP 到会话 |
| `mcp:marketplace` | 访问市场 | mcp | marketplace | mcp-management | 访问 MCP 市场 |

### 权限规则

1. **基础权限**：
   - 所有认证用户默认拥有 `mcp:read` 和 `mcp:marketplace` 权限
   - 用户可以查看自己创建的 MCP 服务

2. **创建权限**：
   - 拥有 `mcp:create` 权限的用户可以创建 MCP 服务
   - 创建者自动成为该 MCP 的所有者

3. **修改权限**：
   - MCP 创建者可以更新和删除自己的 MCP
   - 管理员（拥有 `mcp:update` 和 `mcp:delete`）可以管理所有 MCP

4. **装载权限**：
   - 拥有 `mcp:load` 权限的用户可以装载 MCP 到自己的会话
   - 只能装载到自己拥有的会话
