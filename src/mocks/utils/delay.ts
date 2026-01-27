/**
 * Mock 延迟配置
 * 用于模拟真实网络请求的延迟时间
 */
export const MOCK_DELAYS = {
  fast: 100,      // 快速响应
  normal: 200,    // 正常响应
  slow: 500,      // 慢速响应
} as const

export type DelayType = keyof typeof MOCK_DELAYS
