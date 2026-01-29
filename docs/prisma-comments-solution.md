# Prisma 数据库注释完整解决方案

## 问题描述

Prisma 7.x 的 `///` 注释语法只会生成 TypeScript JSDoc，不会自动转换为 PostgreSQL 的 `COMMENT ON` 语句。

## 解决方案

### 方案 1：自动化脚本（推荐）

#### 1. 使用自动生成脚本

已创建脚本：`scripts/generate-db-comments.ts`

**运行方式**：

```bash
# 生成注释迁移文件
pnpm tsx scripts/generate-db-comments.ts

# 应用迁移
pnpm prisma migrate deploy
```

**工作流程**：
1. 脚本读取 `prisma/schema.prisma`
2. 提取所有 `///` 注释
3. 生成 `COMMENT ON TABLE` 和 `COMMENT ON COLUMN` 语句
4. 创建新的迁移文件

#### 2. 集成到开发流程

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:comments": "tsx scripts/generate-db-comments.ts && prisma migrate deploy",
    "db:migrate:full": "prisma migrate dev && tsx scripts/generate-db-comments.ts && prisma migrate deploy"
  }
}
```

**使用方式**：

```bash
# 标准迁移（不含注释）
pnpm db:migrate

# 仅生成并应用注释
pnpm db:comments

# 完整迁移（包含注释）
pnpm db:migrate:full
```

### 方案 2：手动迁移（当前已完成）

已为当前数据库创建注释迁移：

```bash
# 应用已创建的注释迁移
pnpm prisma migrate deploy
```

迁移文件位置：
```
prisma/migrations/20260129183321_add_table_and_column_comments/migration.sql
```

### 方案 3：使用 Prisma 扩展（未来方案）

等待 Prisma 官方支持或使用社区扩展：

```typescript
// 未来可能的方案
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["databaseComments"] // 假设未来支持
}
```

## 最佳实践

### 1. 开发流程

**修改 Schema 后**：

```bash
# 步骤 1：创建迁移
pnpm prisma migrate dev --name your_migration_name

# 步骤 2：生成注释迁移
pnpm tsx scripts/generate-db-comments.ts

# 步骤 3：应用注释迁移
pnpm prisma migrate deploy
```

### 2. 注释规范

在 `schema.prisma` 中保持规范的注释格式：

```prisma
/// 表注释：简洁描述表的用途
model User {
  /// 字段注释：描述字段含义和约束
  id BigInt @id @default(autoincrement())

  /// 用户名，唯一标识
  username String @unique

  @@schema("aiops")
  @@map("users")
}
```

### 3. CI/CD 集成

在部署流程中添加注释生成：

```yaml
# .github/workflows/deploy.yml
- name: Apply database migrations
  run: |
    pnpm prisma migrate deploy
    pnpm tsx scripts/generate-db-comments.ts
    pnpm prisma migrate deploy
```

## 验证注释

### 查看表注释

```sql
SELECT
  obj_description(c.oid) as table_comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'aiops'
  AND c.relname = 'users';
```

### 查看字段注释

```sql
SELECT
  a.attname as column_name,
  col_description(c.oid, a.attnum) as column_comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = 'aiops'
  AND c.relname = 'users'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;
```

### 使用 psql 查看

```bash
# 连接数据库
psql -U your_user -d aiops

# 查看表结构和注释
\d+ aiops.users

# 查看所有表的注释
\dt+ aiops.*
```

## 常见问题

### Q1: 为什么 Prisma 不自动生成注释？

A: Prisma 的设计理念是保持 Schema 与数据库的单向同步，`///` 注释主要用于代码生成，不涉及数据库元数据。

### Q2: 注释会影响性能吗？

A: 不会。PostgreSQL 的注释存储在系统表中，不影响查询性能。

### Q3: 如何批量更新注释？

A: 修改 `schema.prisma` 后，重新运行 `pnpm tsx scripts/generate-db-comments.ts` 即可。

### Q4: 注释支持多语言吗？

A: 支持。PostgreSQL 注释支持 UTF-8，可以使用中文、英文等任意语言。

## 参考资料

- [Prisma Schema 文档](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [PostgreSQL COMMENT 文档](https://www.postgresql.org/docs/current/sql-comment.html)
- [Prisma GitHub Issue #8703](https://github.com/prisma/prisma/issues/8703)
