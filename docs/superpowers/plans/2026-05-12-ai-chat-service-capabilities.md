# AI Chat Service Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed right-side panel on the AI chat page that shows the selected chat server's loaded Skills and MCP services, backed by service-level relation tables.

**Architecture:** The backend exposes `GET /api/chat-servers/:chatId/capabilities`, validates ownership, and reads `chat_server_skills` plus `chat_server_mcps`. Load/unload flows write those service-level relation tables so the panel reflects real service capabilities. The frontend adds a React Query hook and a focused right panel component that refreshes whenever `activeServer.chatId` changes.

**Tech Stack:** React 19, TypeScript, TanStack Query, Zustand, shadcn/ui, Express, Prisma, PostgreSQL, Vitest.

---

## File Map

- Modify `server/repositories/chat-server.repository.ts`: add `findCapabilitiesByChatId()` for service-level relation reads.
- Modify `server/types/chat-server.types.ts`: add capability DTO types and serializers.
- Modify `server/services/chat-server.service.ts`: add `getCapabilities()` with user ownership checks.
- Modify `server/controllers/chat-server.controller.ts`: add `getCapabilities()` HTTP handler.
- Modify `server/routes/chat-server.routes.ts`: add `GET /:chatId/capabilities` before destructive routes.
- Modify `server/__tests__/unit/services/chat-server.service.test.ts`: cover capability query success, empty lists, missing server, and forbidden server.
- Modify `server/services/skills.service.ts`: write `chatServerSkill` after successful skill load and clean it during rollback/delete flows.
- Modify `server/repositories/skills.repository.ts`: delete `chatServerSkill` rows when deleting a skill.
- Modify `server/services/mcp-services.service.ts`: add service-level MCP load/unload methods that write `chatServerMcp`.
- Modify `server/controllers/mcp-services.controller.ts`: change load/unload request contract from session IDs to chat server IDs.
- Modify `server/__tests__/unit/services/mcp-services.service.test.ts`: cover service-level MCP relation writes/deletes.
- Modify `src/features/ai-chat/types/index.ts`: add service capability response types.
- Modify `src/features/ai-chat/api/chat-server.api.ts`: add `getChatServerCapabilities()`.
- Create `src/features/ai-chat/hooks/use-service-capabilities.ts`: React Query hook keyed by `chatId`.
- Create `src/features/ai-chat/components/service-capability-panel.tsx`: right-side UI panel.
- Modify `src/features/ai-chat/index.tsx`: render `ServiceCapabilityPanel` as the fixed right column.
- Create `src/features/ai-chat/components/service-capability-panel.test.tsx`: cover empty, loading, populated, and error states if the local test setup supports component rendering.
- Modify `src/features/mcp-management/api/mcp-services.api.ts`: rename load/unload helpers to service-level `chatIds`.
- Modify `src/features/mcp-management/components/dialogs/load-mcp-dialog.tsx`: replace mock sessions with active chat server selection, or defer if not reachable in current UI.

## Task 1: Backend Capability Read API

**Files:**
- Modify: `server/types/chat-server.types.ts`
- Modify: `server/repositories/chat-server.repository.ts`
- Modify: `server/services/chat-server.service.ts`
- Modify: `server/controllers/chat-server.controller.ts`
- Modify: `server/routes/chat-server.routes.ts`
- Test: `server/__tests__/unit/services/chat-server.service.test.ts`

- [ ] **Step 1: Write failing service tests for capability reads**

Append these tests to `server/__tests__/unit/services/chat-server.service.test.ts`. Extend `buildDeleteService()` only if needed; prefer a new builder to keep test fixtures focused.

