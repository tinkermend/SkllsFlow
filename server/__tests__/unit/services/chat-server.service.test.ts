import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatServer } from '@prisma/client';
import type { ChatServerRepository } from '../../../repositories/chat-server.repository.js';
import type { ProxyHostRepository } from '../../../repositories/proxy-host.repository.js';
import type { UserRepository } from '../../../repositories/users.repository.js';
import type { ProxyClientService } from '../../../services/proxy-client.service.js';
import { ChatServerService } from '../../../services/chat-server.service.js';

vi.mock('../../../config/env.js', () => ({
  env: {
    OPENCODE_AUTH: false,
    OPENCODE_PASSWORD: '',
    OPENCODE_BASE_PATH: '/tmp/opencode',
    NODE_ENV: 'test',
  },
}));

const mockChatServer = (overrides: Partial<ChatServer> = {}): ChatServer => ({
  id: BigInt(1),
  chatId: 'server-capabilities',
  name: 'Mock Server',
  chatDir: '/tmp/mock-server',
  proxyId: BigInt(1),
  host: '127.0.0.1',
  port: 4000,
  auth: false,
  authPassword: '',
  status: 'active',
  errorMessage: null,
  createdAt: new Date('2026-05-12T09:00:00.000Z'),
  createdBy: BigInt(9),
  ...overrides,
});

const buildCapabilitiesService = (deps: {
  chatServer?: ChatServer | null;
  user?: { id: bigint } | null;
  capabilities?: Awaited<ReturnType<ChatServerRepository['findCapabilitiesByChatId']>>;
}) => {
  const chatServer =
    deps.chatServer === undefined
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

  return { service, chatServerRepository };
};

describe('ChatServerService - capabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns skills and MCPs for a chat server owned by the current user', async () => {
    const chatServer = mockChatServer({
      chatId: 'server-capabilities',
      createdBy: BigInt(9),
    });
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

    const result = await service.getCapabilities(
      'server-capabilities',
      'user-uuid'
    );

    expect(chatServerRepository.findCapabilitiesByChatId).toHaveBeenCalledWith(
      'server-capabilities'
    );
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

    const result = await service.getCapabilities(
      'server-capabilities',
      'user-uuid'
    );

    expect(result.skills).toEqual([]);
    expect(result.mcps).toEqual([]);
  });

  it('throws when the chat server does not exist', async () => {
    const { service } = buildCapabilitiesService({ chatServer: null });

    await expect(
      service.getCapabilities('missing-server', 'user-uuid')
    ).rejects.toThrow('ChatServer 不存在');
  });

  it('throws when the chat server belongs to another user', async () => {
    const { service } = buildCapabilitiesService({
      chatServer: mockChatServer({
        chatId: 'foreign-server',
        createdBy: BigInt(99),
      }),
      user: { id: BigInt(9) },
    });

    await expect(
      service.getCapabilities('foreign-server', 'user-uuid')
    ).rejects.toThrow('无权访问此 ChatServer');
  });
});
