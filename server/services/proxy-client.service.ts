import axios, { type AxiosInstance } from 'axios';
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
}
