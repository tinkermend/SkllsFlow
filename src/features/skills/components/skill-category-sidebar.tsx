import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SkillFilterOption } from '../utils/skills-filtering'

interface SkillCategorySidebarProps {
  categories: SkillFilterOption[]
  selectedCategory: string
  totalCount: number
  onCategorySelect: (category: string) => void
}

export function SkillCategorySidebar({
  categories,
  selectedCategory,
  totalCount,
  onCategorySelect,
}: SkillCategorySidebarProps) {
  return (
    <div className='space-y-1'>
      <Button
        variant={!selectedCategory ? 'secondary' : 'ghost'}
        className='w-full justify-between'
        onClick={() => onCategorySelect('')}
      >
        <span>全部</span>
        <Badge variant='outline' className='ml-2'>
          {totalCount}
        </Badge>
      </Button>

      {categories.map((category) => (
        <Button
          key={category.value}
          variant={selectedCategory === category.value ? 'secondary' : 'ghost'}
          className='w-full justify-between'
          onClick={() => onCategorySelect(category.value)}
        >
          <span className='truncate'>{category.label}</span>
          <Badge variant='outline' className='ml-2'>
            {category.count}
          </Badge>
        </Button>
      ))}
    </div>
  )
}