```ts
const buildCapabilitiesService = (deps: {
  chatServer?: ChatServer | null;
  user?: { id: bigint } | null;
  capabilities?: Awaited<ReturnType<ChatServerRepository['findCapabilitiesByChatId']>>;
}) => {
  const chatServer = deps.chatServer === undefined
    ? mockChatServer({ chatId: 'server-capabilities', createdBy: BigInt(9) })
    : deps.chatServer;

  const chatServerRepository = {
    findByChatId: vi.fn().mockResolvedValue(chatServer),
    findCapabilitiesByChatId: vi.fn().mockResolvedValue(
      deps.capabilities ?? {
        chatServer,
        skills: [],
        mcps: [],
      }
    ),
  } as unknown as ChatServerRepository;

  const userRepository = {
    findByUserId: vi.fn().mockResolvedValue(
      deps.user === undefined ? { id: BigInt(9) } : deps.user
    ),
  } as unknown as UserRepository;

  const service = new ChatServerService({
    chatServerRepository,
    userRepository,
    proxyHostRepository: {} as ProxyHostRepository,
    proxyClient: {} as ProxyClientService,
  });

  return { service, chatServerRepository, userRepository };
};

describe('ChatServerService - capabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns skills and MCPs for a chat server owned by the current user', async () => {
    const chatServer = mockChatServer({ chatId: 'server-capabilities', createdBy: BigInt(9) });
    const { service, chatServerRepository } = buildCapabilitiesService({
      chatServer,
      capabilities: {
        chatServer,
        skills: [
          {
            id: BigInt(10),
            skillId: 'code-review',
            name: '代码审查',
            description: '代码风险分析',
            icon: 'Code',
            category: 'code',
            status: 'active',
            createdAt: new Date('2026-05-12T10:00:00.000Z'),
          },
        ],
        mcps: [
          {
            id: BigInt(20),
            mcpId: 'github-mcp',
            name: 'GitHub MCP',
            description: 'GitHub 工具集',
            icon: 'Github',
            status: 'active',
            transportType: 'stdio',
            language: 'javascript',
            createdAt: new Date('2026-05-12T11:00:00.000Z'),
          },
        ],
      },
    });

    const result = await service.getCapabilities('server-capabilities', 'user-uuid');

    expect(chatServerRepository.findCapabilitiesByChatId).toHaveBeenCalledWith('server-capabilities');
    expect(result).toEqual({
      chatServer: {
        id: '1',
        chatId: 'server-capabilities',
        name: 'Mock Server',
      },
      skills: [
        expect.objectContaining({
          id: '10',
          skillId: 'code-review',
          name: '代码审查',
          createdAt: '2026-05-12T10:00:00.000Z',
        }),
      ],
      mcps: [
        expect.objectContaining({
          id: '20',
          mcpId: 'github-mcp',
          name: 'GitHub MCP',
          transportType: 'stdio',
          createdAt: '2026-05-12T11:00:00.000Z',
        }),
      ],
    });
  });

  it('returns empty arrays when the chat server has no loaded capabilities', async () => {
    const { service } = buildCapabilitiesService({});

    const result = await service.getCapabilities('server-capabilities', 'user-uuid');

    expect(result.skills).toEqual([]);
    expect(result.mcps).toEqual([]);
  });

  it('throws when the chat server does not exist', async () => {
    const { service } = buildCapabilitiesService({ chatServer: null });

    await expect(service.getCapabilities('missing-server', 'user-uuid')).rejects.toThrow(
      'ChatServer 不存在'
    );
  });

  it('throws when the chat server belongs to another user', async () => {
    const { service } = buildCapabilitiesService({
      chatServer: mockChatServer({ chatId: 'foreign-server', createdBy: BigInt(99) }),
      user: { id: BigInt(9) },
    });

    await expect(service.getCapabilities('foreign-server', 'user-uuid')).rejects.toThrow(
      '无权访问此 ChatServer'
    );
  });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
pnpm test -- server/__tests__/unit/services/chat-server.service.test.ts
```

Expected before implementation: TypeScript or runtime failure because `getCapabilities()` and `findCapabilitiesByChatId()` do not exist.

- [ ] **Step 3: Add capability DTO types**

In `server/types/chat-server.types.ts`, add these exports after existing response DTOs:

```ts
export interface ChatServerCapabilitySkillDto {
  id: string;
  skillId: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  status: string;
  createdAt: string;
}

export interface ChatServerCapabilityMcpDto {
  id: string;
  mcpId: string;
  name: string;
  description: string | null;
  icon: string | null;
  status: string;
  transportType: string;
  language: string | null;
  createdAt: string;
}

export interface ChatServerCapabilitiesDto {
  chatServer: {
    id: string;
    chatId: string;
    name: string;
  };
  skills: ChatServerCapabilitySkillDto[];
  mcps: ChatServerCapabilityMcpDto[];
}
```

- [ ] **Step 4: Add repository query**

In `server/repositories/chat-server.repository.ts`, add:

```ts
async findCapabilitiesByChatId(chatId: string) {
  const chatServer = await this.prisma.chatServer.findUnique({
    where: { chatId },
    include: {
      chatServerSkills: {
        include: { skill: true },
        orderBy: { createdAt: 'desc' },
      },
      chatServerMcps: {
        include: { mcpService: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!chatServer) {
    return null;
  }

  return {
    chatServer,
    skills: chatServer.chatServerSkills.map((item) => item.skill),
    mcps: chatServer.chatServerMcps.map((item) => item.mcpService),
  };
}
```

