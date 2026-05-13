export interface SkillCategoryOption {
  value: string
  label: string
}

export const SKILL_CATEGORIES: SkillCategoryOption[] = [
  { value: 'observability', label: '可观测性' },
  { value: 'incident-response', label: '事件响应' },
  { value: 'database-ops', label: '数据库运维' },
  { value: 'middleware-ops', label: '中间件运维' },
  { value: 'infrastructure-ops', label: '基础设施运维' },
  { value: 'traffic-ops', label: '流量运维' },
  { value: 'delivery-ops', label: '交付运维' },
  { value: 'cloud-native', label: '云原生' },
  { value: 'cloud-finops', label: '云成本治理' },
  { value: 'code-analysis', label: '代码分析' },
  { value: 'data-processing', label: '数据处理' },
  { value: 'database', label: '数据库' },
  { value: 'cache', label: '缓存' },
  { value: 'devops', label: 'DevOps' },
  { value: 'testing', label: '测试' },
  { value: 'test', label: '测试' },
  { value: 'monitoring', label: '监控' },
  { value: 'security', label: '安全' },
  { value: 'other', label: '其他' },
]

const SKILL_CATEGORY_LABELS = new Map(
  SKILL_CATEGORIES.map((category) => [category.value, category.label])
)

export function getSkillCategoryLabel(category: string): string {
  return SKILL_CATEGORY_LABELS.get(category) ?? category
}
