import express, { type Router as RouterType } from 'express'
import type { CreateSkillRequest, UpdateSkillRequest, Skill } from '../types/skill.types'
import { SkillStatus } from '../types/skill.types'

const router: RouterType = express.Router()

// 模拟数据库存储
const skills: Skill[] = [
  {
    id: 'skill_001',
    name: 'PostgreSQL 故障诊断',
    description: '自动分析 PostgreSQL 数据库的性能问题，包括慢查询、锁等待、连接池状态等，提供优化建议和解决方案。',
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
    description: '监控 Redis 缓存命中率，分析热点数据，提供缓存策略优化建议，支持缓存穿透和雪崩问题诊断。',
    icon: '🔴',
    status: SkillStatus.ONLINE,
    creator: '李四',
    createdAt: '2024-06-28',
    sessionId: 'session_abc456',
    tags: ['redis', '缓存', '性能优化'],
  },
]

/**
 * GET /api/skills
 * 获取技能列表
 */
router.get('/', (req, res) => {
  res.json(skills)
})

/**
 * GET /api/skills/:id
 * 获取技能详情
 */
router.get('/:id', (req, res) => {
  const { id } = req.params
  const skill = skills.find((s) => s.id === id)

  if (!skill) {
    return res.status(404).json({ error: 'Skill not found' })
  }

  res.json(skill)
})

/**
 * POST /api/skills
 * 创建技能
 */
router.post('/', (req, res) => {
  const data: CreateSkillRequest = req.body

  const newSkill: Skill = {
    ...data,
    id: `skill_${Date.now()}`,
  }

  skills.push(newSkill)
  res.status(201).json(newSkill)
})

/**
 * PATCH /api/skills/:id
 * 更新技能
 */
router.patch('/:id', (req, res) => {
  const { id } = req.params
  const data: UpdateSkillRequest = req.body

  const index = skills.findIndex((s) => s.id === id)
  if (index === -1) {
    return res.status(404).json({ error: 'Skill not found' })
  }

  skills[index] = { ...skills[index], ...data }
  res.json(skills[index])
})

/**
 * DELETE /api/skills/:id
 * 删除技能
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params

  const index = skills.findIndex((s) => s.id === id)
  if (index === -1) {
    return res.status(404).json({ error: 'Skill not found' })
  }

  skills.splice(index, 1)
  res.status(204).send()
})

export default router
