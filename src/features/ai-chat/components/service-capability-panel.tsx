import type React from 'react'
import { Bot, Boxes, PlugZap, RefreshCw, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { getSkillCategoryLabel } from '@/features/skills/config/skill-categories'
import { cn } from '@/lib/utils'
import type {
  ChatServerCapabilityMcp,
  ChatServerCapabilitySkill,
} from '../types'
import { useServiceCapabilities } from '../hooks/use-service-capabilities'

interface ServiceCapabilityPanelProps {
  chatId?: string | null
  serviceName?: string
}

export function ServiceCapabilityPanel({
  chatId,
  serviceName,
}: ServiceCapabilityPanelProps) {
  const { data, isError, isFetching, isLoading, refetch } =
    useServiceCapabilities(chatId)

  const skills = data?.skills ?? []
  const mcps = data?.mcps ?? []
  const totalCount = skills.length + mcps.length

  return (
    <aside className='hidden h-full w-80 shrink-0 border-l bg-muted/20 xl:flex xl:flex-col'>
      <div className='border-b p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-sm font-semibold'>
              <Sparkles className='size-4 text-primary' />
              服务能力
            </div>
            <p className='line-clamp-1 text-xs text-muted-foreground'>
              {serviceName || '请选择智能服务'}
            </p>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='size-8'
            disabled={!chatId || isFetching}
            onClick={() => refetch()}
            aria-label='刷新服务能力'
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        <div className='space-y-4 p-4'>
          {!chatId ? (
            <EmptyState
              icon={Bot}
              title='未选择智能服务'
              description='点击左侧智能服务后，这里会显示该服务已加载的技能和 MCP。'
            />
          ) : isLoading ? (
            <CapabilitySkeleton />
          ) : isError ? (
            <Alert variant='destructive'>
              <AlertTitle>能力信息加载失败</AlertTitle>
              <AlertDescription>
                请检查服务权限或稍后重试。
              </AlertDescription>
            </Alert>
          ) : totalCount === 0 ? (
            <EmptyState
              icon={Boxes}
              title='暂无已加载能力'
              description='当前智能服务还没有关联技能或 MCP。'
            />
          ) : (
            <>
              <CapabilitySummary skillsCount={skills.length} mcpsCount={mcps.length} />
              <CapabilitySection
                title='技能列表'
                count={skills.length}
                icon={Sparkles}
                emptyText='暂未加载技能'
              >
                {skills.map((skill) => (
                  <SkillItem key={skill.id} skill={skill} />
                ))}
              </CapabilitySection>
              <CapabilitySection
                title='MCP 列表'
                count={mcps.length}
                icon={PlugZap}
                emptyText='暂未加载 MCP'
              >
                {mcps.map((mcp) => (
                  <McpItem key={mcp.id} mcp={mcp} />
                ))}
              </CapabilitySection>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}

function CapabilitySummary({
  skillsCount,
  mcpsCount,
}: {
  skillsCount: number
  mcpsCount: number
}) {
  return (
    <div className='grid grid-cols-2 gap-3'>
      <div className='rounded-xl border bg-card p-3'>
        <div className='text-2xl font-semibold'>{skillsCount}</div>
        <div className='text-xs text-muted-foreground'>已加载技能</div>
      </div>
      <div className='rounded-xl border bg-card p-3'>
        <div className='text-2xl font-semibold'>{mcpsCount}</div>
        <div className='text-xs text-muted-foreground'>已加载 MCP</div>
      </div>
    </div>
  )
}

function CapabilitySection({
  title,
  count,
  icon: Icon,
  emptyText,
  children,
}: {
  title: string
  count: number
  icon: React.ElementType
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <Card className='gap-3 py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='flex items-center justify-between text-sm'>
          <span className='flex items-center gap-2'>
            <Icon className='size-4 text-muted-foreground' />
            {title}
          </span>
          <Badge variant='secondary'>{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 px-4'>
        {count === 0 ? (
          <p className='rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground'>
            {emptyText}
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

function SkillItem({ skill }: { skill: ChatServerCapabilitySkill }) {
  return (
    <div className='rounded-lg border bg-background/70 p-3'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <div className='truncate text-sm font-medium'>{skill.name}</div>
          <div className='mt-1 truncate text-xs text-muted-foreground'>
            {skill.description || skill.skillId}
          </div>
        </div>
        <Badge variant='outline' className='shrink-0 text-[10px]'>
          {getSkillCategoryLabel(skill.category)}
        </Badge>
      </div>
    </div>
  )
}

function McpItem({ mcp }: { mcp: ChatServerCapabilityMcp }) {
  return (
    <div className='rounded-lg border bg-background/70 p-3'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <div className='truncate text-sm font-medium'>{mcp.name}</div>
          <div className='mt-1 truncate text-xs text-muted-foreground'>
            {mcp.description || mcp.mcpId}
          </div>
        </div>
        <Badge variant='outline' className='shrink-0 text-[10px]'>
          {mcp.transportType}
        </Badge>
      </div>
      {mcp.language && (
        <div className='mt-2 text-[11px] text-muted-foreground'>
          {mcp.language}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className='rounded-xl border border-dashed bg-card/50 p-6 text-center'>
      <Icon className='mx-auto mb-3 size-8 text-muted-foreground/60' />
      <div className='text-sm font-medium'>{title}</div>
      <p className='mt-2 text-xs leading-5 text-muted-foreground'>{description}</p>
    </div>
  )
}

function CapabilitySkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <Skeleton className='h-20' />
        <Skeleton className='h-20' />
      </div>
      <Skeleton className='h-48' />
      <Skeleton className='h-48' />
    </div>
  )
}
