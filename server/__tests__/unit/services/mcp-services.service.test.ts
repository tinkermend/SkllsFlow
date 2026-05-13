import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaState = vi.hoisted(() => ({
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
}));

const serviceRepoState = vi.hoisted(() => ({
  findByMcpId: vi.fn(),
}));

vi.mock('../../../services/database.service.js', () => ({
  DatabaseService: {
    getInstance: () => prismaState,
  },
}));

vi.mock('../../../repositories/mcp-services.repository.js', () => ({
  McpServicesRepository: class {
    findByMcpId = serviceRepoState.findByMcpId;
  },
}));

vi.mock('../../../repositories/mcp-tools.repository.js', () => ({
  McpToolsRepository: class {},
}));

vi.mock('../../../repositories/mcp-resources.repository.js', () => ({
  McpResourcesRepository: class {},
}));

vi.mock('../../../repositories/mcp-tags.repository.js', () => ({
  McpTagsRepository: class {},
}));

vi.mock('../../../repositories/mcp-service-tags.repository.js', () => ({
  McpServiceTagsRepository: class {},
}));

const { McpServicesService } = await import(
  '../../../services/mcp-services.service.js'
);

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

    const result = await service.loadToChatServers(
      'github-mcp',
      ['server-uuid'],
      BigInt(9)
    );

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
    expect(result).toEqual({
      loaded: [{ chatId: 'server-uuid', chatServerId: '1' }],
      skipped: [],
    });
  });

  it('unloads an MCP service from a chat server relation', async () => {
    const service = new McpServicesService();

    await service.unloadFromChatServers(
      'github-mcp',
      ['server-uuid'],
      BigInt(9)
    );

    expect(prismaState.chatServerMcp.deleteMany).toHaveBeenCalledWith({
      where: {
        chatServerId: BigInt(1),
        mcpId: BigInt(20),
      },
    });
  });
});
