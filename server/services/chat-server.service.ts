import { ChatServerRepository } from '../repositories/chat-server.repository.js';
import { ProxyHostRepository } from '../repositories/proxy-host.repository.js';
import { UserRepository } from '../repositories/users.repository.js';
import { DatabaseService } from './database.service.js';
import { ProxyClientService } from './proxy-client.service.js';
import { env } from '../config/env.js';
import type { ProxyHost, ChatServer } from '@prisma/client';
import {
  toChatServerResponseDto,
  type ChatServerCapabilitiesDto,
  type ChatServerResponseDto,
  type ChatServerHealthStatus,
} from '../types/chat-server.types.js';

/**
 * ChatServer Service
 * 核心业务逻辑层，处理 ChatServer 的创建、查询和删除
 */
export class ChatServerService {
  private chatServerRepository: ChatServerRepository;
  private proxyHostRepository: ProxyHostRepository;
  private userRepository: UserRepository;
  private proxyClient: ProxyClientService;
  private readonly healthTimeoutMs = 5000;

  constructor(deps?: {
    chatServerRepository?: ChatServerRepository;
    proxyHostRepository?: ProxyHostRepository;
    userRepository?: UserRepository;
    proxyClient?: ProxyClientService;
  }) {
    let prismaInstance: ReturnType<typeof DatabaseService.getInstance> | null = null;
    const ensurePrisma = () => {
      if (!prismaInstance) {
        prismaInstance = DatabaseService.getInstance();
      }
      return prismaInstance;
    };

    this.chatServerRepository =
      deps?.chatServerRepository ?? new ChatServerRepository(ensurePrisma());
    this.proxyHostRepository =
      deps?.proxyHostRepository ?? new ProxyHostRepository(ensurePrisma());
    this.userRepository =
      deps?.userRepository ?? new UserRepository(ensurePrisma());
    this.proxyClient = deps?.proxyClient ?? new ProxyClientService();
  }

  /**
   * 创建新的 ChatServer
   * 完整流程：验证 → 查询代理主机 → 计算端口 → 调用代理服务 → 保存数据库
   *
   * @param userUuid - 用户 UUID（来自 JWT）
   * @param name - ChatServer 名称（最长 16 字符）
   * @returns ChatServer 响应 DTO
   * @throws Error 如果验证失败、无可用代理或代理服务调用失败
   */
  async createChatServer(
    userUuid: string,
    name: string
  ): Promise<ChatServerResponseDto> {
    // 1. 验证 name 长度
    if (!name || name.trim().length === 0) {
      throw new Error('服务名称不能为空');
    }

    if (name.length > 16) {
      throw new Error('服务名称最长 16 个字符');
    }

    // 2. 查询用户信息（通过 UUID 获取数据库 ID）
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 3. 查询可用代理主机
    const proxyHost = await this.proxyHostRepository.findOldestActive();
    if (!proxyHost) {
      throw new Error('无可用的代理服务,请添加代理服务');
    }

    // 4. 查询该代理下最新的 ChatServer
    const latestChatServer =
      await this.chatServerRepository.findLatestByProxyId(proxyHost.id);

    // 5. 计算端口号
    const port = this.calculateNextPort(proxyHost, latestChatServer);

    // 6. 生成 chatDir
    const chatDir = this.generateChatDir(user.accountNo);

    // 7. 调用代理服务启动 OpenCode 实例
    const proxyResponse = await this.proxyClient.startOpenCodeInstance({
      proxyHost: proxyHost.host,
      proxyPort: proxyHost.port,
      openCodePort: port,
      auth: env.OPENCODE_AUTH,
      authPassword: env.OPENCODE_PASSWORD,
      chatDir,
    });

    // 8. 验证代理服务响应
    if (proxyResponse.code !== 200) {
      throw new Error(proxyResponse.message || '代理服务启动失败');
    }

    // 9. 保存 ChatServer 到数据库
    const chatServer = await this.chatServerRepository.create({
      name: name.trim(),
      chatDir,
      host: proxyHost.host,
      port,
      auth: env.OPENCODE_AUTH,
      authPassword: env.OPENCODE_PASSWORD,
      status: 'active',
      proxyHost: {
        connect: { id: proxyHost.id },
      },
      creator: {
        connect: { id: user.id },
      },
    });

    // 10. 返回序列化后的 DTO
    return toChatServerResponseDto(chatServer);
  }

  /**
   * 获取用户的所有 ChatServer
   *
   * @param userUuid - 用户 UUID
   * @returns ChatServer 列表
   */
  async getUserChatServers(userUuid: string): Promise<ChatServerResponseDto[]> {
    // 通过 UUID 查找用户，获取数据库 ID
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    const chatServers = await this.chatServerRepository.findByUserId(user.id);
    const healthResults = await Promise.allSettled(
      chatServers.map((server) => this.checkServerHealth(server))
    );

    return chatServers.map((server, index) => {
      const dto = toChatServerResponseDto(server);
      const healthResult = healthResults[index];

      if (healthResult.status === 'fulfilled') {
        const { status, version, checkedAt } = healthResult.value;
        return {
          ...dto,
          healthStatus: status,
          healthVersion: version,
          healthCheckedAt: checkedAt,
        };
      }

      return {
        ...dto,
        healthStatus: 'unknown' as ChatServerHealthStatus,
      };
    });
  }

