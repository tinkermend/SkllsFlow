/* eslint-disable no-console */
/**
 * API 配置
 *
 * Mock 逻辑由 MSW (Mock Service Worker) 接管
 * 通过环境变量 VITE_MOCK 控制 MSW 是否启用
 * - VITE_MOCK=true: MSW 拦截请求并返回 Mock 数据
 * - VITE_MOCK=false: 请求直接转发到真实后端 API
 */

export const API_CONFIG = {
  /**
   * 后端 API 基础路径
   */
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api",

  /**
   * API 超时时间（毫秒）
   */
  timeout: 30000,
} as const;

/**
 * API 端点配置
 */
export const API_ENDPOINTS = {
  // 技能管理
  skills: {
    list: "/skills",
    mySkills: "/skills/my-skills",
    detail: (id: string) => `/skills/${id}`,
    create: "/skills",
    update: (id: string) => `/skills/${id}`,
    delete: (id: string) => `/skills/${id}`,
    uninstall: (id: string) => `/skills/${id}/uninstall`,
    loadedServers: (id: string) => `/skills/${id}/loaded-servers`,
    files: (skillId: string) => `/skills/${skillId}/files`,
    downloadFile: (skillId: string, fileId: string) => `/skills/${skillId}/files/${fileId}/download`,
  },

  // 用户管理
  users: {
    list: "/users",
    detail: (id: string) => `/users/${id}`,
    create: "/users",
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
} as const;

/**
 * 获取完整的 API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.baseUrl}${endpoint}`;
}

/**
 * 日志辅助函数
 */
export function logApiMode(): void {
  if (import.meta.env.DEV) {
    const isMockEnabled = import.meta.env.VITE_MOCK === "true";
    console.log(
      `[API Config] Mode: ${isMockEnabled ? "MSW Mock" : "Real API"}`,
      `\n[API Config] Base URL: ${API_CONFIG.baseUrl}`
    );
  }
}
