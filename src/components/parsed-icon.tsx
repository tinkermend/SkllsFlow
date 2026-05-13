import { type LucideIcon } from 'lucide-react'
import { parseIcon } from '@/lib/icon-parser'

type ParsedIconProps = {
  name?: string | null
  fallback?: LucideIcon
  className?: string
}

export function ParsedIcon({ name, fallback, className }: ParsedIconProps) {
  const Icon = name ? parseIcon(name) : fallback
  if (!Icon) return null

  // Icon selection is data-driven and intentionally stable through parseIcon's
  // allowlist. The rule cannot infer that dynamic lookup boundary.
  // eslint-disable-next-line react-hooks/static-components
  return <Icon className={className} />
}
