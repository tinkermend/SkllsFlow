import axios, { type AxiosInstance } from 'axios';
import FormData from 'form-data';
import { env } from '../config/env.js';

/**
 * 代理服务启动 OpenCode 实例的请求参数
 */
export interface StartOpenCodeInstanceParams {
  proxyHost: string;
  proxyPort: number;
  openCodePort: number;
  auth: boolean;
  authPassword: string;
  chatDir: string;
}

export interface StopOpenCodeInstanceParams {
  proxyHost: string;
  proxyPort: number;
  openCodePort: number;
}

export interface DeleteOpenCodeInstanceParams {
  proxyHost: string;
  proxyPort: number;
  openCodePort: number;
  chatDir: string;
}

export interface LoadSkillParams {
  proxyHost: string;
  proxyPort: number;
  openCodePort: number;
  chatDir: string;
  skillFileBuffer: Buffer | Uint8Array;
  fileName: string;
  skillName: string;
}

export interface UnloadSkillParams {
  proxyHost: string;
  proxyPort: number;
  openCodePort: number;
  chatDir: string;
  skillName: string;
}

/**
 * 代理服务响应
 */
export interface ProxyServiceResponse {
  code: number;
  message: string;
}

/**
 * ProxyClient Service
 * 负责与代理服务通信的 HTTP 客户端
 * 用于启动和管理 OpenCode 实例
 */
