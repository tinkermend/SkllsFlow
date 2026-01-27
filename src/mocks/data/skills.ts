/**
 * Skill Mock 数据
 *
 * 如何修改此文件：
 * 1. 添加新技能：在 mockSkills 数组中添加新对象
 * 2. 修改字段：直接修改对应的字段值
 * 3. 确保 id 以 'skill_' 开头
 * 4. status 必须是 'online' | 'disabled'
 */

export enum SkillStatus {
  ONLINE = 'online',
  DISABLED = 'disabled',
}

export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  status: SkillStatus
  creator: string
  createdAt: string
  sessionId: string
  tags: string[]
}

export type CreateSkillRequest = Omit<Skill, 'id'>
export type UpdateSkillRequest = Partial<Omit<Skill, 'id'>>

/**
 * Mock 技能数据集
 * 包含 5 个示例技能，覆盖不同状态和类型
 *
 * 边界测试场景：
 * - skill_006: 最小化数据（空标签数组）
 * - skill_007: 最大化数据（长描述、多标签）
 * - skill_008: 特殊字符测试（emoji、中英文混合）
 */
export const mockSkills: Skill[] = [
  {
    id: 'skill_001',
    name: 'PostgreSQL 故障诊断',
    description: '自动分析 PostgreSQL 数据库的性能问题，包括慢查询、锁等待、连接池状态等。',
    icon: '🐘',
    status: SkillStatus.ONLINE,
    creator: '张三',
    createdAt: '2024-07-02',
    sessionId: 'session_xyz123',
    tags: ['postgres', '故障分析', '锁分析'],
  },
  {
    id: 'skill_002',
    name: 'Redis 缓存优化',
    description: '分析 Redis 缓存命中率，提供优化建议，支持多种数据结构分析。',
    icon: '🔴',
    status: SkillStatus.ONLINE,
    creator: '李四',
    createdAt: '2024-07-05',
    sessionId: 'session_abc456',
    tags: ['redis', '缓存', '性能优化'],
  },
  {
    id: 'skill_003',
    name: 'Kubernetes 集群监控',
    description: '实时监控 K8s 集群状态，包括 Pod 健康、资源使用、网络流量等。',
    icon: '☸️',
    status: SkillStatus.DISABLED,
    creator: '王五',
    createdAt: '2024-07-10',
    sessionId: 'session_def789',
    tags: ['kubernetes', '监控', 'devops'],
  },
  {
    id: 'skill_004',
    name: 'API 性能测试',
    description: '自动化 API 性能测试，生成压测报告，支持多种协议。',
    icon: '⚡',
    status: SkillStatus.ONLINE,
    creator: '赵六',
    createdAt: '2024-07-15',
    sessionId: 'session_ghi012',
    tags: ['api', '性能测试', '压测'],
  },
  {
    id: 'skill_005',
    name: '日志分析助手',
    description: '智能分析应用日志，识别异常模式，提供故障定位建议。',
    icon: '📊',
    status: SkillStatus.DISABLED,
    creator: '孙七',
    createdAt: '2024-07-20',
    sessionId: 'session_jkl345',
    tags: ['日志', '分析', '故障排查'],
  },
  // 边界测试数据
  {
    id: 'skill_006',
    name: '最小化技能',
    description: '测试最小数据集',
    icon: '🔧',
    status: SkillStatus.ONLINE,
    creator: '测试用户',
    createdAt: '2024-07-25',
    sessionId: 'session_test001',
    tags: [],
  },
  {
    id: 'skill_007',
    name: '最大化技能测试 - 包含超长名称和复杂场景的综合测试用例',
    description: '这是一个用于测试最大数据量的技能描述。它包含了非常详细的说明文字，用于验证系统在处理长文本时的表现。该技能模拟了真实场景中可能出现的复杂描述，包括多个功能点、技术细节、使用场景等信息。通过这个测试用例，我们可以确保前端界面能够正确处理和显示长文本内容，同时验证数据库字段长度限制、API 传输性能等方面的表现。',
    icon: '🚀',
    status: SkillStatus.ONLINE,
    creator: '测试管理员',
    createdAt: '2024-07-26',
    sessionId: 'session_test002',
    tags: ['测试', 'test', '边界', 'boundary', '最大值', 'max', '性能', 'performance', '长文本', 'long-text'],
  },
  {
    id: 'skill_008',
    name: 'Special Characters & Emoji 🎉 测试',
    description: '特殊字符测试：!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`，中英文混合 Mixed Content，Emoji 🔥💡✨🎯',
    icon: '🌟',
    status: SkillStatus.DISABLED,
    creator: 'Test-User_123',
    createdAt: '2024-07-27',
    sessionId: 'session_test-003',
    tags: ['special-chars', '特殊字符', 'emoji-🎨', 'test_case'],
  },
]