  /**
   * 获取用户的所有活跃 ChatServer
   * 用于技能装载时选择目标服务器
   *
   * @param userUuid - 用户 UUID
   * @returns 活跃的 ChatServer 列表（仅包含基本信息）
   */
  async getActiveChatServers(userUuid: string): Promise<ChatServerResponseDto[]> {
    // 通过 UUID 查找用户，获取数据库 ID
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 查询用户的所有 ChatServer
    const chatServers = await this.chatServerRepository.findByUserId(user.id);

    // 过滤出活跃状态的服务器并转换为 DTO
    return chatServers
      .filter((server) => server.status === 'active')
      .map((server) => toChatServerResponseDto(server));
  }

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

    const capabilities =
      await this.chatServerRepository.findCapabilitiesByChatId(chatId);
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

  /**
   * 删除 ChatServer
   *
   * @param chatId - ChatServer UUID
   * @param userUuid - 用户 UUID（用于权限验证）
   */
  async deleteChatServer(chatId: string, userUuid: string): Promise<void> {
    // 查询 ChatServer
    const chatServer = await this.chatServerRepository.findByChatId(chatId);
    if (!chatServer) {
      throw new Error('ChatServer 不存在');
    }

    // 查询用户
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证权限：只能删除自己创建的 ChatServer
    if (chatServer.createdBy !== user.id) {
      throw new Error('无权删除此 ChatServer');
    }

    const proxyHost = await this.proxyHostRepository.findById(chatServer.proxyId);
    if (!proxyHost) {
      throw new Error('代理服务不存在');
    }

    const deleteResponse = await this.proxyClient.deleteOpenCodeInstance({
      proxyHost: proxyHost.host,
      proxyPort: proxyHost.port,
      openCodePort: chatServer.port,
      chatDir: chatServer.chatDir,
    });

    if (deleteResponse.code !== 200) {
      throw new Error(deleteResponse.message || '代理服务删除失败');
    }

    // 程序级联删除：手动删除所有关联数据
    const prisma = DatabaseService.getInstance();

    // 1. 删除关联的 Sessions
    await prisma.session.deleteMany({
      where: { chatId: chatServer.id },
    });

    // 2. 删除关联的 Agents
    await prisma.chatServerAgent.deleteMany({
      where: { chatServerId: chatServer.id },
    });

    // 3. 删除关联的 Skills
    await prisma.chatServerSkill.deleteMany({
      where: { chatServerId: chatServer.id },
    });

    // 4. 删除关联的 MCPs
    await prisma.chatServerMcp.deleteMany({
      where: { chatServerId: chatServer.id },
    });

    // 5. 最后删除 ChatServer 主记录
    await this.chatServerRepository.deleteByChatId(chatId);
  }

  /**
   * 获取 ChatServer 删除统计信息
   * 返回将要被级联删除的关联数据数量
   *
   * @param chatId - ChatServer UUID
   * @param userUuid - 用户 UUID（用于权限验证）
   * @returns 关联数据统计
   */
  async getDeleteStats(chatId: string, userUuid: string) {
    // 1. 查询 ChatServer
    const chatServer = await this.chatServerRepository.findByChatId(chatId);
    if (!chatServer) {
      throw new Error('ChatServer 不存在');
    }

    // 2. 查询用户
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 3. 验证权限：只能查询自己创建的 ChatServer
    if (chatServer.createdBy !== user.id) {
      throw new Error('无权访问此 ChatServer');
    }

    // 4. 获取统计信息
    return this.chatServerRepository.getDeleteStats(chatId);
  }

  /**
   * 计算下一个可用端口
   * 如果有最新的 ChatServer，使用其端口 + 1
   * 否则使用代理主机的 beginChatPort
   *
   * @param proxyHost - 代理主机
   * @param latestChatServer - 最新的 ChatServer（可能为 null）
   * @returns 下一个可用端口
   */
  private calculateNextPort(
    proxyHost: ProxyHost,
    latestChatServer: ChatServer | null
  ): number {
    if (latestChatServer) {
      return latestChatServer.port + 1;
    }
    return proxyHost.beginChatPort;
  }

  /**
   * 生成 chatDir 路径
   * 格式：{OPENCODE_BASE_PATH}/{accountNo}-{random16}
   *
   * @param accountNo - 用户账号
   * @returns chatDir 路径
   */
  private generateChatDir(accountNo: string): string {
    const random16 = this.generateRandomString(16);
    return `${env.OPENCODE_BASE_PATH}/${accountNo}-${random16}`;
  }

  /**
   * 生成随机字符串（字母数字组合）
   *
   * @param length - 字符串长度
   * @returns 随机字符串
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async checkServerHealth(
    server: ChatServer
  ): Promise<{ status: ChatServerHealthStatus; version?: string; checkedAt?: string }> {
    if (server.status !== 'active') {
      return { status: 'unknown' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.healthTimeoutMs);

    try {
      const response = await fetch(
        `http://${server.host}:${server.port}/global/health`,
        { signal: controller.signal }
      );
      const checkedAt = new Date().toISOString();

      if (!response.ok) {
        return { status: 'unhealthy', checkedAt };
      }

      const data = await response.json() as { healthy?: boolean; version?: string };

      if (data.healthy === true) {
        return {
          status: 'healthy',
          version: data.version,
          checkedAt,
        };
      }

      return {
        status: 'unhealthy',
        version: data.version,
        checkedAt,
      };
    } catch {
      return { status: 'unknown' };
    } finally {
      clearTimeout(timeout);
    }
  }
}
