# 技能装载服务判断问题 - 诊断指南

## 问题描述

用户在"平台技能 -> 装载技能"功能中，虽然数据库存在该用户创建的活跃服务，但页面显示"您还没有创建任何服务"。

## 已实施的修复

### 第一阶段：添加详细调试日志

已在以下关键位置添加调试日志：

#### 1. JWT 认证中间件
**文件**: `server/middleware/jwt-auth.middleware.ts`

**日志内容**:
- Authorization header 是否存在
- JWT payload 解析结果（userId, accountNo, email, type）
- 用户查询结果（id, userUUId, accountNo）
- req.userId 和 req.userInternalId 的值

#### 2. Controller 层
**文件**: `server/controllers/chat-server.controller.ts`

**日志内容**:
- req.userId 的值
- 是否调用 service.getActiveChatServers
- 返回的服务数量

#### 3. Service 层
**文件**: `server/services/chat-server.service.ts`

**日志内容**:
- 接收到的 userUuid
- 查询到的用户信息（id, userUuid, accountNo）
- 查询到的 ChatServer 数量和详情
- 过滤后的活跃服务数量

#### 4. Repository 层
**文件**:
- `server/repositories/users.repository.ts` - 用户查询日志
- `server/repositories/chat-server.repository.ts` - 服务查询日志

**日志内容**:
- 查询参数（userId）
- 查询结果数量和详情（id, chatId, name, status, createdBy）

#### 5. 前端 Hook
**文件**: `src/features/skills/hooks/use-skills.ts`

**日志内容**:
- API 调用开始
- 获取到的服务数量和详情
- 错误信息

## 诊断步骤

### 步骤 1: 启动后端服务器

```bash
pnpm dev:server
```

**预期输出**:
```
✅ Database connected
Server running on port 3001
```

### 步骤 2: 启动前端开发服务器

```bash
pnpm dev
```

前端将运行在 `http://localhost:5173`

### 步骤 3: 登录系统

1. 打开浏览器访问 `http://localhost:5173`
2. 使用您的账号登录
3. 打开浏览器开发者工具（F12）
4. 切换到 Console 标签

### 步骤 4: 测试技能装载功能

1. 导航到"技能管理 -> 平台技能"
2. 点击任意技能的"装载技能"按钮
3. **观察以下位置**：

#### 后端控制台日志
```
[DEBUG] jwtAuthMiddleware - 开始验证 JWT
[DEBUG] jwtAuthMiddleware - authHeader: 存在
[DEBUG] jwtAuthMiddleware - token 提取成功
[DEBUG] jwtAuthMiddleware - payload: { userId: 'xxx', accountNo: 'xxx', email: 'xxx', type: 'access' }
[DEBUG] findByUserId - 查询用户，userId: xxx
[DEBUG] findByUserId - 找到用户: { id: 'xxx', userUUId: 'xxx', accountNo: 'xxx', email: 'xxx' }
[DEBUG] jwtAuthMiddleware - req.userId: xxx
[DEBUG] jwtAuthMiddleware - req.userInternalId: xxx
[DEBUG] getActive - req.userId: xxx
[DEBUG] getActiveChatServers - userUuid: xxx
[DEBUG] findByUserId - userId: xxx
[DEBUG] findByUserId - result count: X
[DEBUG] getActiveChatServers - chatServers count: X
[DEBUG] getActiveChatServers - activeServers count: X
```

#### 前端控制台日志
```
[DEBUG] useActiveChatServers - 调用 API
[DEBUG] useActiveChatServers - 获取到服务: X [...]
```

#### Network 标签
1. 切换到 Network 标签
2. 找到 `/api/chat-servers/active` 请求
3. 检查：
   - 状态码（应该是 200）
   - Response 数据（应该包含服务列表）
   - Request Headers 中的 Authorization token

### 步骤 5: 验证数据库数据（可选）

如果后端日志显示查询结果为 0，但您确定数据库中存在记录，请执行以下 SQL 查询：

```sql
-- 1. 查询当前用户的 UUID 和数据库 ID
SELECT id, user_uuid, account_no, email
FROM aiops.users
WHERE user_uuid = '<从日志中获取的 userUuid>';

-- 2. 查询该用户创建的 ChatServer
SELECT id, chat_id, name, status, created_by
FROM aiops.chat_servers
WHERE created_by = <上一步查询到的用户ID>
  AND status = 'active';
```

## 常见问题诊断

### 问题 1: 后端日志显示 "未找到用户"

