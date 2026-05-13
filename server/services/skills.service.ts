import { DatabaseService } from './database.service.js';
import { SkillsRepository } from '../repositories/skills.repository.js';
import { type Skill } from '@prisma/client';
import { serializeBigInt } from '../utils/bigint-serializer.js';
import type { SkillFileInfo, SerializableSkillWithCreator } from '../types/skill.types.js';
import { ProxyClientService } from './proxy-client.service.js';
import { ChatServerRepository } from '../repositories/chat-server.repository.js';
import { UserRepository } from '../repositories/users.repository.js';

/**
 * 可序列化的技能类型（BigInt 转换为 number）
 */
export interface SerializableSkill extends Omit<Skill, 'id' | 'createdBy' | 'updatedBy'> {
  id: number;
  createdBy: number;
  updatedBy: number | null;
}

/**
 * Skills Service
 * 处理技能相关的业务逻辑
 */
export class SkillsService {
  private repository: SkillsRepository;
  private chatServerRepository: ChatServerRepository;
  private userRepository: UserRepository;
  private proxyClient: ProxyClientService;

  constructor() {
    const prisma = DatabaseService.getInstance();
    this.repository = new SkillsRepository(prisma);
    this.chatServerRepository = new ChatServerRepository(prisma);
    this.userRepository = new UserRepository(prisma);
    this.proxyClient = new ProxyClientService();
  }

  /**
   * 将 Prisma Skill 对象转换为可序列化的格式
   * 将 BigInt 字段转换为 number
   */
  private convertToSerializable(skill: Skill): SerializableSkill {
    return {
      ...skill,
      id: Number(skill.id),
      createdBy: Number(skill.createdBy),
      updatedBy: skill.updatedBy ? Number(skill.updatedBy) : null,
    };
  }

  /**
   * 将包含创建者信息的 Skill 对象转换为可序列化格式
   */
  private convertToSerializableWithCreator(
    skill: Skill & { creator: { username: string | null } | null }
  ): SerializableSkillWithCreator {
    const baseSkill = this.convertToSerializable(skill);
    return {
      ...baseSkill,
      creatorName: skill.creator?.username ?? null,
    };
  }

  /**
   * 获取所有平台技能（包含创建者信息）
   */
  async getAllPlatformSkills(): Promise<SerializableSkillWithCreator[]> {
    const skills = await this.repository.findAllPlatformSkillsWithCreator();
    return skills.map(skill => this.convertToSerializableWithCreator(skill));
  }

  /**
   * 获取用户的技能列表（通过 BigInt ID）
   */
  async getUserSkills(userId: bigint): Promise<SerializableSkill[]> {
    const skills = await this.repository.findUserSkills(userId);
    return skills.map(skill => this.convertToSerializable(skill));
  }

  /**
   * 获取用户的技能列表（通过 UUID，包含创建者信息）
   */
  async getUserSkillsByUuid(userUuid: string): Promise<SerializableSkillWithCreator[]> {
    const skills = await this.repository.findUserSkillsByUuidWithCreator(userUuid);
    return skills.map(skill => this.convertToSerializableWithCreator(skill));
  }