export class ProxyClientService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 秒超时
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': env.PROXY_API_SECRET,
      },
    });
  }

  /**
   * 启动 OpenCode 实例
   * 调用代理服务的 /api/opencode_start 接口
   *
   * @param params - 启动参数
   * @returns 代理服务响应
   * @throws Error 如果请求失败或返回非 200 状态码
   *
   * @example
   * ```typescript
   * const response = await proxyClient.startOpenCodeInstance({
   *   host: '192.168.1.100',
   *   port: 4096,
   *   auth: true,
   *   authPassword: 'password',
   *   chatDir: '/opt/opencode/user123abc',
   * });
   *
   * if (response.code === 200) {
   *   console.log('OpenCode instance started successfully');
   * }
   * ```
   */
  async startOpenCodeInstance(
    params: StartOpenCodeInstanceParams
  ): Promise<ProxyServiceResponse> {
    const { proxyHost, proxyPort, openCodePort, auth, authPassword, chatDir } = params;

    const url = `http://${proxyHost}:${proxyPort}/api/opencode_start`;

    try {
      const response = await this.axiosInstance.post<ProxyServiceResponse>(url, {
        port: openCodePort,
        auth,
        auth_password: authPassword,
        chat_dir: chatDir,
      });

      return response.data;
    } catch (error: unknown) {
      // 处理 HTTP 错误
      if (error && typeof error === 'object' && 'response' in error) {
        // 服务器返回了错误响应
        const axiosError = error as { response: { data: ProxyServiceResponse } };
        const data = axiosError.response.data;
        throw new Error(data.message || '代理服务调用失败');
      } else if (error && typeof error === 'object' && 'request' in error) {
        // 请求已发送但没有收到响应
        throw new Error('代理服务无响应，请检查服务是否正常运行');
      } else {
        // 请求配置错误
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`代理服务请求失败: ${message}`);
      }
    }
  }

  /**
   * 停止 OpenCode 实例
   * 调用代理服务的 /api/opencode_stop 接口
   */
  async stopOpenCodeInstance(
    params: StopOpenCodeInstanceParams
  ): Promise<ProxyServiceResponse> {
    const { proxyHost, proxyPort, openCodePort } = params;
    const url = `http://${proxyHost}:${proxyPort}/api/opencode_stop`;

    try {
      const response = await this.axiosInstance.post<ProxyServiceResponse>(url, {
        port: openCodePort,
      });
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: ProxyServiceResponse } };
        const data = axiosError.response.data;
        throw new Error(data.message || '代理服务停止失败');
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error('代理服务无响应，请检查服务是否正常运行');
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`代理服务请求失败: ${message}`);
      }
    }
  }

  /**
   * 删除 OpenCode 实例
   * 调用代理服务的 /api/opencode_delete 接口
   * 停止服务进程并删除对应的工作目录
   */
  async deleteOpenCodeInstance(
    params: DeleteOpenCodeInstanceParams
  ): Promise<ProxyServiceResponse> {
    const { proxyHost, proxyPort, openCodePort, chatDir } = params;
    const url = `http://${proxyHost}:${proxyPort}/api/opencode_delete`;

    try {
      const response = await this.axiosInstance.post<ProxyServiceResponse>(url, {
        port: openCodePort,
        chat_dir: chatDir,
      });
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: ProxyServiceResponse } };
        const data = axiosError.response.data;
        throw new Error(data.message || '代理服务删除失败');
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error('代理服务无响应，请检查服务是否正常运行');
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`代理服务请求失败: ${message}`);
      }
    }
  }

  /**
   * 装载技能到 OpenCode 实例
   * 调用代理服务的 /api/load_skill 接口
   *
   * @param params - 装载参数
   * @returns 代理服务响应
   * @throws Error 如果请求失败或返回非 200 状态码
   *
   * @example
   * ```typescript
   * const response = await proxyClient.loadSkill({
   *   proxyHost: '192.168.1.100',
   *   proxyPort: 4096,
   *   openCodePort: 5000,
   *   chatDir: '/opt/opencode/user123abc',
   *   skillFileBuffer: Buffer.from(...),
   *   fileName: 'my-skill.zip',
   * });
   *
   * if (response.code === 200) {
   *   console.log('Skill loaded successfully');
   * }
   * ```
   */
  async loadSkill(params: LoadSkillParams): Promise<ProxyServiceResponse> {
    const { proxyHost, proxyPort, openCodePort, chatDir, skillFileBuffer, fileName, skillName } =
      params;

    const url = `http://${proxyHost}:${proxyPort}/api/load_skill`;

    try {
      // 创建 FormData 对象
      const formData = new FormData();
      const normalizedSkillFileBuffer = Buffer.isBuffer(skillFileBuffer)
        ? skillFileBuffer
        : Buffer.from(skillFileBuffer);
      formData.append('port', openCodePort.toString());
      formData.append('chat_dir', chatDir);
      formData.append('skill_name', skillName);
      formData.append('skill_file', normalizedSkillFileBuffer, {
        filename: fileName,
        contentType: 'application/zip',
      });

      // 发送请求，使用 60 秒超时（技能包可能较大）
      const response = await axios.post<ProxyServiceResponse>(url, formData, {
        headers: {
          ...formData.getHeaders(),
          'X-Signature': env.PROXY_API_SECRET,
        },
        timeout: 60000, // 60 秒
      });

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: ProxyServiceResponse } };
        const data = axiosError.response.data;
        throw new Error(data.message || '技能装载失败');
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error('代理服务无响应，请检查服务是否正常运行');
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`技能装载请求失败: ${message}`);
      }
    }
  }

  /**
   * 卸载技能从 OpenCode 实例
   * 调用代理服务的 /api/unload_skill 接口
   *
   * @param params - 卸载参数
   * @returns 代理服务响应
   * @throws Error 如果请求失败或返回非 200 状态码
   */
  async unloadSkill(params: UnloadSkillParams): Promise<ProxyServiceResponse> {
    const { proxyHost, proxyPort, openCodePort, chatDir, skillName } = params;
    const url = `http://${proxyHost}:${proxyPort}/api/unload_skill`;

    try {
      const response = await this.axiosInstance.post<ProxyServiceResponse>(url, {
        port: openCodePort,
        chat_dir: chatDir,
        skill_name: skillName,
      });

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: ProxyServiceResponse } };
        const data = axiosError.response.data;
        throw new Error(data.message || '技能卸载失败');
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error('代理服务无响应，请检查服务是否正常运行');
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`技能卸载请求失败: ${message}`);
      }
    }
  }
}
