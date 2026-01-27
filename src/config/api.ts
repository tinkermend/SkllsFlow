/**
 * API 配置
 *
 * 通过环境变量 VITE_MOCK 控制是否使用 Mock 数据
 * - true: 使用 Mock 数据（前端模拟）
 * - false: 使用真实后端 API
 *
 * 默认值：开发环境使用 Mock，生产环境使用真实 API
 */

export const API_CONFIG = {
  /**
   * 是否使用 Mock API
   * 可通过环境变量 VITE_MOCK 覆盖
   */
  useMockApi: import.meta.env.VITE_MOCK === "true",

  /**
   * 后端 API 基础路径
   */
  baseUrl: import.meta.env.VITE_API_URL || "/api",

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
    detail: (id: string) => `/skills/${id}`,
    create: "/skills",
    update: (id: string) => `/skills/${id}`,
    delete: (id: string) => `/skills/${id}`,
  },

  // OpenCode
  opencode: {
    health: "/opencode/health",
    connection: "/opencode/connection",
    start: "/opencode/start",
    stop: "/opencode/stop",
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
    console.log(
      `[API Config] Mode: ${API_CONFIG.useMockApi ? "Mock" : "Real API"}`,
      `\n[API Config] Base URL: ${API_CONFIG.baseUrl}`
    );
  }
}
