export const FEATURE_FLAGS = {
  // [预留] 是否要求选择 Skills 才能创建会话
  requireSkillsBeforeChat: false,

  // [预留] 是否显示 MCP 服务器选择
  enableMcpSelection: false,

  // [预留] 是否启用 Skills 面板
  enableSkillsPanel: false,

  // 是否启用命令菜单
  enableCommandMenu: true,

  // 是否显示工具调用详情
  showToolInvocations: true,
} as const

export type FeatureFlags = typeof FEATURE_FLAGS