  /**
   * 创建技能并保存文件（事务操作）
   */
  async createSkillWithFile(
    skillData: {
      skillId: string;
      name: string;
      description: string | null;
      icon: string | null;
      category: string;
      tags: string[];
      status: 'active' | 'disabled';
      sortOrder: number;
    },
    fileData: {
      fileBuffer: Buffer;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
    userUuid: string
  ): Promise<SerializableSkill> {
    // 1. 验证 skillId 唯一性
    const existingSkill = await this.repository.findBySkillId(skillData.skillId);
    if (existingSkill) {
      throw new Error('技能ID已存在');
    }

    // 2. 通过 UUID 查询用户 BigInt ID
    const prisma = DatabaseService.getInstance();
    const user = await prisma.user.findUnique({
      where: { userUUId: userUuid },
      select: { id: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 3. 构建完整的 skillData（添加 createdBy）
    const completeSkillData = {
      ...skillData,
      createdBy: user.id,
    };

    // 4. 调用 Repository 创建技能和文件
    const skill = await this.repository.createSkillWithFile(
      completeSkillData,
      fileData
    );

    // 5. 返回序列化后的技能对象
    return this.convertToSerializable(skill);
  }

  /**
   * 获取技能文件列表
   */
  async getSkillFiles(skillId: string): Promise<SkillFileInfo[]> {
    const skill = await this.repository.findBySkillId(skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    const files = await this.repository.findSkillFiles(skill.id);

    return files.map(file => serializeBigInt({
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      createdAt: file.createdAt.toISOString(),
    })) as SkillFileInfo[];
  }

  /**
   * 获取技能文件数据（用于下载）
   */
  async getSkillFileData(skillId: string, fileId: string): Promise<{
    fileData: Buffer;
    fileName: string;
    mimeType: string;
  } | null> {
    const skill = await this.repository.findBySkillId(skillId);
    if (!skill) {
      return null;
    }

    const file = await this.repository.findSkillFileById(BigInt(fileId));
    if (!file || file.skillId !== skill.id) {
      return null;
    }

    return {
      fileData: file.fileData,
      fileName: file.fileName,
      mimeType: file.mimeType,
    };
  }

  /**
   * 装载技能到 ChatServer
   *
   * @param skillId - 技能 ID（字符串）
   * @param chatServerId - ChatServer ID（字符串）
   * @param userUuid - 用户 UUID（用于权限验证）
   */
  async loadSkillToChatServer(
    skillId: string,
    chatServerId: string,
    userUuid: string
  ): Promise<void> {
    // 1. 查询技能
    const skill = await this.repository.findBySkillId(skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    // 2. 查询技能文件（获取最新的文件）
    const prisma = DatabaseService.getInstance();
    const skillFile = await prisma.skillFile.findFirst({
      where: { skillId: skill.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!skillFile) {
      throw new Error('技能文件不存在');
    }

    // 3. 查询用户
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 4. 查询 ChatServer（包含关联的 ProxyHost）
    const chatServer = await prisma.chatServer.findUnique({
      where: { id: BigInt(chatServerId) },
      include: {
        proxyHost: true,
      },
    });

    if (!chatServer) {
      throw new Error('服务不存在');
    }

    // 5. 验证 ChatServer 状态
    if (chatServer.status !== 'active') {
      throw new Error('服务未激活，无法装载技能');
    }

    // 6. 验证权限：只能装载到自己创建的 ChatServer
    if (chatServer.createdBy !== user.id) {
      throw new Error('无权操作此服务');
    }

    // 7. 验证 ProxyHost 存在
    if (!chatServer.proxyHost) {
      throw new Error('代理服务器配置错误');
    }

    // 8. 调用 ProxyClientService 装载技能
    try {
      const loadResponse = await this.proxyClient.loadSkill({
        proxyHost: chatServer.proxyHost.host,
        proxyPort: chatServer.proxyHost.port,
        openCodePort: chatServer.port,
        chatDir: chatServer.chatDir,
        skillFileBuffer: skillFile.fileData,
        fileName: skillFile.fileName,
        skillName: skill.skillId,
      });

      if (loadResponse.code !== 200) {
        throw new Error(
          `技能装载失败: ${loadResponse.message || '代理服务返回异常状态'}`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        errorMessage.startsWith('技能装载失败')
          ? errorMessage
          : `技能装载失败: ${errorMessage}`
      );
    }

    // 9. 记录 / 更新技能关联，确保用户列表和服务能力面板都可见已装载的技能
    try {
      await prisma.userSkill.upsert({
        where: {
          uk_user_skills_chat: {
            userId: user.id,
            skillId: skill.skillId,
            chatId: chatServer.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          skillId: skill.skillId,
          chatId: chatServer.id,
          sortOrder: 0,
        },
      });

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
    } catch (dbError) {
      const dbErrorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';

      try {
        await prisma.chatServerSkill.deleteMany({
          where: {
            chatServerId: chatServer.id,
            skillId: skill.id,
          },
        });
        await prisma.userSkill.deleteMany({
          where: {
            userId: user.id,
            skillId: skill.skillId,
            chatId: chatServer.id,
          },
        });
        await this.proxyClient.unloadSkill({
          proxyHost: chatServer.proxyHost.host,
          proxyPort: chatServer.proxyHost.port,
          openCodePort: chatServer.port,
          chatDir: chatServer.chatDir,
          skillName: skill.skillId,
        });
      } catch (rollbackError) {
        const rollbackErrorMessage =
          rollbackError instanceof Error ? rollbackError.message : 'Unknown error';
        throw new Error(
          `技能装载后写入服务关联失败: ${dbErrorMessage}；且回滚卸载失败: ${rollbackErrorMessage}`
        );
      }

      throw new Error(`技能装载后写入服务关联失败: ${dbErrorMessage}，已自动回滚远端装载`);
    }
  }

  /**
   * 获取技能的装载信息
   * @param skillId - 技能 ID（字符串）
   */
  async getSkillLoadedServers(skillId: string): Promise<Array<{
    chatServerId: string;
    chatServerName: string;
    chatDir: string;
    proxyHost: string;
    proxyPort: number;
    openCodePort: number;
  }>> {
    const servers = await this.repository.findSkillLoadedServers(skillId);
    return servers.map(server => ({
      chatServerId: server.chatServerId.toString(),
      chatServerName: server.chatServerName,
      chatDir: server.chatDir,
      proxyHost: server.proxyHost,
      proxyPort: server.proxyPort,
      openCodePort: server.openCodePort,
    }));
  }

  /**
   * 获取技能关联的聊天服务列表。
   */
  async getSkillRelatedSessions(skillId: string): Promise<Array<{
    sessionId: string;
    sessionTitle: string;
    createdAt: string;
  }>> {
    const skill = await this.repository.findBySkillId(skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    const sessions = await this.repository.findSkillRelatedSessions(skillId);
    return sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
    }));
  }

  /**
   * 更新技能元数据。
   */
  async updateSkill(
    skillId: string,
    data: Partial<{
      name: string;
      description: string | null;
      icon: string | null;
      category: string;
      tags: string[];
      status: 'active' | 'disabled';
      sortOrder: number;
    }>
  ): Promise<SerializableSkill> {
    const skill = await this.repository.findBySkillId(skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    const updatedSkill = await this.repository.update(skill.id, updateData);
    return this.convertToSerializable(updatedSkill);
  }

  /**
   * 删除技能（包含卸载和数据清理）
   * @param skillId - 技能 ID（字符串）
   * @param onProgress - 进度回调函数
   */
  async deleteSkill(
    skillId: string,
    onProgress?: (current: number, total: number, serverName: string) => void
  ): Promise<void> {
    // 1. 检查技能是否存在
    const skill = await this.repository.findBySkillId(skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    // 2. 获取装载该技能的服务列表
    const loadedServers = await this.repository.findSkillLoadedServers(skillId);

    // 3. 如果有装载的服务，逐个卸载
    if (loadedServers.length > 0) {
      for (let i = 0; i < loadedServers.length; i++) {
        const server = loadedServers[i];

        // 调用进度回调
        if (onProgress) {
          onProgress(i + 1, loadedServers.length, server.chatServerName);
        }

        // 调用 ProxyClientService 卸载技能
        try {
          await this.proxyClient.unloadSkill({
            proxyHost: server.proxyHost,
            proxyPort: server.proxyPort,
            openCodePort: server.openCodePort,
            chatDir: server.chatDir,
            skillName: skillId,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`从服务 "${server.chatServerName}" 卸载技能失败: ${errorMessage}`);
        }
      }

      // 4. 删除数据库记录（skills, user_skills, skill_files）
      await this.repository.deleteSkillWithRelations(skillId);
    } else {
      // 5. 如果没有装载的服务，只删除 skills 和 skill_files 表
      await this.repository.deleteSkillOnly(skillId);
    }
  }

  /**
   * 卸载当前用户的技能。
   * 流程：
   * 1. 卸载当前用户关联服务中的技能（proxy_server）
   * 2. 删除当前用户在 user_skills 中的关联记录
   * 3. 返回该技能在全局 user_skills 中的剩余关联数量（仅用于展示）
   */
  async uninstallMySkill(
    skillId: string,
    userUuid: string,
    onProgress?: (current: number, total: number, serverName: string) => void
  ): Promise<{ skillDeleted: boolean; remainingBindings: number }> {
    // 1. 检查技能是否存在
    const skill = await this.repository.findBySkillId(skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    // 2. 检查用户是否存在
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 3. 查询当前用户装载了该技能的服务
    const loadedServers = await this.repository.findSkillLoadedServersByUser(skillId, user.id);

    // 4. 逐个卸载
    for (let i = 0; i < loadedServers.length; i++) {
      const server = loadedServers[i];

      if (onProgress) {
        onProgress(i + 1, loadedServers.length, server.chatServerName);
      }

      try {
        await this.proxyClient.unloadSkill({
          proxyHost: server.proxyHost,
          proxyPort: server.proxyPort,
          openCodePort: server.openCodePort,
          chatDir: server.chatDir,
          skillName: skillId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`从服务 "${server.chatServerName}" 卸载技能失败: ${errorMessage}`);
      }
    }

    // 5. 删除当前用户的 user_skills 关联
    await this.repository.deleteUserSkillRelations(skillId, user.id);

    // 6. 返回该技能全局剩余关联数（不删除公共 skills 记录）
    const remainingBindings = await this.repository.countUserSkillRelations(skillId);

    return {
      skillDeleted: false,
      remainingBindings,
    };
  }
}
