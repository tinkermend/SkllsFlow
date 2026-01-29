/**
 * 测试图标解析功能
 */
import { parseIcon } from '../src/lib/icon-parser'

console.log('=== 测试图标解析功能 ===\n')

// 测试用例（数据库中的新格式）
const testCases = [
  'Code2',
  'BarChart3',
  'Package',
  'Settings',
  'InvalidIconName',
  null,
  undefined,
]

testCases.forEach((iconString) => {
  const IconComponent = parseIcon(iconString as string)
  console.log(`输入: "${iconString}"`)
  console.log(`输出: ${IconComponent.displayName || IconComponent.name}`)
  console.log('---')
})

console.log('\n✅ 测试完成！')
