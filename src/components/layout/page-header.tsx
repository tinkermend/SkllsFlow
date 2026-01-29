import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
  stackActions?: boolean
}

export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
  stackActions = false,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        stackActions && 'sm:flex-col sm:items-start',
        className
      )}
    >
      <div className='max-w-3xl space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
        {description ? (
          <p className='text-base text-muted-foreground'>{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className='flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row'>
          {actions}
        </div>
      ) : null}
    </section>
  )
}
