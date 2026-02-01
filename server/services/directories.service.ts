import { env } from '../config/env.js';
import { createHash } from 'node:crypto';

/**
 * 获取 OpenCode 基础目录路径
 * 从 http://localhost:4096/path 获取
 */
interface PathResponse {
  directory: string;
}

export class DirectoriesService {
  /**
   * 从 OpenCode 服务获取基础目录路径
   */
  async getBasePath(): Promise<string> {
    try {
      // 从环境变量获取 OpenCode API URL
      const openCodeUrl = env.OPENCODE_API_URL;
      if (!openCodeUrl) {
        throw new Error('OPENCODE_API_URL 环境变量未配置');
      }

      // 解析 URL 获取 host 和 port
      const url = new URL(openCodeUrl);
      const pathUrl = `http://${url.hostname}:${url.port || 4096}/path`;

      const response = await fetch(pathUrl, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`获取目录路径失败: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as PathResponse;
      if (!data.directory) {
        throw new Error('响应中缺少 directory 字段');
      }

      return data.directory;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[DirectoriesService] 获取基础目录失败:', error);
      throw new Error(
        `无法获取基础目录路径: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 生成用户专属目录名称
   * 格式: {accountNo}-{8位hash}
   * @example admin-5f7a640a
   */
  generateDirectoryName(accountNo: string): string {
    // 使用当前时间戳生成 hash
    const timestamp = Date.now().toString();
    const hash = createHash('md5')
      .update(`${accountNo}-${timestamp}`)
      .digest('hex')
      .substring(0, 8);

    return `${accountNo}-${hash}`;
  }

  /**
   * 创建完整目录路径
   * @param basePath - 基础目录路径
   * @param accountNo - 用户账号
   * @returns 完整的目录路径
   */
  async createSessionDirectory(basePath: string, accountNo: string): Promise<string> {
    const directoryName = this.generateDirectoryName(accountNo);
    const fullPath = `${basePath}/${directoryName}`;

    try {
      // 使用 Node.js fs 模块创建目录
      const fs = await import('node:fs/promises');
      await fs.mkdir(fullPath, { recursive: true });

      // eslint-disable-next-line no-console
      console.log('[DirectoriesService] 目录创建成功:', fullPath);
      return fullPath;
    } catch (error) {
      // 如果目录已存在，直接返回路径
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        // eslint-disable-next-line no-console
        console.log('[DirectoriesService] 目录已存在:', fullPath);
        return fullPath;
      }

      // eslint-disable-next-line no-console
      console.error('[DirectoriesService] 创建目录失败:', error);
      throw new Error(
        `创建目录失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 完整流程：获取基础目录并创建用户会话目录
   * @param accountNo - 用户账号
   * @returns 完整的目录路径
   */
  async prepareSessionDirectory(accountNo: string): Promise<{ path: string; name: string }> {
    // 1. 获取基础目录路径
    const basePath = await this.getBasePath();

    // 2. 创建用户会话目录
    const fullPath = await this.createSessionDirectory(basePath, accountNo);

    // 3. 提取目录名称
    const directoryName = fullPath.split('/').pop() || fullPath;

    return {
      path: fullPath,
      name: directoryName,
    };
  }
}

export const directoriesService = new DirectoriesService();
