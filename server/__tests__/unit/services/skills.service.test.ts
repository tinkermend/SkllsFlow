import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaState = vi.hoisted(() => ({
  skillFile: { findFirst: vi.fn() },
  chatServer: { findUnique: vi.fn() },
  userSkill: { upsert: vi.fn(), deleteMany: vi.fn() },
  chatServerSkill: { upsert: vi.fn(), deleteMany: vi.fn() },
}));

const proxyClientState = vi.hoisted(() => ({
  loadSkill: vi.fn(),
  unloadSkill: vi.fn(),
}));

vi.mock('../../../services/database.service.js', () => ({
  DatabaseService: {
    getInstance: () => prismaState,
  },
}));

vi.mock('../../../repositories/skills.repository.js', () => ({
  SkillsRepository: class {
    findBySkillId = vi.fn().mockResolvedValue({
      id: BigInt(10),
      skillId: 'code-review',
      name: '代码审查',
    });
  },
}));

vi.mock('../../../repositories/chat-server.repository.js', () => ({
  ChatServerRepository: class {},
}));

vi.mock('../../../repositories/users.repository.js', () => ({
  UserRepository: class {
    findByUserId = vi.fn().mockResolvedValue({ id: BigInt(9) });
  },
}));

vi.mock('../../../services/proxy-client.service.js', () => ({
  ProxyClientService: class {
    loadSkill = proxyClientState.loadSkill;
    unloadSkill = proxyClientState.unloadSkill;
  },
}));

const { SkillsService } = await import('../../../services/skills.service.js');

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
    proxyClientState.loadSkill.mockResolvedValue({ code: 200, message: 'ok' });
    proxyClientState.unloadSkill.mockResolvedValue({ code: 200, message: 'ok' });
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
