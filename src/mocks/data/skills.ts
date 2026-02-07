/**
 * Skill Mock 数据
 *
 * 如何修改此文件：
 * 1. 添加新技能：在 mockSkills 数组中添加新对象
 * 2. 修改字段：直接修改对应的字段值
 * 3. 确保 skillId 唯一
 * 4. status 必须是 'active'（匹配数据库枚举）
 */

export enum SkillStatus {
  ACTIVE = 'active',
}

export interface Skill {
  /** 主键：数据库内部使用 */
  id: number
  /** 技能ID：唯一标识一个技能 */
  skillId: string
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description: string
  /** 图标文件路径 */
  iconPath: string
  /** 技能分类 */
  category: string
  /** 技能标签数组 */
  tags: string[]
  /** 状态：active（启用） */
  status: SkillStatus
  /** 排序值：数字越小越靠前 */
  sortOrder: number
  /** 技能压缩包文件路径 */
  filePath: string
  /** 创建人ID */
  createdBy: number
  /** 创建时间 */
  createdAt: string
  /** 更新人ID */
  updatedBy?: number
  /** 更新时间 */
  updatedAt: string
  /** 关联会话 ID（前端使用，非数据库字段） */
  sessionId?: string
}

export type CreateSkillRequest = Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateSkillRequest = Partial<Omit<Skill, 'id' | 'skillId' | 'createdAt' | 'updatedAt'>>

/**
 * Mock 技能数据集
 * 包含多个示例技能，覆盖不同状态和类型
 *
 * 边界测试场景：
 * - skill_006: 最小化数据（空标签数组）
 * - skill_007: 最大化数据（长描述、多标签）
 * - skill_008: 特殊字符测试（emoji、中英文混合）
 */
