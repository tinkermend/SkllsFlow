# MCP 管理数据库字段映射表

## 概述
本文档详细说明了 MCP 管理系统的数据库表结构和字段映射关系。

---

## 1. mcp_services（MCP 服务主表）

### 现有字段（来自原 schema）
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键 ID | PRIMARY KEY, AUTO_INCREMENT |
| mcp_id | VARCHAR(64) | MCP 服务唯一标识符 | UNIQUE, NOT NULL |
| name | VARCHAR(120) | MCP 服务名称 | UNIQUE, NOT NULL |
| description | TEXT | MCP 服务描述说明 | - |
| version | VARCHAR(50) | 服务版本号或协议版本 | - |
| transport_type | ENUM | 传输类型：stdio/sse/websocket | NOT NULL |
| connection_config | JSONB | 连接细节配置 | NOT NULL |
| env_vars | JSONB | 环境变量（仅 stdio 模式） | DEFAULT '{}' |
| encrypted_auth_info | TEXT | 认证凭证（加密） | - |
| cached_capabilities | JSONB | 能力快照（Tools/Resources） | DEFAULT '{}' |
| status | ENUM | 服务状态：active/inactive/error/maintenance | DEFAULT 'inactive' |
| last_health_check_at | TIMESTAMP | 最后健康检查时间 | - |
| health_check_result | JSONB | 健康检查结果 | - |
| error_message | TEXT | 错误信息 | - |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP | 更新时间 | AUTO UPDATE |

### 新增扩展字段
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| category_id | BIGINT | 分类 ID | FK -> mcp_categories.id |
| icon | VARCHAR(200) | 图标（emoji 或 URL） | - |
| language | VARCHAR(50) | 开发语言：python/javascript/go/other | - |
| created_by_user_id | BIGINT | 创建者用户 ID | FK -> users.id |

### 关联关系
- **一对多**: mcp_tools（工具列表）
- **一对多**: mcp_resources（资源列表）
- **多对多**: mcp_tags（通过 mcp_service_tags）
- **一对一**: mcp_marketplace_items（市场信息）
- **多对一**: mcp_categories（所属分类）
- **多对一**: users（创建者）

---

## 2. mcp_categories（MCP 分类表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PRIMARY KEY |
| category_id | VARCHAR(64) | 分类唯一标识符 | UNIQUE, NOT NULL |
| name | VARCHAR(120) | 分类名称 | NOT NULL |
| description | TEXT | 分类描述 | - |
| icon | VARCHAR(100) | 分类图标 | - |
| sort_order | INT | 排序权重（越小越靠前） | DEFAULT 0 |
| status | VARCHAR(20) | 状态：active/disabled | DEFAULT 'active' |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP | 更新时间 | AUTO UPDATE |

### 关联关系
- **一对多**: mcp_services（该分类下的服务）
- **一对多**: mcp_marketplace_items（该分类下的市场项目）

### 默认数据
```
search - 搜索工具
database - 数据库
productivity - 生产力
devtools - 开发工具
communication - 通信
ai-ml - AI/ML
storage - 存储
monitoring - 监控
security - 安全
other - 其他
```

---

## 3. mcp_tags（MCP 标签表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PRIMARY KEY |
| name | VARCHAR(50) | 标签名称 | UNIQUE, NOT NULL |
| color | VARCHAR(7) | 标签颜色（十六进制） | - |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |

### 关联关系
- **多对多**: mcp_services（通过 mcp_service_tags）

### 默认数据
```
主机 - #3b82f6
测试版 - #f97316
稳定版 - #10b981
中间件 - #4285f4
缓存与消息 - #00a1f1
应用服务 - #ff9900
数据库 - #ef4444
```

---

## 4. mcp_service_tags（MCP 服务标签关联表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| mcp_id | BIGINT | MCP 服务 ID | FK -> mcp_services.id, PRIMARY KEY |
| tag_id | BIGINT | 标签 ID | FK -> mcp_tags.id, PRIMARY KEY |
| created_at | TIMESTAMP | 关联创建时间 | DEFAULT NOW() |

### 关联关系
- **多对一**: mcp_services
- **多对一**: mcp_tags

---