- [ ] **Step 5: Add service method**

In `server/services/chat-server.service.ts`, import the DTO type and add:

```ts
async getCapabilities(
  chatId: string,
  userUuid: string
): Promise<ChatServerCapabilitiesDto> {
  const user = await this.userRepository.findByUserId(userUuid);
  if (!user) {
    throw new Error('用户不存在');
  }

  const chatServer = await this.chatServerRepository.findByChatId(chatId);
  if (!chatServer) {
    throw new Error('ChatServer 不存在');
  }

  if (chatServer.createdBy !== user.id) {
    throw new Error('无权访问此 ChatServer');
  }

  const capabilities = await this.chatServerRepository.findCapabilitiesByChatId(chatId);
  if (!capabilities) {
    throw new Error('ChatServer 不存在');
  }

  return {
    chatServer: {
      id: chatServer.id.toString(),
      chatId: chatServer.chatId,
      name: chatServer.name,
    },
    skills: capabilities.skills.map((skill) => ({
      id: skill.id.toString(),
      skillId: skill.skillId,
      name: skill.name,
      description: skill.description,
      icon: skill.icon,
      category: skill.category,
      status: skill.status,
      createdAt: skill.createdAt.toISOString(),
    })),
    mcps: capabilities.mcps.map((mcp) => ({
      id: mcp.id.toString(),
      mcpId: mcp.mcpId,
      name: mcp.name,
      description: mcp.description,
      icon: mcp.icon,
      status: mcp.status,
      transportType: mcp.transportType,
      language: mcp.language,
      createdAt: mcp.createdAt.toISOString(),
    })),
  };
}
```

- [ ] **Step 6: Add controller and route**

In `server/controllers/chat-server.controller.ts`, add:

```ts
async getCapabilities(req: Request, res: Response): Promise<void> {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token is missing or invalid',
      });
      return;
    }

    const capabilities = await this.service.getCapabilities(chatId, userId);
    res.status(200).json(capabilities);
  } catch (error) {
    this.handleError(res, error);
  }
}
```

In `server/routes/chat-server.routes.ts`, place this before `/:chatId/delete-stats`:

```ts
router.get('/:chatId/capabilities', (req, res) =>
  req.controller.getCapabilities(req, res)
);
```

- [ ] **Step 7: Run the focused backend test**

Run:

```bash
pnpm test -- server/__tests__/unit/services/chat-server.service.test.ts
```

Expected: PASS for the chat server service tests.

- [ ] **Step 8: Commit backend read API**

Run:

```bash
git status --short
git add server/types/chat-server.types.ts server/repositories/chat-server.repository.ts server/services/chat-server.service.ts server/controllers/chat-server.controller.ts server/routes/chat-server.routes.ts server/__tests__/unit/services/chat-server.service.test.ts
git commit -m "feat(ai-chat): add service capability API"
```

Before committing, confirm unrelated existing changes are not staged.

## Task 2: Service-Level Skill Relation Writes

**Files:**
- Modify: `server/services/skills.service.ts`
- Modify: `server/repositories/skills.repository.ts`
- Test: add focused tests if an existing skills service test exists; otherwise add integration coverage in `server/__tests__/unit/services/chat-server.service.test.ts` only for cleanup visibility.

- [ ] **Step 1: Inspect existing skill tests**

Run:

```bash
find server/__tests__ -name '*skill*test.ts*' -print
```

Expected: identify whether a `SkillsService` unit test already exists. If none exists, create `server/__tests__/unit/services/skills.service.test.ts` with mocks for `DatabaseService`, `ProxyClientService`, `SkillsRepository`, `ChatServerRepository`, and `UserRepository`.

- [ ] **Step 2: Write failing skill load relation test**

If creating `server/__tests__/unit/services/skills.service.test.ts`, use this shape:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaState = {
  skillFile: { findFirst: vi.fn() },
  chatServer: { findUnique: vi.fn() },
  userSkill: { upsert: vi.fn(), deleteMany: vi.fn() },
  chatServerSkill: { upsert: vi.fn(), deleteMany: vi.fn() },
};

vi.mock('@server/services/database.service', () => ({
  DatabaseService: {
    getInstance: () => prismaState,
  },
}));

vi.mock('@server/repositories/skills.repository', () => ({
  SkillsRepository: class {
    findBySkillId = vi.fn().mockResolvedValue({
      id: BigInt(10),
      skillId: 'code-review',
      name: '代码审查',
    });
  },
}));

vi.mock('@server/repositories/chat-server.repository', () => ({
  ChatServerRepository: class {},
}));

