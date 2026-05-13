import type { Skill } from '../types'

export interface SkillFilters {
  name: string
  createdFrom: string
  createdTo: string
  creator: string
  category: string
}

export interface SkillFilterOption {
  value: string
  label: string
  count: number
}

export const emptySkillFilters: SkillFilters = {
  name: '',
  createdFrom: '',
  createdTo: '',
  creator: '',
  category: '',
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase()
}

function isSameOrAfterDate(value: string, date: string): boolean {
  if (!date) return true

  return new Date(value).getTime() >= new Date(`${date}T00:00:00`).getTime()
}

function isSameOrBeforeDate(value: string, date: string): boolean {
  if (!date) return true

  return new Date(value).getTime() <= new Date(`${date}T23:59:59.999`).getTime()
}

function resolveFilters(filters: Partial<SkillFilters>): SkillFilters {
  return {
    ...emptySkillFilters,
    ...filters,
  }
}

export function hasActiveSkillFilters(filters: Partial<SkillFilters>): boolean {
  const resolvedFilters = resolveFilters(filters)

  return (
    Boolean(resolvedFilters.name.trim()) ||
    Boolean(resolvedFilters.createdFrom) ||
    Boolean(resolvedFilters.createdTo) ||
    Boolean(resolvedFilters.creator) ||
    Boolean(resolvedFilters.category)
  )
}

export function filterSkills(
  skills: Skill[],
  filters: Partial<SkillFilters>
): Skill[] {
  const resolvedFilters = resolveFilters(filters)
  const name = normalize(resolvedFilters.name)
  const creator = normalize(resolvedFilters.creator)
  const category = normalize(resolvedFilters.category)

  return skills.filter((skill) => {
    const matchesName =
      !name ||
      normalize(skill.name).includes(name) ||
      normalize(skill.skillId).includes(name)

    const matchesCreator = !creator || normalize(skill.creatorName).includes(creator)
    const matchesCategory = !category || normalize(skill.category) === category
    const matchesCreatedFrom = isSameOrAfterDate(
      skill.createdAt,
      resolvedFilters.createdFrom
    )
    const matchesCreatedTo = isSameOrBeforeDate(
      skill.createdAt,
      resolvedFilters.createdTo
    )

    return (
      matchesName &&
      matchesCreator &&
      matchesCategory &&
      matchesCreatedFrom &&
      matchesCreatedTo
    )
  })
}

function buildOptions(values: string[]): SkillFilterOption[] {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return acc
    acc[trimmedValue] = (acc[trimmedValue] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function buildSkillFilterOptions(skills: Skill[]): {
  categories: SkillFilterOption[]
  creators: SkillFilterOption[]
} {
  return {
    categories: buildOptions(skills.map((skill) => skill.category)),
    creators: buildOptions(
      skills
        .map((skill) => skill.creatorName)
        .filter((creator): creator is string => Boolean(creator))
    ),
  }
}