## 5. mcp_tools（MCP 工具定义表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PRIMARY KEY |
| mcp_id | BIGINT | MCP 服务 ID | FK -> mcp_services.id, NOT NULL |
| tool_name | VARCHAR(120) | 工具名称 | NOT NULL |
| tool_description | TEXT | 工具描述 | - |
| tool_schema | JSONB | 工具参数 JSON Schema 定义 | NOT NULL |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |

### 约束
- UNIQUE(mcp_id, tool_name) - 同一 MCP 下工具名称唯一

### 关联关系
- **多对一**: mcp_services

### tool_schema 示例
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "搜索查询字符串"
    },
    "limit": {
      "type": "integer",
      "description": "返回结果数量",
      "default": 10
    }
  },
  "required": ["query"]
}
```

---

## 6. mcp_resources（MCP 资源定义表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PRIMARY KEY |
| mcp_id | BIGINT | MCP 服务 ID | FK -> mcp_services.id, NOT NULL |
| resource_name | VARCHAR(120) | 资源名称 | NOT NULL |
| resource_type | VARCHAR(50) | 资源类型 | NOT NULL |
| resource_description | TEXT | 资源描述 | - |
| resource_schema | JSONB | 资源模式定义（可选） | - |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |

### 约束
- UNIQUE(mcp_id, resource_name) - 同一 MCP 下资源名称唯一

### 关联关系
- **多对一**: mcp_services

### resource_type 常见值
- `file` - 文件资源
- `database` - 数据库资源
- `api` - API 端点
- `config` - 配置资源

---

## 7. mcp_marketplace_items（MCP 市场项目表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PRIMARY KEY |
| mcp_id | BIGINT | MCP 服务 ID | FK -> mcp_services.id, UNIQUE, NOT NULL |
| creator_user_id | BIGINT | 创建者用户 ID | FK -> users.id |
| category_id | BIGINT | 分类 ID | FK -> mcp_categories.id |
| downloads_count | INT | 下载/安装次数 | DEFAULT 0 |
| is_verified | BOOLEAN | 是否已验证 | DEFAULT FALSE |
| repository_url | VARCHAR(500) | 代码仓库 URL | - |
| documentation_url | VARCHAR(500) | 文档 URL | - |
| readme_content | TEXT | README 文档内容（Markdown） | - |
| installation_count | INT | 安装次数 | DEFAULT 0 |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP | 更新时间 | AUTO UPDATE |

### 关联关系
- **一对一**: mcp_services（对应的服务）
- **多对一**: users（创建者）
- **多对一**: mcp_categories（所属分类）

### 字段说明
- `downloads_count`: 累计下载次数（历史总和）
- `installation_count`: 当前安装次数（活跃安装）
- `is_verified`: 官方验证标识

---

## 表关系图

```
users (用户表)
  ├─→ mcp_services.created_by_user_id (创建的 MCP)
  └─→ mcp_marketplace_items.creator_user_id (创建的市场项目)

mcp_categories (分类表)
  ├─→ mcp_services.category_id (分类下的服务)
  └─→ mcp_marketplace_items.category_id (分类下的市场项目)

mcp_services (MCP 服务主表)
  ├─→ mcp_tools (工具列表)
  ├─→ mcp_resources (资源列表)
  ├─→ mcp_service_tags (标签关联)
  ├─→ mcp_marketplace_items (市场信息)
  ├─→ session_mcps (会话关联)
  ├─← mcp_categories (所属分类)
  └─← users (创建者)

mcp_tags (标签表)
  └─→ mcp_service_tags (服务关联)

mcp_marketplace_items (市场项目表)
  ├─← mcp_services (对应服务)
  ├─← users (创建者)
  └─← mcp_categories (所属分类)