export const mockSkills: Skill[] = [
  {
    id: 1,
    skillId: 'skill_001',
    name: 'PostgreSQL 故障诊断',
    description: '自动分析 PostgreSQL 数据库的性能问题，包括慢查询、锁等待、连接池状态等。',
    iconPath: '🐘',
    category: 'database',
    tags: ['postgres', '故障分析', '锁分析'],
    status: SkillStatus.ACTIVE,
    sortOrder: 1,
    filePath: '/skills/postgresql-diagnostics.zip',
    createdBy: 1001,
    createdAt: '2024-07-02T08:00:00Z',
    updatedAt: '2024-07-02T08:00:00Z',
    sessionId: 'session_xyz123',
  },
  {
    id: 2,
    skillId: 'skill_002',
    name: 'Redis 缓存优化',
    description: '分析 Redis 缓存命中率，提供优化建议，支持多种数据结构分析。',
    iconPath: '🔴',
    category: 'cache',
    tags: ['redis', '缓存', '性能优化'],
    status: SkillStatus.ACTIVE,
    sortOrder: 2,
    filePath: '/skills/redis-optimization.zip',
    createdBy: 1002,
    createdAt: '2024-07-05T10:30:00Z',
    updatedAt: '2024-07-05T10:30:00Z',
    sessionId: 'session_abc456',
  },
  {
    id: 3,
    skillId: 'skill_003',
    name: 'Kubernetes 集群监控',
    description: '实时监控 K8s 集群状态，包括 Pod 健康、资源使用、网络流量等。',
    iconPath: '☸️',
    category: 'devops',
    tags: ['kubernetes', '监控', 'devops'],
    status: SkillStatus.ACTIVE,
    sortOrder: 3,
    filePath: '/skills/k8s-monitoring.zip',
    createdBy: 1003,
    createdAt: '2024-07-10T14:20:00Z',
    updatedAt: '2024-07-10T14:20:00Z',
    sessionId: 'session_def789',
  },
  {
    id: 4,
    skillId: 'skill_004',
    name: 'API 性能测试',
    description: '自动化 API 性能测试，生成压测报告，支持多种协议。',
    iconPath: '⚡',
    category: 'testing',
    tags: ['api', '性能测试', '压测'],
    status: SkillStatus.ACTIVE,
    sortOrder: 4,
    filePath: '/skills/api-performance-test.zip',
    createdBy: 1004,
    createdAt: '2024-07-15T09:45:00Z',
    updatedAt: '2024-07-15T09:45:00Z',
    sessionId: 'session_ghi012',
  },
  {
    id: 5,
    skillId: 'skill_005',
    name: '日志分析助手',
    description: '智能分析应用日志，识别异常模式，提供故障定位建议。',
    iconPath: '📊',
    category: 'monitoring',
    tags: ['日志', '分析', '故障排查'],
    status: SkillStatus.ACTIVE,
    sortOrder: 5,
    filePath: '/skills/log-analyzer.zip',
    createdBy: 1005,
    createdAt: '2024-07-20T16:00:00Z',
    updatedAt: '2024-07-20T16:00:00Z',
    sessionId: 'session_jkl345',
  },
  // 边界测试数据
  {
    id: 6,
    skillId: 'skill_006',
    name: '最小化技能',
    description: '测试最小数据集',
    iconPath: '🔧',
    category: 'test',
    tags: [],
    status: SkillStatus.ACTIVE,
    sortOrder: 6,
    filePath: '/skills/minimal-test.zip',
    createdBy: 9999,
    createdAt: '2024-07-25T12:00:00Z',
    updatedAt: '2024-07-25T12:00:00Z',
    sessionId: 'session_test001',
  },
  {
    id: 7,
    skillId: 'skill_007',
    name: '最大化技能测试 - 包含超长名称和复杂场景的综合测试用例',
    description: '这是一个用于测试最大数据量的技能描述。它包含了非常详细的说明文字，用于验证系统在处理长文本时的表现。该技能模拟了真实场景中可能出现的复杂描述，包括多个功能点、技术细节、使用场景等信息。通过这个测试用例，我们可以确保前端界面能够正确处理和显示长文本内容，同时验证数据库字段长度限制、API 传输性能等方面的表现。',
    iconPath: '🚀',
    category: 'test',
    tags: ['测试', 'test', '边界', 'boundary', '最大值', 'max', '性能', 'performance', '长文本', 'long-text'],
    status: SkillStatus.ACTIVE,
    sortOrder: 7,
    filePath: '/skills/max-test-very-long-filename-for-testing-purposes.zip',
    createdBy: 9999,
    createdAt: '2024-07-26T13:30:00Z',
    updatedBy: 9999,
    updatedAt: '2024-07-26T15:45:00Z',
    sessionId: 'session_test002',
  },
  {
    id: 8,
    skillId: 'skill_008',
    name: 'Special Characters & Emoji 🎉 测试',
    description: '特殊字符测试：!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`，中英文混合 Mixed Content，Emoji 🔥💡✨🎯',
    iconPath: '🌟',
    category: 'test',
    tags: ['special-chars', '特殊字符', 'emoji-🎨', 'test_case'],
    status: SkillStatus.ACTIVE,
    sortOrder: 8,
    filePath: '/skills/special-chars-test.zip',
    createdBy: 9999,
    createdAt: '2024-07-27T10:15:00Z',
    updatedAt: '2024-07-27T10:15:00Z',
    sessionId: 'session_test-003',
  },
]

/**
 * 技能关联会话 Mock 数据
 */
export interface SessionSkill {
  sessionId: string
  sessionTitle: string
  createdAt: string
}

/**
 * Mock 技能关联会话数据
 * 每个技能可能有多个关联会话
 */
export const mockSessionSkills: Record<string, SessionSkill[]> = {
  'skill_001': [
    {
      sessionId: 'session_xyz123',
      sessionTitle: 'PostgreSQL 性能优化会话',
      createdAt: '2024-07-02T08:00:00Z',
    },
    {
      sessionId: 'session_xyz456',
      sessionTitle: '数据库故障排查',
      createdAt: '2024-07-10T14:30:00Z',
    },
  ],
  'skill_002': [
    {
      sessionId: 'session_abc456',
      sessionTitle: 'Redis 缓存优化分析',
      createdAt: '2024-07-05T10:30:00Z',
    },
  ],
  'skill_004': [
    {
      sessionId: 'session_ghi012',
      sessionTitle: 'API 性能测试会话',
      createdAt: '2024-07-15T09:45:00Z',
    },
    {
      sessionId: 'session_ghi789',
      sessionTitle: '接口压测报告生成',
      createdAt: '2024-07-20T16:20:00Z',
    },
  ],
}