vi.mock('@server/repositories/users.repository', () => ({
  UserRepository: class {
    findByUserId = vi.fn().mockResolvedValue({ id: BigInt(9) });
  },
}));

vi.mock('@server/services/proxy-client.service', () => ({
  ProxyClientService: class {
    loadSkill = vi.fn().mockResolvedValue({ code: 200, message: 'ok' });
    unloadSkill = vi.fn().mockResolvedValue({ code: 200, message: 'ok' });
  },
}));

import { SkillsService } from '@server/services/skills.service';

describe('SkillsService service-level relations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaState.skillFile.findFirst.mockResolvedValue({
      id: BigInt(100),
      skillId: BigInt(10),
      fileData: Buffer.from('zip'),
      fileName: 'code-review.zip',
    });
    prismaState.chatServer.findUnique.mockResolvedValue({
      id: BigInt(1),
      createdBy: BigInt(9),
      status: 'active',
      port: 4000,
      chatDir: '/tmp/chat',
      proxyHost: { host: '127.0.0.1', port: 8080 },
    });
    prismaState.userSkill.upsert.mockResolvedValue({});
    prismaState.chatServerSkill.upsert.mockResolvedValue({});
  });

  it('writes chat_server_skills after loading a skill to a chat server', async () => {
    const service = new SkillsService();

    await service.loadSkillToChatServer('code-review', '1', 'user-uuid');

    expect(prismaState.chatServerSkill.upsert).toHaveBeenCalledWith({
      where: {
        chatServerId_skillId: {
          chatServerId: BigInt(1),
          skillId: BigInt(10),
        },
      },
      update: {},
      create: {
        chatServerId: BigInt(1),
        skillId: BigInt(10),
      },
    });
  });
});
```

- [ ] **Step 3: Run the failing skill test**

Run:

```bash
pnpm test -- server/__tests__/unit/services/skills.service.test.ts
```

Expected before implementation: FAIL because `chatServerSkill.upsert` is not called.

- [ ] **Step 4: Add service-level skill upsert**

In `server/services/skills.service.ts`, after successful `userSkill.upsert`, add:

```ts
await prisma.chatServerSkill.upsert({
  where: {
    chatServerId_skillId: {
      chatServerId: chatServer.id,
      skillId: skill.id,
    },
  },
  update: {},
  create: {
    chatServerId: chatServer.id,
    skillId: skill.id,
  },
});
```

If either database write fails after the proxy load succeeds, rollback both relation tables and call `proxyClient.unloadSkill()`.

- [ ] **Step 5: Clean service-level skill rows on delete**

In `server/repositories/skills.repository.ts`, update `deleteSkillWithRelations()` transaction before deleting `skill_files`:

```ts
await tx.chatServerSkill.deleteMany({
  where: { skillId: skill.id },
});
```

- [ ] **Step 6: Run skill tests**

Run:

```bash
pnpm test -- server/__tests__/unit/services/skills.service.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit skill relation writes**

Run:

```bash
git status --short
git add server/services/skills.service.ts server/repositories/skills.repository.ts server/__tests__/unit/services/skills.service.test.ts
git commit -m "feat(skills): track loaded skills by chat server"
```

## Task 3: Service-Level MCP Load and Unload

**Files:**
- Modify: `server/services/mcp-services.service.ts`
- Modify: `server/controllers/mcp-services.controller.ts`
- Modify: `server/routes/mcp.routes.ts`
- Modify: `server/__tests__/unit/services/mcp-services.service.test.ts`

- [ ] **Step 1: Expand MCP service test mocks**

In `server/__tests__/unit/services/mcp-services.service.test.ts`, extend `prismaState`:

```ts
const prismaState = {
  mcpMarketplaceItem: {
    create: vi.fn(),
    upsert: vi.fn(),
  },
  chatServer: {
    findFirst: vi.fn(),
  },
  chatServerMcp: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
};
```

- [ ] **Step 2: Write failing MCP load/unload tests**

Append:

