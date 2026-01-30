# MCP 管理数据库迁移指南

## 概述
本文档提供了将现有 MCP 管理功能扩展到完整 MCP 管理中心的数据库迁移方案。

## 数据库表结构

### 核心表
1. **mcp_services** - 扩展现有表，添加分类、图标、语言等字段
2. **mcp_categories** - MCP 服务分类表
3. **mcp_tags** - 标签表
4. **mcp_tools** - MCP 工具定义表
5. **mcp_resources** - MCP 资源定义表
6. **mcp_marketplace_items** - MCP 市场项目表

### 关联表
1. **mcp_service_tags** - MCP 服务与标签关联
2. **mcp_ratings** - 用户评分表
3. **mcp_favorites** - 用户收藏表

## 迁移步骤

### 第一步：备份现有数据
```bash
# 创建备份
git add .
git commit -m "备份：MCP 迁移前的数据库状态"
```

### 第二步：执行 SQL 迁移脚本
```bash
# 在 PostgreSQL 中执行迁移脚本
psql -U your_username -d your_database -f docs/MCP管理/mcp_database_schema.sql
```

### 第三步：更新 Prisma Schema

1. 打开 `prisma/schema.prisma` 文件
2. 在文件末尾添加 MCP 扩展表定义（从 `mcp_prisma_schema_extension.prisma` 复制内容）
3. 更新现有模型关系：

#### 更新 McpService 模型
在现有的 `McpService` 模型末尾添加以下内容：
```prisma
  // 扩展字段
  categoryId      BigInt?              @map("category_id")
  icon            String?              @db.VarChar(200)
  language        String?              @db.VarChar(50) // python, javascript, go, other
  createdByUserId BigInt?              @map("created_by_user_id")

  // 新关联关系
  category        McpCategory?         @relation(fields: [categoryId], references: [id])
  creator         User?                @relation(fields: [createdByUserId], references: [id], onDelete: SetNull)
  mcpTools        McpTool[]
  mcpResources    McpResource[]
  tags            McpServiceTag[]
  marketplaceItem McpMarketplaceItem?

  @@index([categoryId])
  @@index([createdByUserId])
  @@index([language])
```

#### 更新 User 模型
在 `User` 模型末尾添加 MCP 相关关系：
```prisma
  // MCP 相关
  mcpMarketplaceItems McpMarketplaceItem[] @relation("MarketplaceCreator")
  mcpRatings          McpRating[]
  mcpFavorites        McpFavorite[]
```

### 第四步：生成并应用 Prisma 迁移
```bash
# 生成新的迁移
pnpm prisma migrate dev --name add-mcp-management-features

# 验证迁移
pnpm prisma generate
```

### 第五步：更新代码中的模型引用

由于新增了关联关系，需要更新 Repository 模式：

#### 创建 McpCategoryRepository
```typescript
// server/repositories/mcp-category.repository.ts
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../services/database.service';
import { McpCategory } from '@prisma/client';

export class McpCategoryRepository extends BaseRepository<McpCategory> {
  constructor() {
    super(DatabaseService.getInstance().prisma.mcpCategory);
  }

  async findByCategoryId(categoryId: string) {
    return this.model.findUnique({ where: { categoryId } });
  }

  async findActiveCategories() {
    return this.model.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' }
    });
  }
}
```

#### 创建 McpMarketplaceItemRepository
```typescript
// server/repositories/mcp-marketplace-item.repository.ts
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../services/database.service';
import { McpMarketplaceItem } from '@prisma/client';

export class McpMarketplaceItemRepository extends BaseRepository<McpMarketplaceItem> {
  constructor() {
    super(DatabaseService.getInstance().prisma.mcpMarketplaceItem);
  }

  async findWithDetails(itemId: number) {
    return this.model.findUnique({
      where: { id: itemId },
      include: {
        mcpService: {
          include: {
            category: true,
            mcpTools: true,
            mcpResources: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
  }

  async findByCategory(categoryId: number) {
    return this.model.findMany({
      where: { categoryId },
      include: {
        mcpService: true,
        creator: true
      },
      orderBy: { ratingAverage: 'desc' }
    });
  }
}
```