```

---

## 索引列表

### mcp_categories
- `idx_mcp_categories_status` - status
- `idx_mcp_categories_sort` - sort_order

### mcp_services
- `idx_mcp_services_category` - category_id
- `idx_mcp_services_creator` - created_by_user_id
- `idx_mcp_services_language` - language

### mcp_tools
- `idx_mcp_tools_mcp_id` - mcp_id

### mcp_resources
- `idx_mcp_resources_mcp_id` - mcp_id

### mcp_service_tags
- `idx_mcp_service_tags_mcp_id` - mcp_id
- `idx_mcp_service_tags_tag_id` - tag_id

### mcp_marketplace_items
- `idx_mcp_marketplace_category` - category_id
- `idx_mcp_marketplace_creator` - creator_user_id
- `idx_mcp_marketplace_downloads` - downloads_count

---

## 触发器

### update_updated_at_column()
自动更新 `updated_at` 字段的触发器函数。

应用于以下表：
- `mcp_categories`
- `mcp_marketplace_items`

---

## 常见查询示例

### 1. 获取某分类下的所有 MCP（含标签）
```sql
SELECT
    m.id,
    m.mcp_id,
    m.name,
    m.description,
    m.icon,
    m.language,
    m.status,
    c.name as category_name,
    array_agg(t.name) as tags
FROM aiops.mcp_services m
LEFT JOIN aiops.mcp_categories c ON m.category_id = c.id
LEFT JOIN aiops.mcp_service_tags mst ON m.id = mst.mcp_id
LEFT JOIN aiops.mcp_tags t ON mst.tag_id = t.id
WHERE c.category_id = 'database'
  AND m.status = 'active'
GROUP BY m.id, m.mcp_id, m.name, m.description, m.icon, m.language, m.status, c.name;
```

### 2. 获取 MCP 详情（含工具和资源）
```sql
SELECT
    m.*,
    json_agg(DISTINCT jsonb_build_object(
        'name', mt.tool_name,
        'description', mt.tool_description,
        'schema', mt.tool_schema
    )) FILTER (WHERE mt.id IS NOT NULL) as tools,
    json_agg(DISTINCT jsonb_build_object(
        'name', mr.resource_name,
        'type', mr.resource_type,
        'description', mr.resource_description
    )) FILTER (WHERE mr.id IS NOT NULL) as resources
FROM aiops.mcp_services m
LEFT JOIN aiops.mcp_tools mt ON m.id = mt.mcp_id
LEFT JOIN aiops.mcp_resources mr ON m.id = mr.mcp_id
WHERE m.mcp_id = 'your-mcp-id'
GROUP BY m.id;
```

### 3. 市场列表查询（分页）
```sql
SELECT
    m.id,
    m.name,
    m.description,
    m.icon,
    c.name as category_name,
    mp.downloads_count,
    mp.is_verified,
    u.username as creator_name
FROM aiops.mcp_services m
INNER JOIN aiops.mcp_marketplace_items mp ON m.id = mp.mcp_id
LEFT JOIN aiops.mcp_categories c ON m.category_id = c.id
LEFT JOIN aiops.users u ON mp.creator_user_id = u.id
WHERE m.status = 'active'
ORDER BY mp.downloads_count DESC
LIMIT 20 OFFSET 0;
```

---

## 数据完整性约束

### 外键级联规则
- `mcp_services.category_id` → `mcp_categories.id`: ON DELETE SET NULL
- `mcp_services.created_by_user_id` → `users.id`: ON DELETE SET NULL
- `mcp_tools.mcp_id` → `mcp_services.id`: ON DELETE CASCADE
- `mcp_resources.mcp_id` → `mcp_services.id`: ON DELETE CASCADE
- `mcp_service_tags.mcp_id` → `mcp_services.id`: ON DELETE CASCADE
- `mcp_service_tags.tag_id` → `mcp_tags.id`: ON DELETE CASCADE
- `mcp_marketplace_items.mcp_id` → `mcp_services.id`: ON DELETE CASCADE
- `mcp_marketplace_items.creator_user_id` → `users.id`: ON DELETE SET NULL
- `mcp_marketplace_items.category_id` → `mcp_categories.id`: ON DELETE SET NULL

### 唯一性约束
- `mcp_services.mcp_id` - 全局唯一
- `mcp_services.name` - 全局唯一
- `mcp_categories.category_id` - 全局唯一
- `mcp_tags.name` - 全局唯一
- `(mcp_id, tool_name)` - 组合唯一
- `(mcp_id, resource_name)` - 组合唯一
- `(mcp_id, tag_id)` - 组合唯一
- `mcp_marketplace_items.mcp_id` - 全局唯一（一对一关系）
