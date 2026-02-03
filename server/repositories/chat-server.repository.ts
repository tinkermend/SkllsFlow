import { type PrismaClient, type ChatServer, type Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository.js';

/**
 * ChatServer Repository
 * 处理 ChatServer 的数据库操作
 * 扩展 BaseRepository 以利用通用 CRUD 操作
 */
export class ChatServerRepository extends BaseRepository<
  ChatServer,
  Prisma.ChatServerCreateInput,
  Prisma.ChatServerUpdateInput,
  Prisma.ChatServerWhereInput,
  Prisma.ChatServerOrderByWithRelationInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected get modelName(): string {
    return 'chatServer';
  }

  /**
   * 查询指定代理主机下最新的活跃 ChatServer
   * 用于计算下一个可用端口
   *
   * @param proxyId - 代理主机 ID
   * @returns 最新的 ChatServer，如果没有则返回 null
   *
   * @example
   * ```typescript
   * const latest = await repository.findLatestByProxyId(BigInt(1));
   * const nextPort = latest ? latest.port + 1 : proxyHost.beginChatPort;
   * ```
   */
  async findLatestByProxyId(proxyId: bigint): Promise<ChatServer | null> {
    return this.prisma.chatServer.findFirst({
      where: {
        proxyId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 查询用户的所有 ChatServer
   *
   * @param userId - 用户数据库 ID (BigInt)
   * @returns 用户的所有活跃 ChatServer 列表
   *
   * @example
   * ```typescript
   * const userServers = await repository.findByUserId(BigInt(1));
   * console.log(`User has ${userServers.length} chat servers`);
   * ```
   */
  async findByUserId(userId: bigint): Promise<ChatServer[]> {
    return this.findAll({
      where: {
        createdBy: userId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 查询指定代理主机下的所有活跃 ChatServer
   *
   * @param proxyId - 代理主机 ID
   * @returns 该代理主机下的所有活跃 ChatServer
   *
   * @example
   * ```typescript
   * const servers = await repository.findActiveByProxyId(BigInt(1));
   * console.log(`Proxy has ${servers.length} active chat servers`);
   * ```
   */
  async findActiveByProxyId(proxyId: bigint): Promise<ChatServer[]> {
    return this.findAll({
      where: {
        proxyId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 通过 chatId (UUID) 查找 ChatServer
   *
   * @param chatId - ChatServer UUID
   * @returns ChatServer 或 null
   */
  async findByChatId(chatId: string): Promise<ChatServer | null> {
    return this.prisma.chatServer.findUnique({
      where: { chatId },
    });
  }

  /**
   * 通过 chatId 删除 ChatServer
   *
   * @param chatId - ChatServer UUID
   * @returns 被删除的 ChatServer
   */
  async deleteByChatId(chatId: string): Promise<ChatServer> {
    return this.prisma.chatServer.delete({
      where: { chatId },
    });
  }

  /**
   * 获取 ChatServer 的删除统计信息
   * 返回将要被级联删除的关联数据数量
   *
   * @param chatId - ChatServer UUID
   * @returns 关联数据统计
   */
  async getDeleteStats(chatId: string): Promise<{
    agentsCount: number;
    mcpsCount: number;
    skillsCount: number;
    sessionsCount: number;
  }> {
    const chatServer = await this.prisma.chatServer.findUnique({
      where: { chatId },
      include: {
        _count: {
          select: {
            chatServerAgents: true,
            chatServerMcps: true,
            chatServerSkills: true,
            sessions: true,
          },
        },
      },
    });

    if (!chatServer) {
      throw new Error('ChatServer 不存在');
    }

    return {
      agentsCount: chatServer._count.chatServerAgents,
      mcpsCount: chatServer._count.chatServerMcps,
      skillsCount: chatServer._count.chatServerSkills,
      sessionsCount: chatServer._count.sessions,
    };
  }
}