## 数据迁移脚本

### 迁移现有 MCP 数据
```sql
-- 迁移脚本：为现有 MCP 服务添加默认值
UPDATE aiops.mcp_services
SET
  language = 'python',
  category_id = (SELECT id FROM aiops.mcp_categories WHERE category_id = 'other'),
  icon = '🛠️',
  created_by_user_id = (SELECT id FROM aiops.users LIMIT 1)
WHERE created_by_user_id IS NULL;
```

### 创建默认市场条目
```sql
-- 为现有 MCP 服务创建市场条目
INSERT INTO aiops.mcp_marketplace_items (
  mcp_id,
  creator_user_id,
  category_id,
  readme_content
)
SELECT
  id,
  created_by_user_id,
  category_id,
  '### ' || name || '\n\n' || COALESCE(description, '暂无描述')
FROM aiops.mcp_services
WHERE NOT EXISTS (
  SELECT 1 FROM aiops.mcp_marketplace_items
  WHERE mcp_id = aiops.mcp_services.id
);
```

## API 端点更新

为了支持新的 MCP 管理功能，需要添加以下 API 端点：

### MCP 市场相关
- `GET /api/mcp/marketplace` - 获取市场列表
- `GET /api/mcp/marketplace/:id` - 获取市场项目详情
- `POST /api/mcp/marketplace/:id/install` - 装载 MCP

### MCP 分类相关
- `GET /api/mcp/categories` - 获取所有分类
- `GET /api/mcp/categories/:id` - 获取分类详情

### MCP 工具和资源
- `GET /api/mcp/:id/tools` - 获取 MCP 工具列表
- `GET /api/mcp/:id/resources` - 获取 MCP 资源列表

## 前端代码结构

建议的前端目录结构：
```
src/features/mcp-management/
├── api/                    # API 调用
│   ├── mcp-marketplace.ts
│   ├── mcp-categories.ts
│   └── mcp-tools.ts
├── components/             # 页面组件
│   ├── marketplace/
│   ├── my-mcps/
│   ├── mcp-detail/
│   └── create-mcp/
├── hooks/                  # 自定义 Hooks
│   ├── use-mcp-marketplace.ts
│   ├── use-mcp-tools.ts
│   └── use-mcp-install.ts
└── types/                  # 类型定义
    └── mcp.types.ts
```

## 测试建议

### 单元测试重点
1. **Repository 测试**: 测试新的数据访问层
2. **API 端点测试**: 测试新的 RESTful 接口
3. **服务层测试**: 测试业务逻辑

### 集成测试
1. 完整的 MCP 安装流程
2. 评分系统的数据一致性
3. 收藏功能的并发处理

## 性能优化建议

1. **索引优化**: 确保所有查询都有适当的索引
2. **缓存策略**: 对热门 MCP 和评分数据使用 Redis 缓存
3. **分页**: 市场列表支持分页查询
4. **异步处理**: 大型 MCP 的安装过程使用异步队列

## 安全考虑

1. **权限控制**: 只有管理员可以创建/删除市场项目
2. **输入验证**: 严格验证所有用户输入
3. **SQL 注入防护**: 使用参数化查询
4. **XSS 防护**: 对富文本内容进行清理

## 回滚方案

如果需要回滚：
1. 备份现有数据
2. 使用 Prisma 回滚迁移：
   ```bash
   pnpm prisma migrate resolve --rolled-back 20240101000000_add_mcp_management
   ```
3. 手动删除新增的表和数据（如果需要）

## 后续规划

1. **阶段 2**: 添加 MCP 运行状态监控
2. **阶段 3**: 实现 MCP 自动发现
3. **阶段 4**: 添加 MCP 模板市场
4. **阶段 5**: 实现 MCP 协作编辑功能