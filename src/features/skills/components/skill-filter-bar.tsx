import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  SkillFilterOption,
  SkillFilters,
} from '../utils/skills-filtering'

interface SkillFilterBarProps {
  filters: SkillFilters
  categories: SkillFilterOption[]
  creators: SkillFilterOption[]
  hasActiveFilters: boolean
  onFiltersChange: (filters: SkillFilters) => void
  onReset: () => void
}

const ALL_VALUE = '__all__'

function optionLabel(option: SkillFilterOption): string {
  return `${option.label} (${option.count})`
}

export function SkillFilterBar({
  filters,
  categories,
  creators,
  hasActiveFilters,
  onFiltersChange,
  onReset,
}: SkillFilterBarProps) {
  const updateFilters = (patch: Partial<SkillFilters>) => {
    onFiltersChange({
      ...filters,
      ...patch,
    })
  }

  return (
    <div className='rounded-xl border bg-card p-4 shadow-xs'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative min-w-[220px] flex-[1_1_280px]'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={filters.name}
            onChange={(event) => updateFilters({ name: event.target.value })}
            placeholder='按名称或技能 ID 搜索'
            className='pl-9'
          />
        </div>

        <Input
          type='date'
          className='w-full min-w-[150px] sm:w-[170px]'
          value={filters.createdFrom}
          onChange={(event) =>
            updateFilters({ createdFrom: event.target.value })
          }
          aria-label='创建开始日期'
        />

        <Input
          type='date'
          className='w-full min-w-[150px] sm:w-[170px]'
          value={filters.createdTo}
          onChange={(event) => updateFilters({ createdTo: event.target.value })}
          aria-label='创建结束日期'
        />

        <Select
          value={filters.creator || ALL_VALUE}
          onValueChange={(value) =>
            updateFilters({ creator: value === ALL_VALUE ? '' : value })
          }
        >
          <SelectTrigger className='w-full min-w-[150px] sm:w-[170px]'>
            <SelectValue placeholder='创建者' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>全部创建者</SelectItem>
            {creators.map((creator) => (
              <SelectItem key={creator.value} value={creator.value}>
                {optionLabel(creator)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category || ALL_VALUE}
          onValueChange={(value) =>
            updateFilters({ category: value === ALL_VALUE ? '' : value })
          }
        >
          <SelectTrigger className='w-full min-w-[150px] sm:w-[170px]'>
            <SelectValue placeholder='技能分类' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>全部分类</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {optionLabel(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type='button'
          variant='outline'
          onClick={onReset}
          disabled={!hasActiveFilters}
          className='w-full gap-2 sm:w-auto'
        >
          <X className='h-4 w-4' />
          重置
        </Button>
      </div>
    </div>
  )
}