**可能原因**:
- JWT token 中的 userId 与数据库 `users.user_uuid` 不匹配
- 数据库中用户记录已被删除

**解决方法**:
1. 检查 JWT payload 中的 userId
2. 执行 SQL 查询验证用户是否存在
3. 重新登录获取新的 token

### 问题 2: 后端日志显示用户存在，但服务数量为 0

**可能原因**:
- `chat_servers` 表中 `created_by` 字段与用户 ID 不匹配
- 服务的状态不是 `active`
- Repository 查询条件有误

**解决方法**:
1. 执行 SQL 查询验证服务记录
2. 检查服务的 `status` 字段值
3. 检查 `created_by` 字段值是否正确

### 问题 3: 前端显示错误提示

**可能原因**:
- API 请求失败（401/404/500）
- 网络连接问题
- Token 过期

**解决方法**:
1. 检查 Network 标签中的请求状态码
2. 查看后端日志中的错误信息
3. 重新登录获取新的 token

## 使用测试脚本（可选）

如果需要直接测试 API（不通过浏览器），可以使用提供的测试脚本：

```bash
# 1. 从浏览器开发者工具中获取 JWT token
#    Application -> Local Storage -> http://localhost:5173 -> access_token

# 2. 运行测试脚本
./test-api.sh "your_jwt_token_here"
```

## 预期的正确输出

当一切正常时，您应该看到：

### 后端日志
```
[DEBUG] jwtAuthMiddleware - 开始验证 JWT
[DEBUG] jwtAuthMiddleware - authHeader: 存在
[DEBUG] jwtAuthMiddleware - payload: { userId: '123e4567-e89b-12d3-a456-426614174000', accountNo: 'user001', email: 'user@example.com', type: 'access' }
[DEBUG] findByUserId - 查询用户，userId: 123e4567-e89b-12d3-a456-426614174000
[DEBUG] findByUserId - 找到用户: { id: '1', userUUId: '123e4567-e89b-12d3-a456-426614174000', accountNo: 'user001', email: 'user@example.com' }
[DEBUG] jwtAuthMiddleware - req.userId: 123e4567-e89b-12d3-a456-426614174000
[DEBUG] jwtAuthMiddleware - req.userInternalId: 1
[DEBUG] getActive - req.userId: 123e4567-e89b-12d3-a456-426614174000
[DEBUG] getActive - 调用 service.getActiveChatServers
[DEBUG] getActiveChatServers - userUuid: 123e4567-e89b-12d3-a456-426614174000
[DEBUG] getActiveChatServers - user found: id=1, userUuid=123e4567-e89b-12d3-a456-426614174000, accountNo=user001
[DEBUG] findByUserId - userId: 1
[DEBUG] findByUserId - result count: 2
[DEBUG] findByUserId - result: [
  { id: '1', chatId: 'xxx-1', name: 'Server 1', status: 'active', createdBy: '1' },
  { id: '2', chatId: 'xxx-2', name: 'Server 2', status: 'active', createdBy: '1' }
]
[DEBUG] getActiveChatServers - chatServers count: 2
[DEBUG] getActiveChatServers - chatServers: [...]
[DEBUG] getActiveChatServers - activeServers count: 2
[DEBUG] getActive - 返回结果: 2 个服务
```

### 前端日志
```
[DEBUG] useActiveChatServers - 调用 API
[DEBUG] useActiveChatServers - 获取到服务: 2 [
  { id: '1', chatId: 'xxx-1', name: 'Server 1', status: 'active', ... },
  { id: '2', chatId: 'xxx-2', name: 'Server 2', status: 'active', ... }
]
```

### 页面显示
- 装载技能对话框正常显示
- 服务选择下拉列表中显示 2 个服务
- 可以成功选择服务并装载技能

## 下一步行动

根据诊断结果：

### 如果是 JWT 解析问题
- 检查 JWT payload 结构
- 修复 token 生成逻辑

### 如果是用户查询问题
- 检查 `userRepository.findByUserId()` 的查询字段
- 确认数据库 schema 映射

### 如果是服务查询问题
- 检查 `chatServerRepository.findByUserId()` 的查询条件
- 确认 BigInt 类型转换
- 调整状态过滤逻辑

### 如果是前端处理问题
- 改进错误提示信息
- 添加加载状态显示
- 优化用户体验

## 联系支持

如果以上步骤无法解决问题，请提供：
1. 完整的后端日志输出
2. 前端控制台日志
3. Network 请求详情
4. 数据库查询结果

---

**文档版本**: 1.0
**创建日期**: 2026-02-06
**最后更新**: 2026-02-06
