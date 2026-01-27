import { MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SkillStatus, type Skill } from '../types'

interface SkillCardProps {
  skill: Skill
  onViewDetails?: (skillId: string) => void
  onUninstall?: (skillId: string) => void
}

export function SkillCard({ skill, onViewDetails, onUninstall }: SkillCardProps) {
  const statusConfig = {
    [SkillStatus.ONLINE]: {
      label: '在线',
      variant: 'default' as const,
      className: 'bg-green-500 hover:bg-green-600',
    },
    [SkillStatus.DISABLED]: {
      label: '已禁用',
      variant: 'secondary' as const,
      className: 'bg-gray-400 hover:bg-gray-500',
    },
  }

  const config = statusConfig[skill.status]

  return (
    <Card className="group transition-shadow hover:shadow-md">
      {/* Header: Logo + 名称 + 状态 */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
              {skill.icon}
            </div>
            {/* 名称 */}
            <CardTitle className="text-base font-semibold leading-tight truncate">
              {skill.name}
            </CardTitle>
          </div>
          {/* 状态标签 */}
          <Badge variant={config.variant} className={config.className}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      {/* 描述 */}
      <CardContent className="pb-3">
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
          {skill.description}
        </CardDescription>
      </CardContent>

      {/* 信息区域 */}
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span className="font-medium">创建者：</span>
            <span>{skill.creator}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">创建日期：</span>
            <span>{skill.createdAt}</span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span className="font-medium">关联会话：</span>
            <span className="truncate ml-2">{skill.sessionId}</span>
          </div>
        </div>
      </CardContent>

      {/* Footer: 标签 + 操作按钮 */}
      <CardFooter className="flex items-center justify-between pt-3 border-t">
        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 操作菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">打开菜单</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails?.(skill.id)}>
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUninstall?.(skill.id)}
              className="text-destructive focus:text-destructive"
            >
              卸载技能
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}
