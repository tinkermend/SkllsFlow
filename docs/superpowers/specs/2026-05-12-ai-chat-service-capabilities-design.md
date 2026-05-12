# 智能对话服务能力面板设计

## 背景

智能对话页面已经支持左侧选择不同智能服务，并根据当前激活服务切换对话列表。现在需要在页面最右侧展示当前服务已经加载的技能列表和 MCP 列表。用户切换智能服务时，右侧能力信息必须同步刷新。

首版范围只包含技能和 MCP，不展示 Agent。

## 目标

- 在智能对话页面右侧新增固定能力面板。
- 点击或切换左侧智能服务后，右侧面板展示该服务加载的技能和 MCP。
- 服务能力数据以服务级关系表为准：`chat_server_skills` 和 `chat_server_mcps`。
- 补齐技能和 MCP 装载、卸载时对服务级关系表的写入和清理。
- 后端接口必须校验当前登录用户只能查看自己创建的智能服务。

## 非目标

- 不展示 Agent 列表。
- 不做右侧面板折叠态。
- 不从 OpenCode 运行目录或远端服务实时扫描能力列表。
- 不把右侧面板数据来源混用为 `user_skills`。

## 前端设计

### 页面布局

在 `src/features/ai-chat/index.tsx` 中保持现有三段结构：

- 左侧：`SessionSidebar`，展示智能服务与对话列表。
- 中间：`ChatPanel`，展示当前对话。
- 右侧：新增 `ServiceCapabilityPanel`，固定宽度约 `320px`，使用 `border-l` 与聊天区分隔。

右侧面板仅在智能对话页面内存在，不影响全局 Header/Main 布局。

### 组件结构

新增组件建议：

- `src/features/ai-chat/components/service-capability-panel.tsx`
- `src/features/ai-chat/hooks/use-service-capabilities.ts`

`ServiceCapabilityPanel` 从 `useChatStore()` 获取 `activeServer`。当 `activeServer` 为空时显示空状态：`请选择一个智能服务查看能力`。

当存在当前服务时，调用 `useServiceCapabilities(activeServer.chatId)` 获取能力信息，展示：

- 面板标题：`服务能力`
- 服务名称：当前智能服务名称
- 技能列表区：数量、技能名称、描述、分类或状态
- MCP 列表区：数量、MCP 名称、描述、状态、传输类型或语言

### 交互状态

- 切换智能服务时，React Query 的 query key 使用 `['chat-server-capabilities', chatId]`，自动按服务刷新。
- 请求中展示 skeleton 或简短加载态。
- 请求失败显示错误态和重试按钮。
- 技能为空时显示 `当前服务未加载技能`。
- MCP 为空时显示 `当前服务未加载 MCP`。

## 后端设计

### API

新增接口：

```http
GET /api/chat-servers/:chatId/capabilities
```

`chatId` 使用 `chat_servers.chat_id` 的 UUID，而不是数据库自增 ID。

响应结构：

```json
{
  "chatServer": {
    "id": "1",
    "chatId": "uuid",
    "name": "代码助手"
  },
  "skills": [
    {
      "id": "10",
      "skillId": "code-review",
      "name": "代码审查",
      "description": "代码审查与风险分析",
      "icon": "Code",
      "category": "code",
      "status": "active",
      "createdAt": "2026-05-12T10:00:00.000Z"
    }
  ],
  "mcps": [
    {
      "id": "20",
      "mcpId": "github-mcp",
      "name": "GitHub MCP",
      "description": "GitHub 工具集",
      "icon": "Github",
      "status": "active",
      "transportType": "stdio",
      "language": "javascript",
      "createdAt": "2026-05-12T10:00:00.000Z"
    }
  ]
}
```

所有 BigInt 字段在 API 返回前序列化为字符串或现有项目约定的可 JSON 化类型。

### Controller

在 `server/routes/chat-server.routes.ts` 增加：

```ts
router.get('/:chatId/capabilities', (req, res) =>
  req.controller.getCapabilities(req, res)
);
```

在 `ChatServerController` 增加 `getCapabilities()`：

- 校验 `req.userId`。
- 读取 `req.params.chatId`。
- 调用 `ChatServerService.getCapabilities(chatId, userId)`。
- 复用现有 `handleError()` 输出 401、403、404、500。

### Service

在 `ChatServerService` 增加 `getCapabilities(chatId, userUuid)`：

1. 通过 `userUuid` 查询用户内部 ID。
2. 通过 `chatId` 查询 `chat_servers`。
3. 校验服务存在且 `createdBy === user.id`。
4. 查询服务关联的技能和 MCP。
5. 返回序列化 DTO。

权限失败返回 `无权访问此 ChatServer`，服务不存在返回 `ChatServer 不存在`。

### Repository

在 `ChatServerRepository` 增加 `findCapabilitiesByChatId(chatId)`，通过 Prisma include 查询：

- `chatServerSkills` -> `skill`
- `chatServerMcps` -> `mcpService`

排序按关系表 `createdAt desc`。

## 装载与卸载链路

### 技能

现有 `SkillsService.loadSkillToChatServer()` 在代理服务装载成功后会写入 `user_skills`。本次需要在同一成功路径中同步 upsert `chat_server_skills`：

- `chatServerId = chatServer.id`
- `skillId = skill.id`

如果写入服务级关系失败，应回滚远端已装载技能，并清理本次可能创建的 `user_skills` 记录，避免页面展示与运行态不一致。

技能卸载和删除流程需要同步删除 `chat_server_skills` 中的对应记录。

### MCP

MCP 装载语义调整为服务级装载，不再作为右侧面板的数据来源使用会话级关系。MCP 装载成功后写入 `chat_server_mcps`：

- `chatServerId = chatServer.id`
- `mcpId = mcpService.id`

卸载 MCP 时删除 `chat_server_mcps` 对应记录。

如果现有前端仍有“装载 MCP 到会话”的文案或参数，需要在实现阶段统一调整为“装载 MCP 到智能服务”，并传入目标 `chatId`。

## 数据一致性

- 右侧能力面板只读取 `chat_server_skills` 和 `chat_server_mcps`。
- `user_skills` 可以继续服务于“我的技能”等历史页面，但不作为智能服务能力面板的数据源。
- 删除智能服务时，现有删除流程已经清理 `chatServerSkill` 和 `chatServerMcp`，实现阶段需保留并补测试。
- Agent 暂不处理，避免扩大范围。

## 测试计划

### 后端

- `ChatServerService.getCapabilities()`：用户只能读取自己创建的服务。
- 服务不存在时返回 404。
- 无技能、无 MCP 时返回空数组。
- 有技能和 MCP 时按服务关系表返回正确字段。
- 技能装载成功后写入 `chat_server_skills`。
- MCP 装载成功后写入 `chat_server_mcps`。

### 前端

- 未选择服务时右侧面板显示空状态。
- 选择服务后调用正确 `chatId` 的能力接口。
- 切换服务后 query key 更新并刷新列表。
- 技能和 MCP 为空时分别显示空态。
- 请求失败时显示错误和重试入口。

### 验证命令

根据最终改动范围执行：

```bash
pnpm lint
pnpm test
```

如果只改后端局部测试，可先运行相关 Vitest 文件，再按需要补全量测试。
