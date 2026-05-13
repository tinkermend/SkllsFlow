/**
 * 图标解析工具
 * 将数据库中存储的图标字符串（如 "Code2"）转换为 React 图标组件
 */
import {
  BarChart3,
  Blocks,
  Bot,
  ChartColumn,
  Code,
  Code2,
  Database,
  Github,
  Package,
  Server,
  Shield,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP = {
  BarChart3,
  Blocks,
  Bot,
  ChartColumn,
  Code,
  Code2,
  Database,
  Github,
  Package,
  Server,
  Shield,
  ShieldCheck,
} satisfies Record<string, LucideIcon>

const DEFAULT_ICON = Package

/**
 * 解析图标字符串，返回对应的 Lucide 图标组件
 * @param iconString - 图标字符串，格式: "Code2", "BarChart3" 等 PascalCase 格式
 * @returns Lucide 图标组件，如果未找到则返回默认图标
 */
export function parseIcon(iconString: string | null | undefined): LucideIcon {
  if (!iconString) {
    return DEFAULT_ICON
  }

  // 兼容 "lucide:chart-column"、"chart-column"、"ChartColumn" 等格式
  const normalized = iconString
    .replace(/^lucide:/i, '')
    .replace(/(^\w|[-_\s]\w)/g, (match) =>
      match.replace(/[-_\s]/g, '').toUpperCase()
    )

  const iconMap = ICON_MAP as Record<string, LucideIcon>
  const IconComponent = iconMap[iconString] || iconMap[normalized]

  return IconComponent || DEFAULT_ICON
}

export function getSupportedIconNames(): string[] {
  return Object.keys(ICON_MAP)
}