```ts
describe('McpServicesService service-level loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceRepoState.findByMcpId.mockResolvedValue({
      id: BigInt(20),
      mcpId: 'github-mcp',
      createdByUserId: BigInt(9),
    });
    prismaState.chatServer.findFirst.mockResolvedValue({
      id: BigInt(1),
      chatId: 'server-uuid',
      createdBy: BigInt(9),
      status: 'active',
    });
    prismaState.chatServerMcp.upsert.mockResolvedValue({});
    prismaState.chatServerMcp.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('loads an MCP service to a chat server relation', async () => {
    const service = new McpServicesService();

    const result = await service.loadToChatServers('github-mcp', ['server-uuid'], BigInt(9));

    expect(prismaState.chatServer.findFirst).toHaveBeenCalledWith({
      where: {
        chatId: 'server-uuid',
        createdBy: BigInt(9),
        status: 'active',
      },
    });
    expect(prismaState.chatServerMcp.upsert).toHaveBeenCalledWith({
      where: {
        chatServerId_mcpId: {
          chatServerId: BigInt(1),
          mcpId: BigInt(20),
        },
      },
      update: {},
      create: {
        chatServerId: BigInt(1),
        mcpId: BigInt(20),
      },
    });
    expect(result).toEqual({ successCount: 1, failedCount: 0 });
  });

  it('unloads an MCP service from chat server relations', async () => {
    const service = new McpServicesService();

    const result = await service.unloadFromChatServers('github-mcp', ['server-uuid'], BigInt(9));

    expect(prismaState.chatServerMcp.deleteMany).toHaveBeenCalledWith({
      where: {
        chatServerId: BigInt(1),
        mcpId: BigInt(20),
      },
    });
    expect(result).toEqual({ success: true });
  });
});
```

- [ ] **Step 3: Run failing MCP tests**

Run:

```bash
pnpm test -- server/__tests__/unit/services/mcp-services.service.test.ts
```

Expected before implementation: FAIL because `loadToChatServers()` and `unloadFromChatServers()` do not exist.

- [ ] **Step 4: Implement MCP service-level methods**

In `server/services/mcp-services.service.ts`, add:

```ts
async loadToChatServers(mcpId: string, chatIds: string[], userId: bigint) {
  const service = await this.servicesRepo.findByMcpId(mcpId);
  if (!service) {
    throw new NotFoundError('MCP 服务不存在');
  }

  let successCount = 0;
  let failedCount = 0;

  for (const chatId of chatIds) {
    const chatServer = await this.prisma.chatServer.findFirst({
      where: {
        chatId,
        createdBy: userId,
        status: 'active',
      },
    });

    if (!chatServer) {
      failedCount++;
      continue;
    }

    await this.prisma.chatServerMcp.upsert({
      where: {
        chatServerId_mcpId: {
          chatServerId: chatServer.id,
          mcpId: service.id,
        },
      },
      update: {},
      create: {
        chatServerId: chatServer.id,
        mcpId: service.id,
      },
    });
    successCount++;
  }

  return { successCount, failedCount };
}

async unloadFromChatServers(mcpId: string, chatIds: string[], userId: bigint) {
  const service = await this.servicesRepo.findByMcpId(mcpId);
  if (!service) {
    throw new NotFoundError('MCP 服务不存在');
  }

  for (const chatId of chatIds) {
    const chatServer = await this.prisma.chatServer.findFirst({
      where: {
        chatId,
        createdBy: userId,
      },
    });

    if (!chatServer) {
      continue;
    }

    await this.prisma.chatServerMcp.deleteMany({
      where: {
        chatServerId: chatServer.id,
        mcpId: service.id,
      },
    });
  }

  return { success: true };
}
```

- [ ] **Step 5: Update controller request contract**

In `server/controllers/mcp-services.controller.ts`, update load/unload handlers to read `chatIds`:

```ts
const { chatIds } = req.body;

if (!chatIds || !Array.isArray(chatIds)) {
  return res.status(400).json({ error: '缺少 chatIds 参数' });
}

const result = await mcpServicesService.loadToChatServers(
  mcpId,
  chatIds,
  BigInt(userId)
);
```

For unload, call `unloadFromChatServers()`.

- [ ] **Step 6: Run MCP tests**

Run:

```bash
pnpm test -- server/__tests__/unit/services/mcp-services.service.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit MCP relation writes**

Run:

```bash
git status --short
git add server/services/mcp-services.service.ts server/controllers/mcp-services.controller.ts server/routes/mcp.routes.ts server/__tests__/unit/services/mcp-services.service.test.ts
git commit -m "feat(mcp): track loaded MCP services by chat server"
```

## Task 4: Frontend Capability API and Hook

**Files:**
- Modify: `src/features/ai-chat/types/index.ts`
- Modify: `src/features/ai-chat/api/chat-server.api.ts`
- Create: `src/features/ai-chat/hooks/use-service-capabilities.ts`

- [ ] **Step 1: Add frontend types**

In `src/features/ai-chat/types/index.ts`, add:

```ts
export interface ChatServerCapabilitySkill {
  id: string;
  skillId: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  status: 'active' | 'disabled' | string;
  createdAt: string;
}

