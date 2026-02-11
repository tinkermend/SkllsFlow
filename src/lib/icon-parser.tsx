/**
 * 图标解析工具
 * 将数据库中存储的图标字符串（如 "Code2"）转换为 React 图标组件
 */
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * 解析图标字符串，返回对应的 Lucide 图标组件
 * @param iconString - 图标字符串，格式: "Code2", "BarChart3" 等 PascalCase 格式
 * @returns Lucide 图标组件，如果未找到则返回默认图标
 */
export function parseIcon(iconString: string | null | undefined): LucideIcon {
  // 默认图标
  const defaultIcon = LucideIcons.Package

  if (!iconString) {
    return defaultIcon
  }

  // 直接从 lucide-react 中查找对应的图标组件
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[iconString]

  return IconComponent || defaultIcon
}
