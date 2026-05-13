import { describe, expect, it } from 'vitest'
import { SkillStatus, type Skill } from '../types'
import {
  buildSkillFilterOptions,
  filterSkills,
  type SkillFilters,
} from './skills-filtering'

const baseSkill: Skill = {
  id: 1,
  skillId: 'base-skill',
  name: 'Base Skill',
  description: 'Base description',
  icon: null,
  category: 'general',
  tags: [],
  status: SkillStatus.ACTIVE,
  sortOrder: 0,
  createdBy: 1,
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedBy: null,
  updatedAt: '2026-05-01T10:00:00.000Z',
  creatorName: 'alice',
}

function makeSkill(overrides: Partial<Skill>): Skill {
  return {
    ...baseSkill,
    ...overrides,
  }
}

describe('skills filtering', () => {
  it('filters by name, creator, category and date range together', () => {
    const skills = [
      makeSkill({
        id: 1,
        skillId: 'code-review',
        name: '代码审查助手',
        category: 'code-analysis',
        tags: ['review', 'typescript'],
        creatorName: 'alice',
        createdAt: '2026-05-10T08:00:00.000Z',
      }),
      makeSkill({
        id: 2,
        skillId: 'data-cleaner',
        name: '数据清洗助手',
        category: 'data-processing',
        tags: ['etl'],
        creatorName: 'bob',
        createdAt: '2026-05-11T08:00:00.000Z',
      }),
      makeSkill({
        id: 3,
        skillId: 'code-writer',
        name: '代码生成助手',
        category: 'code-analysis',
        tags: ['typescript'],
        creatorName: 'alice',
        createdAt: '2026-04-30T08:00:00.000Z',
      }),
    ]

    const filters: SkillFilters = {
      name: '代码',
      creator: 'alice',
      category: 'code-analysis',
      createdFrom: '2026-05-01',
      createdTo: '2026-05-10',
    }

    expect(filterSkills(skills, filters).map((skill) => skill.skillId)).toEqual([
      'code-review',
    ])
  })

  it('matches name filter against skill name and skill id case-insensitively', () => {
    const skills = [
      makeSkill({ id: 1, skillId: 'report-writer', name: '报告助手' }),
      makeSkill({ id: 2, skillId: 'data-cleaner', name: '数据清洗助手' }),
    ]

    expect(filterSkills(skills, { name: 'REPORT' }).map((skill) => skill.skillId)).toEqual([
      'report-writer',
    ])
  })

  it('builds sorted category and creator options with usage counts', () => {
    const skills = [
      makeSkill({
        id: 1,
        category: 'code-analysis',
        tags: ['typescript', 'review'],
        creatorName: 'alice',
      }),
      makeSkill({
        id: 2,
        category: 'code-analysis',
        tags: ['typescript'],
        creatorName: 'bob',
      }),
      makeSkill({
        id: 3,
        category: 'data-processing',
        tags: ['etl'],
        creatorName: null,
      }),
    ]

    expect(buildSkillFilterOptions(skills)).toEqual({
      categories: [
        { value: 'code-analysis', label: 'code-analysis', count: 2 },
        { value: 'data-processing', label: 'data-processing', count: 1 },
      ],
      creators: [
        { value: 'alice', label: 'alice', count: 1 },
        { value: 'bob', label: 'bob', count: 1 },
      ],
    })
  })
})