export interface ChatServerCapabilityMcp {
  id: string;
  mcpId: string;
  name: string;
  description: string | null;
  icon: string | null;
  status: 'active' | 'inactive' | 'error' | 'maintenance' | string;
  transportType: 'stdio' | 'sse' | 'websocket' | string;
  language: string | null;
  createdAt: string;
}

export interface ChatServerCapabilities {
  chatServer: Pick<ChatServer, 'id' | 'chatId' | 'name'>;
  skills: ChatServerCapabilitySkill[];
  mcps: ChatServerCapabilityMcp[];
}
```

- [ ] **Step 2: Add API function**

In `src/features/ai-chat/api/chat-server.api.ts`, import `ChatServerCapabilities` and add:

```ts
export async function getChatServerCapabilities(
  chatId: string
): Promise<ChatServerCapabilities> {
  const response = await apiClient.get(`/chat-servers/${chatId}/capabilities`);
  return response.data;
}
```

- [ ] **Step 3: Create React Query hook**

Create `src/features/ai-chat/hooks/use-service-capabilities.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import * as chatServerApi from '../api/chat-server.api';

export function useServiceCapabilities(chatId?: string | null) {
  return useQuery({
    queryKey: ['chat-server-capabilities', chatId],
    queryFn: () => chatServerApi.getChatServerCapabilities(chatId as string),
    enabled: Boolean(chatId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
```

- [ ] **Step 4: Type-check the frontend additions**

Run:

```bash
pnpm lint
```

Expected: no lint/type errors from the new API and hook. Existing unrelated failures should be documented before proceeding.

- [ ] **Step 5: Commit frontend API hook**

Run:

```bash
git status --short
git add src/features/ai-chat/types/index.ts src/features/ai-chat/api/chat-server.api.ts src/features/ai-chat/hooks/use-service-capabilities.ts
git commit -m "feat(ai-chat): add service capability client hook"
```

## Task 5: Frontend Right-Side Capability Panel

**Files:**
- Create: `src/features/ai-chat/components/service-capability-panel.tsx`
- Modify: `src/features/ai-chat/index.tsx`
- Test: `src/features/ai-chat/components/service-capability-panel.test.tsx`

- [ ] **Step 1: Write component test**

Create `src/features/ai-chat/components/service-capability-panel.test.tsx` if the repo already has component test support. Use mocked hook data:

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ServiceCapabilityPanel } from './service-capability-panel';

vi.mock('@/stores/chat-store', () => ({
  useChatStore: () => ({
    activeServer: {
      id: '1',
      chatId: 'server-uuid',
      name: '代码助手',
    },
  }),
}));

vi.mock('../hooks/use-service-capabilities', () => ({
  useServiceCapabilities: () => ({
    data: {
      skills: [
        {
          id: '10',
          skillId: 'code-review',
          name: '代码审查',
          description: '代码风险分析',
          category: 'code',
          status: 'active',
          createdAt: '2026-05-12T10:00:00.000Z',
        },
      ],
      mcps: [
        {
          id: '20',
          mcpId: 'github-mcp',
          name: 'GitHub MCP',
          description: 'GitHub 工具集',
          status: 'active',
          transportType: 'stdio',
          language: 'javascript',
          createdAt: '2026-05-12T11:00:00.000Z',
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe('ServiceCapabilityPanel', () => {
  it('renders loaded skills and MCP services for the active server', () => {
    render(<ServiceCapabilityPanel />);

    expect(screen.getByText('服务能力')).toBeInTheDocument();
    expect(screen.getByText('代码助手')).toBeInTheDocument();
    expect(screen.getByText('代码审查')).toBeInTheDocument();
    expect(screen.getByText('GitHub MCP')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing component test**

Run:

```bash
pnpm test -- src/features/ai-chat/components/service-capability-panel.test.tsx
```

Expected before implementation: FAIL because `service-capability-panel.tsx` does not exist.

- [ ] **Step 3: Implement the panel**

Create `src/features/ai-chat/components/service-capability-panel.tsx`:

```tsx
import { Bot, Package, PlugZap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '@/stores/chat-store';
import { useServiceCapabilities } from '../hooks/use-service-capabilities';

export function ServiceCapabilityPanel() {
  const { activeServer } = useChatStore();
  const { data, isLoading, isError, refetch } = useServiceCapabilities(activeServer?.chatId);

  if (!activeServer) {
    return (
      <aside className='hidden w-80 shrink-0 border-l bg-card xl:flex xl:flex-col'>
        <div className='flex flex-1 flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground'>
          <Bot className='mb-3 size-8 opacity-50' />
          请选择一个智能服务查看能力
        </div>
      </aside>
    );
  }

  return (
    <aside className='hidden w-80 shrink-0 border-l bg-card xl:flex xl:flex-col'>
      <div className='border-b p-4'>
        <div className='flex items-center gap-2'>
          <Bot className='size-5 text-primary' />
          <h2 className='font-semibold'>服务能力</h2>
        </div>
        <p className='mt-1 truncate text-xs text-muted-foreground'>{activeServer.name}</p>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        <div className='space-y-4 p-4'>
          {isLoading ? (
            <CapabilitySkeleton />
          ) : isError ? (
            <div className='rounded-lg border border-destructive/30 p-3 text-sm'>
              <p className='text-destructive'>服务能力加载失败</p>
              <Button size='sm' variant='outline' className='mt-3' onClick={() => refetch()}>
                <RefreshCw className='mr-2 size-3' />
                重试
              </Button>
            </div>
          ) : (
            <>
              <CapabilitySection
                title='技能列表'
                count={data?.skills.length ?? 0}
                emptyText='当前服务未加载技能'
                icon={<Package className='size-4' />}
              >
                {data?.skills.map((skill) => (
                  <div key={skill.id} className='rounded-lg border p-3'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <div className='truncate font-medium'>{skill.name}</div>
                        <div className='truncate text-xs text-muted-foreground'>{skill.skillId}</div>
                      </div>
                      <Badge variant='secondary'>{skill.status}</Badge>
                    </div>
                    {skill.description && (
                      <p className='mt-2 line-clamp-2 text-xs text-muted-foreground'>
                        {skill.description}
                      </p>
                    )}
                  </div>
                ))}
              </CapabilitySection>

              <CapabilitySection
                title='MCP 列表'
                count={data?.mcps.length ?? 0}
                emptyText='当前服务未加载 MCP'
                icon={<PlugZap className='size-4' />}
              >
                {data?.mcps.map((mcp) => (
                  <div key={mcp.id} className='rounded-lg border p-3'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <div className='truncate font-medium'>{mcp.name}</div>
                        <div className='truncate text-xs text-muted-foreground'>{mcp.mcpId}</div>
                      </div>
                      <Badge variant='secondary'>{mcp.status}</Badge>
                    </div>
                    <div className='mt-2 text-xs text-muted-foreground'>
                      {mcp.transportType}
                      {mcp.language ? ` · ${mcp.language}` : ''}
                    </div>
                  </div>
                ))}
              </CapabilitySection>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

function CapabilitySkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-5 w-24' />
      <Skeleton className='h-20 w-full' />
      <Skeleton className='h-20 w-full' />
      <Skeleton className='h-5 w-24' />
      <Skeleton className='h-20 w-full' />
    </div>
  );
}

function CapabilitySection(props: {
  title: string;
  count: number;
  emptyText: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          {props.icon}
          {props.title}
        </div>
        <span className='text-xs text-muted-foreground'>{props.count} 个</span>
      </div>
      {props.count === 0 ? (
        <div className='rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground'>
          {props.emptyText}
        </div>
      ) : (
        <div className='space-y-2'>{props.children}</div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Render the panel in AI chat**

In `src/features/ai-chat/index.tsx`, import and render the panel:

```tsx
import { ServiceCapabilityPanel } from './components/service-capability-panel'
```

Replace:

```tsx
<div className='flex flex-1'>
  <ConnectionGuard>
    <ChatPanel />
  </ConnectionGuard>
</div>
```

with:

```tsx
<div className='flex min-w-0 flex-1'>
  <ConnectionGuard>
    <ChatPanel />
  </ConnectionGuard>
</div>
<ServiceCapabilityPanel />
```

- [ ] **Step 5: Run frontend tests/lint**

Run:

```bash
pnpm test -- src/features/ai-chat/components/service-capability-panel.test.tsx
pnpm lint
```

Expected: component test and lint pass. If component test infrastructure lacks jsdom setup, document the blocker and keep lint as minimum verification.

- [ ] **Step 6: Commit frontend panel**

Run:

```bash
git status --short
git add src/features/ai-chat/components/service-capability-panel.tsx src/features/ai-chat/components/service-capability-panel.test.tsx src/features/ai-chat/index.tsx
git commit -m "feat(ai-chat): show selected service capabilities"
```

## Task 6: MCP Frontend Contract Cleanup

**Files:**
- Modify: `src/features/mcp-management/api/mcp-services.api.ts`
- Modify: `src/features/mcp-management/components/dialogs/load-mcp-dialog.tsx`
- Modify: `src/features/mcp-management/hooks/use-mcp-operations.ts`

- [ ] **Step 1: Inspect MCP operation hook**

Run:

```bash
sed -n '1,220p' src/features/mcp-management/hooks/use-mcp-operations.ts
```

Expected: identify `useLoadToSessions()` and `useUnloadFromSessions()` call sites.

- [ ] **Step 2: Update API helpers to service-level naming**

In `src/features/mcp-management/api/mcp-services.api.ts`, replace:

```ts
export async function loadToSessions(mcpId: string, sessionIds: string[]) {
  const response = await apiClient.post(`${BASE_URL}/services/${mcpId}/load`, {
    sessionIds,
  });
  return response.data;
}
```

with:

```ts
export async function loadToChatServers(mcpId: string, chatIds: string[]) {
  const response = await apiClient.post(`${BASE_URL}/services/${mcpId}/load`, {
    chatIds,
  });
  return response.data;
}
```

Do the same for unload:

```ts
export async function unloadFromChatServers(mcpId: string, chatIds: string[]) {
  const response = await apiClient.post(`${BASE_URL}/services/${mcpId}/unload`, {
    chatIds,
  });
  return response.data;
}
```

- [ ] **Step 3: Update operation hooks and dialog text**

Rename hooks from session naming to chat server naming:

```ts
useLoadToChatServers
useUnloadFromChatServers
```

Update UI copy in `load-mcp-dialog.tsx` from `装载 MCP 到会话` to `装载 MCP 到智能服务`.

Replace mock session selection with active chat servers by reusing `getAllChatServers()` or an existing hook. The checkbox value must be `server.chatId`, not database `id`.

- [ ] **Step 4: Run lint**

Run:

```bash
pnpm lint
```

Expected: no stale references to `loadToSessions`, `unloadFromSessions`, or `sessionIds` in MCP load/unload UI code.

- [ ] **Step 5: Commit MCP frontend cleanup**

Run:

```bash
git status --short
git add src/features/mcp-management/api/mcp-services.api.ts src/features/mcp-management/hooks/use-mcp-operations.ts src/features/mcp-management/components/dialogs/load-mcp-dialog.tsx
git commit -m "feat(mcp): load services onto chat servers"
```

## Task 7: End-to-End Verification and Cleanup

**Files:**
- No planned source edits unless verification finds a scoped bug.

- [ ] **Step 1: Confirm working tree scope**

Run:

```bash
git status --short
```

Expected: only pre-existing unrelated changes remain unstaged, or the tree is clean except known user changes. Do not stage `CLAUDE.md`, auth service, or Vitest config changes unless the user explicitly asks.

- [ ] **Step 2: Run backend focused tests**

Run:

```bash
pnpm test -- server/__tests__/unit/services/chat-server.service.test.ts
pnpm test -- server/__tests__/unit/services/mcp-services.service.test.ts
pnpm test -- server/__tests__/unit/services/skills.service.test.ts
```

Expected: PASS. If `skills.service.test.ts` was not created because an alternate existing test was used, run that exact alternate test file.

- [ ] **Step 3: Run frontend focused tests**

Run:

```bash
pnpm test -- src/features/ai-chat/components/service-capability-panel.test.tsx
```

Expected: PASS, or document jsdom/test-environment blocker if the repo cannot render React components in current Vitest config.

- [ ] **Step 4: Run project lint**

Run:

```bash
pnpm lint
```

Expected: PASS. If it fails due to pre-existing unrelated changes, capture the exact failing files and determine whether they are outside this feature.

- [ ] **Step 5: Optional local UI verification**

If `pnpm dev:all` can run locally, start it and open the AI chat page. Verify:

- Selecting different智能服务 changes the right panel API request.
- Empty service shows `当前服务未加载技能` and `当前服务未加载 MCP`.
- Loaded service shows the expected Skills and MCP rows.

- [ ] **Step 6: Final commit if verification fixes were needed**

If any verification-only fix was required, commit it separately:

```bash
git status --short
git add <only-feature-files>
git commit -m "fix(ai-chat): stabilize service capability panel"
```

## Self-Review

- Spec coverage: The plan covers fixed right-side panel, ownership-checked capability API, service-level relation tables, skill writes, MCP writes, and excludes Agent.
- Placeholder scan: No `TBD`, `TODO`, or unspecified “handle edge cases” steps remain.
- Type consistency: Backend `chatId` consistently means `chat_servers.chat_id` UUID; service-level relation writes use Prisma compound IDs `chatServerId_skillId` and `chatServerId_mcpId`.
